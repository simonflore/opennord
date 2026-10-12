import { zipSync, strToU8 } from 'fflate';
import type { NordSession } from './session';
import { readZipDirectory, extractZipEntry, type ZipEntry } from '../clavia/backup/zip-directory';
import { NordError, SessionRefusedError } from './protocol';
import { enumerateFiles, pullFile, pushFile, type ProgramEntry } from './transfer';
import { readPartitionCapacity, type PartitionCapacity } from './capacity';
import { readCbinHeader, hasCbinMagic } from '../clavia/cbin';
import { USER_PARTITIONS, partitionForPath, disambiguatePath, buildMetaXml, type PartitionSpec } from './ns4b';
import { addrKey } from './reorg';
import { getErrorMessage } from '../errors';
import { WriteBlockedError } from './write-guard';

export interface RestoreResult {
  restored: number;
  skippedFactory: number;
  /** Zip paths of factory files (npno/nsmp4) that were skipped — for resolving download links. */
  skippedFactoryFiles: string[];
  failures: { path: string; error: string }[];
}

type Progress = (done: number, total: number) => void;

/**
 * What a backup of this keyboard holds. Everything on a Stage 4; on any other
 * model only its programs, since {@link USER_PARTITIONS} are Stage 4 indices
 * and name other things there.
 */
export function backupSpecs(session: NordSession): PartitionSpec[] {
  if (session.stage4Layout) return USER_PARTITIONS;
  return [{ ...USER_PARTITIONS[0], partition: session.programPartition }];
}

/** True when {@link backup} saves everything, not just the programs. */
export function backsUpEverything(session: NordSession): boolean {
  return backupSpecs(session) === USER_PARTITIONS;
}

/** File name for a {@link backup} of this keyboard. Only a full one is a `.ns4b`
 *  (a Stage 4 backup, which Restore and Check backup read); a programs-only copy
 *  from another model is a plain zip of its program files. */
export function backupFilename(session: NordSession, title: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return backsUpEverything(session) ? `${title} ${day}.ns4b` : `${title} ${day} (programs).zip`;
}

/** Shown when the Nord won't open one of the memory areas a backup reads. */
export const BACKUP_REFUSED_MESSAGE =
  'Your Nord wouldn’t let OpenNord read part of its memory, so no backup was made. Unplug the ' +
  'USB cable and plug it back in, then try again.';

/**
 * Back up user content to a .ns4b (ZIP-store) — meta.xml + `<Folder>/Bank X/<name>.<ext>`.
 * Read-only on the device. Manages a begin/end session per partition, then
 * re-begins the Program partition so the caller's browser session is intact.
 * Each file keeps the extension the Nord reports for it. A partition the Nord
 * refuses fails the backup ({@link BACKUP_REFUSED_MESSAGE}): one that silently
 * left it out would not be a backup. Without `specs`, what is read follows the
 * keyboard ({@link backupSpecs}), and a programs-only copy carries no meta.xml,
 * so nothing takes it for a Stage 4 backup.
 */
export async function backup(
  session: NordSession,
  onProgress?: Progress,
  specs?: PartitionSpec[],
): Promise<Uint8Array> {
  const ns4b = specs !== undefined || backsUpEverything(session);
  try {
    return await backupLocked(session, onProgress, specs ?? backupSpecs(session), ns4b);
  } catch (cause) {
    if (cause instanceof SessionRefusedError) throw Object.assign(new NordError(BACKUP_REFUSED_MESSAGE), { cause });
    throw cause;
  }
}

function backupLocked(
  session: NordSession, onProgress: Progress | undefined, specs: PartitionSpec[], ns4b: boolean,
): Promise<Uint8Array> {
  // Exclusive: the manual begin/end brackets must not interleave with any
  // other flow's frames on the shared pipe.
  return session.exclusive(() => backupUnlocked(session, onProgress, specs, ns4b));
}

async function backupUnlocked(
  session: NordSession,
  onProgress: Progress | undefined,
  specs: PartitionSpec[],
  ns4b: boolean,
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = ns4b ? { 'meta.xml': strToU8(buildMetaXml(0)) } : {};
  // Pass 1: enumerate each partition (for the total + the work list). Each
  // partition is its own begin/end session so the device returns to idle.
  const items: { spec: PartitionSpec; entry: ProgramEntry }[] = [];
  for (const spec of specs) {
    const entries = await session.bracket(spec.partition, () => enumerateFiles(session));
    for (const entry of entries) items.push({ spec, entry });
  }
  // Pass 2: pull each file, grouped by partition (one begin/end per partition).
  let done = 0;
  for (const spec of specs) {
    const group = items.filter((i) => i.spec.partition === spec.partition);
    if (group.length === 0) continue;
    await session.bracket(spec.partition, async () => {
      for (const { entry } of group) {
        const named = { ...spec, ext: /^[a-z0-9]{2,4}$/i.test(entry.fourcc) ? entry.fourcc : spec.ext };
        const path = disambiguatePath(named, entry.bank, entry.name, entry.slot, (p) => Boolean(files[p]));
        files[path] = await pullFile(session, entry);
        onProgress?.(++done, items.length);
      }
    });
  }
  return zipSync(files, { level: 0 });
}

/**
 * True when a restore may write everywhere a backup can hold user content —
 * every partition it addresses is confirmed writable on this keyboard. When
 * false, offering Restore would only end in a refusal (see {@link restore}).
 */
export function canRestore(session: NordSession): boolean {
  return USER_PARTITIONS.every((p) => session.canWrite(p.partition));
}

/**
 * Restore a .ns4b onto the device. Maps each entry's extension → partition
 * (factory npno/nsmp4 are skipped + counted), reads its CBIN header for the
 * target {bank, slot}, and writes it. Best-effort: per-file failures are
 * collected, not fatal. Re-begins the Program partition at the finish.
 * Refused as a whole (`WriteBlockedError`, nothing written) when any target
 * partition isn't confirmed writable on the connected device.
 */
export function restore(
  session: NordSession,
  backup: Blob | Uint8Array,
  onProgress?: Progress,
): Promise<RestoreResult> {
  // Real .ns4b backups run multi-GB — never materialize the whole archive.
  // A Blob source is read via ranged slices only (central directory + one
  // small program/preset entry at a time); factory piano/sample payloads are
  // classified from the directory and never decompressed.
  const blob = backup instanceof Uint8Array ? new Blob([backup as unknown as BlobPart]) : backup;
  // Exclusive: see backup() — same shared-pipe rule for the write brackets.
  return session.exclusive(() => restoreUnlocked(session, blob, onProgress));
}

async function restoreUnlocked(
  session: NordSession,
  blob: Blob,
  onProgress?: Progress,
): Promise<RestoreResult> {
  const entries = await readZipDirectory(blob);
  if (!entries.some((e) => e.path === 'meta.xml')) throw new NordError('Not a Nord backup (no meta.xml).');

  const result: RestoreResult = { restored: 0, skippedFactory: 0, skippedFactoryFiles: [], failures: [] };
  const byPartition = new Map<number, { path: string; entry: ZipEntry }[]>();
  for (const entry of entries) {
    const path = entry.path;
    if (path === 'meta.xml' || path.endsWith('/')) continue;
    const partition = partitionForPath(path);
    if (partition === null) {
      result.skippedFactory++;
      result.skippedFactoryFiles.push(path);
      continue;
    }
    const list = byPartition.get(partition) ?? [];
    list.push({ path, entry });
    byPartition.set(partition, list);
  }
  const total = [...byPartition.values()].reduce((n, l) => n + l.length, 0);
  // All or nothing: a backup's files are addressed by Stage 4 partition, so
  // unless every one of those is confirmed on this keyboard, refuse the whole
  // restore up front. Checking only the partitions this archive uses is not
  // enough: on a Stage 3, partition 7 is confirmed, as its Programs, and an
  // archive of Stage 4 organ presets alone would be written over them.
  if (!canRestore(session)) throw new WriteBlockedError();

  let done = 0;
  // One begin/end session per partition; the device returns to idle between them.
  for (const [partition, items] of byPartition) {
    try {
      // A refused begin replies with a status rather than throwing; treat it like
      // an unreachable partition (else every write would fail the write gate).
      const begun = await session.begin(partition);
      if (begun.status !== 0) throw new NordError(`status ${begun.status}`);
    } catch (e) {
      // Whole partition unreachable — record each file as failed, don't abort the rest.
      const error = `Could not open partition ${partition}: ${getErrorMessage(e)}`;
      for (const { path } of items) result.failures.push({ path, error });
      done += items.length;
      onProgress?.(done, total);
      continue;
    }
    try {
      // Pre-flight capacity guard: translate "no room" into a friendly, up-front
      // failure instead of raw FileCreate status errors mid-restore. Overwriting an
      // occupied slot consumes no new slot, so only writes landing on empty slots
      // draw down free slots. Capacity/occupancy are best-effort — if either query
      // fails the guard stays open (freeSlots = ∞) and we just attempt the write.
      const occupied = await safeOccupiedSlots(session);
      const cap = await safeCapacity(session, partition);
      let freeSlots = cap ? cap.freeSlots : Infinity;

      for (const { path, entry } of items) {
        try {
          const bytes = await extractZipEntry(blob, entry); // one small file at a time
          if (!hasCbinMagic(bytes)) throw new NordError('not a Nord file (no CBIN magic)');
          const header = readCbinHeader(bytes);
          const isNewSlot = !occupied.has(slotKey(header.bank, header.location));
          if (isNewSlot && freeSlots <= 0) throw new NordError(partitionFullMessage(cap));
          const name = path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
          await pushFile(session, header.bank, header.location, bytes, name);
          if (isNewSlot) {
            occupied.add(slotKey(header.bank, header.location));
            freeSlots--;
          }
          result.restored++;
        } catch (e) {
          result.failures.push({ path, error: getErrorMessage(e) });
        }
        onProgress?.(++done, total);
      }
    } finally {
      // Quietly: an end the Nord doesn't answer (unplugged) must not replace
      // the per-file result with its own error.
      await session.end().catch(() => undefined);
    }
  }
  return result;
}

const slotKey = (bank: number, slot: number) => addrKey({ bank, slot });

/** Currently-occupied {bank, slot} keys in the begun partition; empty set on failure. */
async function safeOccupiedSlots(session: NordSession): Promise<Set<string>> {
  try {
    return new Set((await enumerateFiles(session)).map((e) => slotKey(e.bank, e.slot)));
  } catch {
    return new Set();
  }
}

/** Read a partition's capacity, or null if the queries aren't answered. */
async function safeCapacity(session: NordSession, partition: number): Promise<PartitionCapacity | null> {
  try {
    return await readPartitionCapacity(session, partition);
  } catch {
    return null;
  }
}

function partitionFullMessage(cap: PartitionCapacity | null): string {
  return cap
    ? `No free slots — ${cap.fileCount} of ${cap.totalSlots} used. Delete some files and restore again.`
    : 'No free slots left on the device. Delete some files and restore again.';
}
