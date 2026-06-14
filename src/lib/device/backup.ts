import { zipSync, unzipSync, strToU8 } from 'fflate';
import type { NordSession } from './session';
import { NordError } from './protocol';
import { PARTITION_PROGRAM } from './opcodes';
import { enumerateFiles, pullFile, pushFile, type ProgramEntry } from './transfer';
import { readCbinHeader, hasCbinMagic } from '../ns4/bits';
import { USER_PARTITIONS, partitionForPath, backupPath, buildMetaXml, type PartitionSpec } from './ns4b';

export interface RestoreResult {
  restored: number;
  skippedFactory: number;
  failures: { path: string; error: string }[];
}

type Progress = (done: number, total: number) => void;

/**
 * Back up user content to a .ns4b (ZIP-store) — meta.xml + `<Folder>/Bank X/<name>.<ext>`.
 * Read-only on the device. Manages a begin/end session per partition, then
 * re-begins the Program partition so the caller's browser session is intact.
 */
export async function backup(
  session: NordSession,
  onProgress?: Progress,
  specs: PartitionSpec[] = USER_PARTITIONS,
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = { 'meta.xml': strToU8(buildMetaXml(0)) };
  try {
    // Pass 1: enumerate each partition (for the total + the work list).
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
          let path = backupPath(spec, entry.bank, entry.name);
          // Two files can share a name within a bank (the slot differentiates them);
          // disambiguate so neither is silently lost from the zip.
          if (files[path]) path = backupPath(spec, entry.bank, `${entry.name} (slot ${entry.slot})`);
          files[path] = await pullFile(session, entry);
          onProgress?.(++done, items.length);
        }
      } finally {
        await session.end();
      }
    }
  } finally {
    await session.begin(PARTITION_PROGRAM);
  }
  return zipSync(files, { level: 0 });
}

/**
 * Restore a .ns4b onto the device. Maps each entry's extension → partition
 * (factory npno/nsmp4 are skipped + counted), reads its CBIN header for the
 * target {bank, slot}, and writes it. Best-effort: per-file failures are
 * collected, not fatal. Re-begins the Program partition at the finish.
 */
export async function restore(
  session: NordSession,
  zipBytes: Uint8Array,
  onProgress?: Progress,
): Promise<RestoreResult> {
  const unzipped = unzipSync(zipBytes);
  if (!unzipped['meta.xml']) throw new NordError('Not a Nord backup (no meta.xml).');

  const result: RestoreResult = { restored: 0, skippedFactory: 0, failures: [] };
  const byPartition = new Map<number, { path: string; bytes: Uint8Array }[]>();
  for (const path of Object.keys(unzipped)) {
    if (path === 'meta.xml') continue;
    const partition = partitionForPath(path);
    if (partition === null) { result.skippedFactory++; continue; }
    const list = byPartition.get(partition) ?? [];
    list.push({ path, bytes: unzipped[path] });
    byPartition.set(partition, list);
  }
  const total = [...byPartition.values()].reduce((n, l) => n + l.length, 0);

  let done = 0;
  try {
    for (const [partition, items] of byPartition) {
      try {
        await session.begin(partition);
      } catch (e) {
        // Whole partition unreachable — record each file as failed, don't abort the rest.
        const error = `Could not open partition ${partition}: ${e instanceof Error ? e.message : String(e)}`;
        for (const { path } of items) result.failures.push({ path, error });
        done += items.length;
        onProgress?.(done, total);
        continue;
      }
      try {
        for (const { path, bytes } of items) {
          try {
            if (!hasCbinMagic(bytes)) throw new NordError('not a Nord file (no CBIN magic)');
            const header = readCbinHeader(bytes);
            const name = path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
            await pushFile(session, header.bank, header.location, bytes, name);
            result.restored++;
          } catch (e) {
            result.failures.push({ path, error: e instanceof Error ? e.message : String(e) });
          }
          onProgress?.(++done, total);
        }
      } finally {
        await session.end();
      }
    }
  } finally {
    await session.begin(PARTITION_PROGRAM);
  }
  return result;
}
