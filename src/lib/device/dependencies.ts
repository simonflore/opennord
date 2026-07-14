/**
 * Sample-usage analysis — "which installed samples are actually used by a program".
 *
 * This is exactly how Nord Sound Manager computes used/unused: it does NOT parse
 * program bodies. It asks the keyboard for each program's sample dependency list
 * (`CQryFileGetDependency` 0x28 → 0x29) and reconciles those against the installed
 * sample partition. Confirmed by RE of the NSM binary (`CDepWalker::GetReferences`
 * → `CFileManager::GetDependencyAsync` → the 0x28 request) — see docs/PROTOCOL-RE.md.
 *
 * Because the device returns each dependency's factory NAME directly, this needs
 * no firmware ROM table and no offline hash: it's a connected-device feature.
 */
import type { NordSession } from './session';
import { enumerateFiles, type ProgramEntry } from './transfer';
import { CQryFileGetDependency, PARTITION_SAMP_LIB, PARTITION_PIANO } from './opcodes';
import { NordError } from './protocol';
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
}

/**
 * Decode a `CRpyFileGetDependency` (0x29) reply payload (status word at offset 0):
 * `{u32 status, u32 bank, u32 slot, u32 count, count × entry}`. Each entry (protocol
 * version ≥ 9 — the NS4 case, `CDepBase::Deps_Read`) is
 * `{u8 present, u32 id0, u32 id1, u32 id2, u32 nameLen, char name[nameLen], u32 ×3}`
 * = 29 + nameLen bytes. Bounds-guarded: stops early on a short/garbled tail rather
 * than throwing, so a partial reply still yields the entries it could read.
 */
export function decodeDependencyReply(payload: Uint8Array): FileDependencies {
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
    off = nameStart + nameLen + 12; // + 3×u32 trailing (version ≥ 9)
  }
  return { bank, slot, deps };
}

/** Query one program's sample dependency list. Session-independent (no begin
 *  needed) — but the exchange must still run inside `session.exclusive` (the
 *  gather/scan entry points above provide it). */
export async function getDependencies(session: NordSession, bank: number, slot: number): Promise<FileDependencies> {
  const reply = await session.request(CQryFileGetDependency, [bank, slot]);
  if (reply.status !== 0) throw new NordError(`dependency query failed for ${bank}:${slot} (status ${reply.status})`);
  return decodeDependencyReply(reply.payload);
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
 *  both). Shared by the sample and piano usage scans. One round-trip per program;
 *  an unreadable program is skipped, not fatal. */
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
  await session.begin(session.programPartition);
  const programs = await enumerateFiles(session);
  await session.end();
  const allDeps: SampleDep[] = [];
  for (let i = 0; i < programs.length; i++) {
    const p = programs[i];
    try {
      const { deps } = await getDependencies(session, p.bank, p.slot);
      allDeps.push(...deps);
    } catch {
      // A single unreadable program shouldn't abort the whole scan; skip it.
    }
    onProgress?.(i + 1, programs.length);
  }
  return allDeps;
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
  return session.exclusive(async () => {
    const allDeps = await gatherProgramDepsUnlocked(session, onProgress);
    await session.begin(PARTITION_SAMP_LIB);
    const installed = await enumerateFiles(session);
    await session.end();
    return computeSampleUsage(allDeps, installed);
  });
}

/** Installed pianos no program references — the dependency reply already carries
 *  piano refs, so this is the sample scan reconciled against the piano partition.
 *  `.unused` is what offload uses; `.missing` is ignored (it would include sample
 *  deps not in the piano partition). */
export function findUnusedPianos(
  session: NordSession,
  onProgress?: (done: number, total: number) => void,
): Promise<SampleUsage> {
  return session.exclusive(async () => {
    const allDeps = await gatherProgramDepsUnlocked(session, onProgress);
    await session.begin(PARTITION_PIANO);
    const installed = await enumerateFiles(session);
    await session.end();
    return computeSampleUsage(allDeps, installed);
  });
}
