/**
 * Shared IndexedDB opener for OpenNord's local persistence. One database, two
 * object stores:
 *  - `folder`  — the watched-folder directory handle (a pointer to the user's
 *    own folder; see {@link ../folder/idbStore}).
 *  - `imports` — programs the user imported as single files, so they survive a
 *    reload (the user's own `.ns4p` bytes — never Nord audio/samples; docs/LEGAL.md).
 *
 * Bumping `DB_VERSION` and creating missing stores in `onupgradeneeded` keeps the
 * upgrade from an older (folder-only) database non-destructive.
 */
const DB_NAME = 'opennord';
const DB_VERSION = 2;
export const STORE_FOLDER = 'folder';
export const STORE_IMPORTS = 'imports';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FOLDER)) db.createObjectStore(STORE_FOLDER);
      if (!db.objectStoreNames.contains(STORE_IMPORTS)) db.createObjectStore(STORE_IMPORTS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Run one request against `store` and resolve its result. */
export function idbTx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const os = db.transaction(store, mode).objectStore(store);
        const req = run(os);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}
