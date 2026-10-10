/**
 * How a piano inside a backup is identified and named — one rule for the Pianos
 * browser (`piano-entries.ts`) and the program view's audition (`piano-match.ts`),
 * so the same backup piano has the same id and name in both.
 */
import type { BackupRef } from '../clavia/backup/backup-index';
import { pianoNameFromFilename } from '../clavia/name';

/** Stable id: "backup:<bundlePath>!<entryPath>". */
export function backupPianoId(ref: BackupRef): string {
  return `backup:${ref.bundlePath}!${ref.entry.path}`;
}

/** Display name: the entry's file name without folder or `.npno` ("White Grand XL 6.3"). */
export function backupPianoName(ref: BackupRef): string {
  return pianoNameFromFilename(ref.entry.path);
}
