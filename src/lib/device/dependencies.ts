/**
 * Sample-usage analysis — "which installed samples are actually used by a program".
 *
 * This is exactly how Nord Sound Manager computes used/unused: it does NOT parse
 * program bodies. It asks the keyboard for each program's sample dependency list
 * (`CQryFileGetDependency` 0x28 → 0x29) and reconciles those against the installed
 * sample partition (the 0x28 request).
 *
 * Because the device returns each dependency's factory NAME directly, this needs
 * no firmware ROM table and no offline hash: it's a connected-device feature.
 */
import type { NordSession } from './session';
import { enumerateFiles, type ProgramEntry } from './transfer';
import { CQryFileGetDependency, PARTITION_SAMP_LIB, PARTITION_PIANO, PROTOCOL_VERSION } from './opcodes';
import { supportsDependencies } from './negotiate';
import { NordError } from './protocol';
import { TransportLostError } from './transport';
import { addrKey } from './reorg';
import { readAsciiFixed } from '../clavia/ascii';
import { readU32BE } from './payload-io';

/** Bounds-checked big-endian u32 — dependency replies are variable-length and may be truncated. */
function u32(payload: Uint8Array, byteOffset: number): number {
  if (byteOffset + 4 > payload.length) throw new NordError('dependency reply truncated');
  return readU32BE(payload, byteOffset);
}

/** One sample a program depends on (a `CRpyFileGetDependency` 0x29 entry). */
export interface SampleDep {
  /** Device reports the referenced sample is present/loaded (`found=1`) or absent (`found=0`). */
  present: boolean;
  /** The sample's unique id (entry `id2`). Stable per sample; useful as a fingerprint. */
  id: number;
  /** Factory name + version, e.g. "Royal Grand 3D XL 6.1". */
  name: string;
}

/** A program's full sample dependency list. */
export interface FileDependencies {
  bank: number;
  slot: number;
  deps: SampleDep[];
  /** False when the reply ended before all `count` entries could be read. */
  complete: boolean;
}

/**
 * Decode a `CRpyFileGetDependency` (0x29) reply payload (status word at offset 0):
 * `{u32 status, u32 bank, u32 slot, u32 count, count × entry}`. Each entry is
 * `{u8 present, u32 id0, u32 id1, u32 id2, u32 nameLen, char name[nameLen]}`,
 * followed at FileTransfer version ≥ 9 (the Stage 3 / 4 case) by 3 more u32 —
 * 29 + nameLen bytes there, 17 + nameLen on a version 6–8 device (NSM 9.22
 * behaviour). Bounds-guarded: stops early on a
 * short/garbled tail rather than throwing, so a partial reply still yields the
 * entries it could read.
 */
export function decodeDependencyReply(payload: Uint8Array, fileTransferVersion = PROTOCOL_VERSION): FileDependencies {
  const bank = u32(payload, 4);
  const slot = u32(payload, 8);
  const count = u32(payload, 12);
  const deps: SampleDep[] = [];
  let off = 16;
  for (let i = 0; i < count; i++) {
    // Need at least present(1) + 3×u32 ids + u32 nameLen = 17 bytes for the fixed head.
    if (off + 17 > payload.length) break;
    const present = payload[off] === 1;
    const id2 = u32(payload, off + 9);
    const nameLen = u32(payload, off + 13);
    const nameStart = off + 17;
    if (nameStart + nameLen > payload.length) break;
    const name = readAsciiFixed(payload, nameStart, nameLen);
    deps.push({ present, id: id2, name });
    off = nameStart + nameLen + (fileTransferVersion >= 9 ? 12 : 0); // + 3×u32 trailing at version ≥ 9
  }
  return { bank, slot, deps, complete: deps.length === count };
}

/** Query one program's sample dependency list. Session-independent (no begin
 *  needed) — but the exchange must still run inside `session.exclusive` (the
 *  gather/scan entry points above provide it). Throws on a refused or cut-short
 *  reply: a partial list would make sounds the program uses look unused. */
export async function getDependencies(session: NordSession, bank: number, slot: number): Promise<FileDependencies> {
  const reply = await session.request(CQryFileGetDependency, [bank, slot]);
  if (reply.status !== 0) throw new NordError(`dependency query failed for ${bank}:${slot} (status ${reply.status})`);
  const result = decodeDependencyReply(reply.payload, session.fileTransferVersion);
  if (!result.complete) throw new NordError(`dependency reply for ${bank}:${slot} was cut short`);
  return result;
}

/** Shown when the connected Nord is too old to report which sounds its programs use. */
export const NO_DEPENDENCIES_MESSAGE =
  'This Nord can’t report which sounds its programs use, so OpenNord can’t tell which ones are unused.';

/** Shown when the scan could not read what every program uses. The scan then
 *  reports nothing: a program it could not read would make its sounds look unused. */
export const INCOMPLETE_SCAN_MESSAGE =
  'OpenNord couldn’t read which sounds every program on this Nord uses, so it can’t tell ' +
  'which ones are unused. Nothing was changed.';

/** What a scan that could not finish rejects with. An unplugged Nord says so
 *  itself; anything else is {@link INCOMPLETE_SCAN_MESSAGE}, with what the Nord
 *  answered kept as the cause (for the console). */
function scanFailure(cause: unknown): unknown {
  if (cause instanceof TransportLostError) return cause;
  return Object.assign(new NordError(INCOMPLETE_SCAN_MESSAGE), { cause });
}

/** List `partition`'s files in a session of its own. Throws when the Nord
 *  refuses the partition or a listed file can't be read, instead of returning a
 *  shorter list. Caller must hold `session.exclusive`. */
function listPartition(session: NordSession, partition: number): Promise<ProgramEntry[]> {
  return session.bracket(partition, () => enumerateFiles(session, Infinity, { strict: true }));
}

/** Normalize a sample name for matching program-dependency names to installed-sample names. */
export function normalizeSampleName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** The outcome of a usage analysis. */
export interface SampleUsage {
  /** Installed samples not referenced by any program — safe to remove to free space. */
  unused: ProgramEntry[];
  /** Installed samples referenced by at least one program. */
  used: ProgramEntry[];
  /** Samples referenced by a program but NOT installed (the "you're missing this" case). */
  missing: SampleDep[];
}

/**
 * Reconcile every program's dependencies against the installed samples — pure, so
 * it's fully testable without a device. Matching is by normalized name (the device
 * gives each dependency its factory name; installed samples enumerate by the same
 * name). `allDeps` is the flattened dependency list across all programs.
 */
export function computeSampleUsage(allDeps: SampleDep[], installed: ProgramEntry[]): SampleUsage {
  const usedNames = new Set(allDeps.map((d) => normalizeSampleName(d.name)));
  const installedNames = new Set(installed.map((s) => normalizeSampleName(s.name)));
  const unused: ProgramEntry[] = [];
  const used: ProgramEntry[] = [];
  for (const s of installed) {
    (usedNames.has(normalizeSampleName(s.name)) ? used : unused).push(s);
  }
  // Dedup missing by name; a sample referenced by many programs is one missing entry.
  const missing: SampleDep[] = [];
  const seenMissing = new Set<string>();
  for (const d of allDeps) {
    const key = normalizeSampleName(d.name);
    if (d.present || installedNames.has(key) || seenMissing.has(key)) continue;
    seenMissing.add(key);
    missing.push(d);
  }
  return { unused, used, missing };
}

/** Gather every program's dependency list (samples AND pianos — the reply carries
 *  both). Shared by the sample and piano usage scans. One round-trip per program.
 *  Fails closed: if any program's list can't be read in full, the whole scan
 *  rejects ({@link INCOMPLETE_SCAN_MESSAGE}), since what it returns decides
 *  which sounds are offered for removal. */
export function gatherProgramDeps(
  session: NordSession,
  onProgress?: (done: number, total: number) => void,
): Promise<SampleDep[]> {
  return session.exclusive(() => gatherProgramDepsUnlocked(session, onProgress));
}

/** Core of {@link gatherProgramDeps} — caller must hold `session.exclusive`. */
async function gatherProgramDepsUnlocked(
  session: NordSession,
  onProgress?: (done: number, total: number) => void,
): Promise<SampleDep[]> {
  // FileTransfer 5 and older (Stage Classic / EX, Electro 3, Nord Piano, C2, C2D,
  // Wave) has no dependency query: refuse before sending one it would not answer.
  if (!supportsDependencies(session.fileTransferVersion)) throw new NordError(NO_DEPENDENCIES_MESSAGE);
  try {
    const programs = await listPartition(session, session.programPartition);
    const allDeps: SampleDep[] = [];
    for (let i = 0; i < programs.length; i++) {
      const { deps } = await getDependencies(session, programs[i].bank, programs[i].slot);
      allDeps.push(...deps);
      onProgress?.(i + 1, programs.length);
    }
    return allDeps;
  } catch (cause) {
    throw scanFailure(cause);
  }
}

/** The usage scan, reconciled against the files installed in `partition`. */
function findUnused(
  session: NordSession,
  partition: number,
  onProgress?: (done: number, total: number) => void,
): Promise<SampleUsage> {
  return session.exclusive(async () => {
    const allDeps = await gatherProgramDepsUnlocked(session, onProgress);
    const installed = await listPartition(session, partition).catch((cause) => { throw scanFailure(cause); });
    return computeSampleUsage(allDeps, installed);
  });
}

/** One installed file as a scan saw it: its slot and name. Removal checks its
 *  targets against a fresh scan by this, so a slot that now holds another sound,
 *  or a sound a program has started using, is left alone. */
export function slotNameKey(file: { bank: number; slot: number; name: string }): string {
  return `${addrKey(file)}:${normalizeSampleName(file.name)}`;
}

/**
 * Full device-connected usage scan: enumerate programs, fetch each program's sample
 * dependencies, enumerate installed samples, and reconcile. One round-trip per
 * program — for a full board this is hundreds of queries, so callers should show
 * progress. `onProgress(done, total)` is called as programs are queried.
 */
export function findUnusedSamples(
  session: NordSession,
  onProgress?: (done: number, total: number) => void,
): Promise<SampleUsage> {
  return findUnused(session, PARTITION_SAMP_LIB, onProgress);
}

/** Installed pianos no program references — the dependency reply already carries
 *  piano refs, so this is the sample scan reconciled against the piano partition.
 *  `.unused` is what offload uses; `.missing` is ignored (it would include sample
 *  deps not in the piano partition). */
export function findUnusedPianos(
  session: NordSession,
  onProgress?: (done: number, total: number) => void,
): Promise<SampleUsage> {
  return findUnused(session, PARTITION_PIANO, onProgress);
}
