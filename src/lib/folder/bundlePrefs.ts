/**
 * Persists the user's per-folder decision about which `.ns4b` backups to load.
 * Stored as a single record (the app tracks one watched folder, like the handle
 * in {@link ./idbStore}). Never stores file contents — only bundle paths
 * (docs/LEGAL.md). Storage glue is the shared {@link ../idb} opener.
 */
import { idbTx, STORE_BUNDLE_CHOICE } from '../idb';

const KEY = 'current';

/** The user's per-folder decision about which `.ns4b` backups to load. */
export interface BundleChoice {
  folderName: string;
  /** The picked directory's handle, when the source has one (FSA handles are
   *  structured-clonable). Lets a same-named but different directory be told
   *  apart — the display name alone can't. */
  handle?: FileSystemDirectoryHandle;
  /** Bundle paths the user chose to load. */
  decided: string[];
  /** Bundle paths the user chose to skip. */
  skipped: string[];
}

/** Load the saved choice, or null if none — or if it belongs to a different
 *  folder. Identity is the directory handle when both sides have one (a
 *  same-named replacement folder must not inherit skip decisions and silently
 *  hide its backups); name-only otherwise (File[] sources have no handle). */
export async function loadBundleChoice(
  folderName: string,
  handle?: FileSystemDirectoryHandle,
): Promise<BundleChoice | null> {
  const rec = await idbTx<BundleChoice | undefined>(STORE_BUNDLE_CHOICE, 'readonly', (s) => s.get(KEY));
  if (!rec || rec.folderName !== folderName) return null;
  if (rec.handle && handle) {
    try {
      if (!(await handle.isSameEntry(rec.handle))) return null;
    } catch {
      return null; // an unreadable stored handle can't vouch for identity
    }
  }
  return rec;
}

/** Persist (replace) the choice for the current folder. */
export async function saveBundleChoice(choice: BundleChoice): Promise<void> {
  await idbTx(STORE_BUNDLE_CHOICE, 'readwrite', (s) => s.put(choice, KEY));
}

/** Forget any saved choice (called from folder `forget()`). */
export async function clearBundleChoice(): Promise<void> {
  await idbTx(STORE_BUNDLE_CHOICE, 'readwrite', (s) => s.delete(KEY));
}
