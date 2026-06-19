/**
 * Persists ONLY the watched-folder directory handle (a pointer to the user's own
 * folder) — never file contents (docs/LEGAL.md). FileSystemDirectoryHandle is
 * structured-clonable, so IndexedDB can store it directly. Storage glue lives in
 * the shared {@link ../idb} opener.
 */
import { idbTx, STORE_FOLDER } from '../idb';

const KEY = 'directoryHandle';

export function saveHandle(handle: FileSystemDirectoryHandle): Promise<unknown> {
  return idbTx(STORE_FOLDER, 'readwrite', (s) => s.put(handle, KEY));
}

export function loadHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return idbTx<FileSystemDirectoryHandle | undefined>(STORE_FOLDER, 'readonly', (s) => s.get(KEY));
}

export function clearHandle(): Promise<unknown> {
  return idbTx(STORE_FOLDER, 'readwrite', (s) => s.delete(KEY));
}
