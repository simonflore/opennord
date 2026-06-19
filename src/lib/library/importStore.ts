/**
 * Persists imported programs so single-file imports survive a reload — the same
 * durability the watched folder already has. We store the user's own program
 * bytes (and original filename), never Nord audio/sample content (docs/LEGAL.md).
 * Keyed by the entry's stable id.
 */
import { idbTx, STORE_IMPORTS } from '../idb';

export interface StoredImport {
  /** Stable library id, e.g. "local:<uuid>". */
  id: string;
  /** Original filename (used to derive the display name). */
  name: string;
  /** Raw program bytes — re-parsed into a LibraryEntry on load. */
  bytes: Uint8Array;
}

export function saveImport(rec: StoredImport): Promise<unknown> {
  return idbTx(STORE_IMPORTS, 'readwrite', (s) => s.put(rec, rec.id));
}

export function listImports(): Promise<StoredImport[]> {
  return idbTx<StoredImport[]>(STORE_IMPORTS, 'readonly', (s) => s.getAll());
}

export function deleteImport(id: string): Promise<unknown> {
  return idbTx(STORE_IMPORTS, 'readwrite', (s) => s.delete(id));
}
