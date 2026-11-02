/**
 * The last finished scan of the linked folder, kept so a launch can show the
 * lists straight away while the real scan runs. One record, next to the
 * folder's handle (same store as {@link ./idbStore}), keyed to that folder and
 * dropped on Forget.
 *
 * Only what is small is kept: programs and presets (the user's own files, a few
 * KB each, like the single-file imports), the per-file errors, the backups found
 * and what's listed inside them (names only). Piano and sample files are left
 * out: they can be many MB each, and a second copy of the folder's audio,
 * factory samples included, doesn't belong in the browser (docs/LEGAL.md). They
 * show up again as the scan reaches them.
 */
import { idbTx, STORE_FOLDER } from '../idb';
import type { ScanResult } from './scan';
import type { BundleDescriptor } from './pipeline';

const KEY = 'lastScan';

interface CachedScanRecord {
  folderName: string;
  /** The scanned directory (structured-clonable), so a same-named folder can't pick it up. */
  handle: FileSystemDirectoryHandle;
  result: ScanResult;
  bundles: BundleDescriptor[];
}

export interface CachedScan {
  result: ScanResult;
  bundles: BundleDescriptor[];
}

/** Just these bytes: a view into a larger buffer would store all of it. */
const own = (b: Uint8Array) => (b.byteOffset === 0 && b.byteLength === b.buffer.byteLength ? b : b.slice());

/** Keep (replace) the last scan of `handle`, minus the piano and sample files. */
export async function saveScanCache(
  folderName: string, handle: FileSystemDirectoryHandle, result: ScanResult, bundles: BundleDescriptor[],
): Promise<void> {
  const rec: CachedScanRecord = {
    folderName,
    handle,
    result: {
      programs: result.programs.map((p) => ({ ...p, bytes: own(p.bytes) })),
      presets: result.presets.map((p) => ({ ...p, bytes: own(p.bytes) })),
      pianos: [],
      samples: [],
      errors: result.errors,
      backupPianos: result.backupPianos,
      backupSamples: result.backupSamples,
    },
    bundles,
  };
  await idbTx(STORE_FOLDER, 'readwrite', (s) => s.put(rec, KEY));
}

/** The kept scan of this very folder, or null: none kept, or kept for another folder. */
export async function loadScanCache(folderName: string, handle: FileSystemDirectoryHandle): Promise<CachedScan | null> {
  const rec = await idbTx<CachedScanRecord | undefined>(STORE_FOLDER, 'readonly', (s) => s.get(KEY));
  if (!rec || rec.folderName !== folderName || !rec.handle) return null;
  try {
    if (!(await handle.isSameEntry(rec.handle))) return null;
  } catch {
    return null; // an unreadable stored handle can't vouch for identity
  }
  return { result: rec.result, bundles: rec.bundles };
}

/** Drop the kept scan (called from folder `forget()`). */
export async function clearScanCache(): Promise<void> {
  await idbTx(STORE_FOLDER, 'readwrite', (s) => s.delete(KEY));
}
