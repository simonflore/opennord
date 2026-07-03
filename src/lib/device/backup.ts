import { zipSync, unzipSync, strToU8 } from 'fflate';
import type { NordSession } from './session';
import { NordError } from './protocol';
import { enumerateFiles, pullFile, pushFile, type ProgramEntry } from './transfer';
import { readPartitionCapacity, type PartitionCapacity } from './capacity';
import { readCbinHeader, hasCbinMagic } from '../clavia/cbin';
import { USER_PARTITIONS, partitionForPath, disambiguatePath, buildMetaXml, type PartitionSpec } from './ns4b';
import { addrKey } from './reorg';
import { getErrorMessage } from '../errors';

export interface RestoreResult {
  restored: number;
  skippedFactory: number;
  /** Zip paths of factory files (npno/nsmp4) that were skipped — for resolving download links. */
  skippedFactoryFiles: string[];
  failures: { path: string; error: string }[];
}

type Progress = (done: number, total: number) => void;

/**
 * Back up user content to a .ns4b (ZIP-store) — meta.xml + `<Folder>/Bank X/<name>.<ext>`.
 * Read-only on the device. Manages a begin/end session per partition, then
 * re-begins the Program partition so the caller's browser session is intact.
 */
export function backup(
  session: NordSession,
  onProgress?: Progress,
  specs: PartitionSpec[] = USER_PARTITIONS,
): Promise<Uint8Array> {
  // Exclusive: the manual begin/end brackets must not interleave with any
  // other flow's frames on the shared pipe.
  return session.exclusive(() => backupUnlocked(session, onProgress, specs));
}

async function backupUnlocked(
  session: NordSession,
  onProgress: Progress | undefined,
  specs: PartitionSpec[],
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = { 'meta.xml': strToU8(buildMetaXml(0)) };
  // Pass 1: enumerate each partition (for the total + the work list). Each
  // partition is its own begin/end session so the device returns to idle.
  const items: { spec: PartitionSpec; entry: ProgramEntry }[] = [];
  for (const spec of specs) {
    await session.begin(spec.partition);
    try {
      for (const entry of await enumerateFiles(session)) items.push({ spec, entry });
    } finally {
      await session.end();
    }
  }
  // Pass 2: pull each file, grouped by partition (one begin/end per partition).
  let done = 0;
  for (const spec of specs) {
    const group = items.filter((i) => i.spec.partition === spec.partition);
    if (group.length === 0) continue;
    await session.begin(spec.partition);
    try {
      for (const { entry } of group) {
        const path = disambiguatePath(spec, entry.bank, entry.name, entry.slot, (p) => Boolean(files[p]));
        files[path] = await pullFile(session, entry);
        onProgress?.(++done, items.length);
      }
    } finally {
      await session.end();
    }
  }
  return zipSync(files, { level: 0 });
}

/**
 * Restore a .ns4b onto the device. Maps each entry's extension → partition
 * (factory npno/nsmp4 are skipped + counted), reads its CBIN header for the
 * target {bank, slot}, and writes it. Best-effort: per-file failures are
 * collected, not fatal. Re-begins the Program partition at the finish.
 */
export function restore(
  session: NordSession,
  zipBytes: Uint8Array,
  onProgress?: Progress,
): Promise<RestoreResult> {
  // Exclusive: see backup() — same shared-pipe rule for the write brackets.
  return session.exclusive(() => restoreUnlocked(session, zipBytes, onProgress));
}

async function restoreUnlocked(
  session: NordSession,
  zipBytes: Uint8Array,
  onProgress?: Progress,
): Promise<RestoreResult> {
  const unzipped = unzipSync(zipBytes);
  if (!unzipped['meta.xml']) throw new NordError('Not a Nord backup (no meta.xml).');

  const result: RestoreResult = { restored: 0, skippedFactory: 0, skippedFactoryFiles: [], failures: [] };
  const byPartition = new Map<number, { path: string; bytes: Uint8Array }[]>();
  for (const path of Object.keys(unzipped)) {
    if (path === 'meta.xml') continue;
    const partition = partitionForPath(path);
    if (partition === null) {
      result.skippedFactory++;
      result.skippedFactoryFiles.push(path);
      continue;
    }
    const list = byPartition.get(partition) ?? [];
    list.push({ path, bytes: unzipped[path] });
    byPartition.set(partition, list);
  }
  const total = [...byPartition.values()].reduce((n, l) => n + l.length, 0);

  let done = 0;
  // One begin/end session per partition; the device returns to idle between them.
  for (const [partition, items] of byPartition) {
    try {
      await session.begin(partition);
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

      for (const { path, bytes } of items) {
        try {
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
      await session.end();
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
