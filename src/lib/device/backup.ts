import { zipSync, strToU8 } from 'fflate';
import type { NordSession } from './session';
import { PARTITION_PROGRAM } from './opcodes';
import { enumerateFiles, pullFile, type ProgramEntry } from './transfer';
import { USER_PARTITIONS, backupPath, buildMetaXml, type PartitionSpec } from './ns4b';

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
          files[backupPath(spec, entry.bank, entry.name)] = await pullFile(session, entry);
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
