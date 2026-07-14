import { extractZipEntry } from './zip-directory';
import type { BackupRef } from './backup-index';

/** Minimal interface required to open a backup bundle file. */
export interface BundleOpener {
  openBundle: (path: string) => Promise<File>;
}

/**
 * On-demand extraction of a single backup entry — peak memory is one entry.
 * Opens the bundle file via the folder access handle, seeks the local header,
 * slices and inflates only the one requested entry.
 */
export async function extractBackupEntry(
  folder: BundleOpener,
  ref: BackupRef,
): Promise<Uint8Array> {
  const file = await folder.openBundle(ref.bundlePath);
  return extractZipEntry(file, ref.entry);
}
