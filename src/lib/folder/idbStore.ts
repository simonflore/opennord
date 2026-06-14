/**
 * Tiny IndexedDB key/value store for the watched-folder directory handle.
 *
 * We persist ONLY the handle (a pointer to the user's own folder) — never file
 * contents (docs/LEGAL.md). FileSystemDirectoryHandle is structured-clonable, so
 * IndexedDB can store it directly. No dependency: one object store, one key.
 */
const DB_NAME = 'opennord';
const STORE = 'folder';
const KEY = 'directoryHandle';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const store = db.transaction(STORE, mode).objectStore(STORE);
        const req = run(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export function saveHandle(handle: FileSystemDirectoryHandle): Promise<unknown> {
  return tx('readwrite', (s) => s.put(handle, KEY));
}

export function loadHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return tx<FileSystemDirectoryHandle | undefined>('readonly', (s) => s.get(KEY));
}

export function clearHandle(): Promise<unknown> {
  return tx('readwrite', (s) => s.delete(KEY));
}
