/**
 * Restoring a backup's samples and pianos the way NSM does for partitions whose files
 * are matched by name (NSM's restore
 *): what the Nord has under a name the backup lacks is removed; a file
 * with the same name and size is left alone (NSM compares contents; OpenNord compares
 * sizes, so a same-size edit under the same name is not rewritten); everything else
 * is written. The plan is pure; the reader takes one small ranged read per file.
 *
 * OpenNord is stricter than NSM in one respect: a backup file the writer would refuse
 * (the caller sets `refusal` from `libraryFileRefusal`) aborts the whole partition,
 * and nothing is removed, so the Nord is never emptied without a valid replacement.
 */
import type { ProgramEntry } from './transfer';
import { NordError } from './protocol';
import { nameFromPath } from './ns4b';
import { libraryFileRefusal } from './library-file';
import type { LibraryKind } from './write-guard';
import { extractZipEntryHead, type ZipEntry } from '../clavia/backup/zip-directory';
import {
  CBIN_BODY_OFFSET, CBIN_FORMAT_NSM, CBIN_LEGACY_RECORD_OFFSET, CBIN_LEGACY_TRAILER_BYTES, hasCbinMagic, readCbinHeader,
} from '../clavia/cbin';

export interface BackupLibraryFile {
  path: string;
  /** The file's name on the Nord: its file name without the extension. */
  name: string;
  /** What the Nord stores: the size behind the CBIN header. */
  recordBytes: number;
  /** The place in its header (0xFFFF for "none"). */
  bank: number;
  slot: number;
  /** Set by the caller when the writer would refuse this file (`libraryFileRefusal`). */
  refusal?: string;
}

export interface LibraryRestorePlan {
  /** True when a backup file is refused: the partition is skipped and nothing else here is filled in. */
  aborted: boolean;
  /** The backup files that caused the abort, in backup order. */
  refused: BackupLibraryFile[];
  /** Files on the Nord to remove before writing. Empty when aborted. */
  remove: ProgramEntry[];
  /** The places `remove` empties; leave them out of the "occupied" set when choosing write places. */
  freed: { bank: number; slot: number }[];
  write: BackupLibraryFile[];
  unchanged: BackupLibraryFile[];
  /** Later backup files under a name already taken in this backup. */
  duplicates: BackupLibraryFile[];
}

/**
 * A backup file's name, size and place, from one small ranged read. With `kind`, also
 * whether the writer would refuse it for that library (`refusal`, from the same head
 * and the size in the archive), so a restore can check every file before it removes
 * anything.
 */
export async function readBackupLibraryFile(blob: Blob, path: string, entry: ZipEntry, kind?: LibraryKind): Promise<BackupLibraryFile> {
  const head = await extractZipEntryHead(blob, entry, CBIN_LEGACY_RECORD_OFFSET);
  if (!hasCbinMagic(head)) throw new NordError('not a Nord file (no CBIN magic)');
  const h = readCbinHeader(head);
  const overhead = h.formatType === CBIN_FORMAT_NSM ? CBIN_BODY_OFFSET : CBIN_LEGACY_RECORD_OFFSET + CBIN_LEGACY_TRAILER_BYTES;
  const recordBytes = Math.max(0, entry.size - overhead);
  const file: BackupLibraryFile = { path, name: nameFromPath(path), recordBytes, bank: h.bank, slot: h.location };
  const refusal = kind === undefined ? undefined : libraryFileRefusal(kind, head, recordBytes);
  return refusal === undefined ? file : { ...file, refusal };
}

export function planLibraryRestore(onNord: ProgramEntry[], backup: BackupLibraryFile[]): LibraryRestorePlan {
  const plan: LibraryRestorePlan = { aborted: false, refused: [], remove: [], freed: [], write: [], unchanged: [], duplicates: [] };
  const byName = new Map(onNord.map((d) => [d.name, d]));
  const names = new Set<string>();
  const kept: BackupLibraryFile[] = [];
  for (const f of backup) {
    if (names.has(f.name)) { plan.duplicates.push(f); continue; }
    names.add(f.name);
    kept.push(f);
  }
  plan.refused = kept.filter((f) => f.refusal !== undefined);
  if (plan.refused.length > 0) {
    plan.aborted = true;
    plan.duplicates = [];
    return plan;
  }
  for (const f of kept) {
    const d = byName.get(f.name);
    if (d && d.sizeBytes === f.recordBytes) { plan.unchanged.push(f); continue; }
    if (d) plan.remove.push(d);
    plan.write.push(f);
  }
  for (const d of onNord) if (!names.has(d.name)) plan.remove.push(d);
  plan.freed = plan.remove.map((d) => ({ bank: d.bank, slot: d.slot }));
  return plan;
}
