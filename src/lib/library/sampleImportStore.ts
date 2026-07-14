/**
 * Persists imported samples so single-file imports survive a reload — the same
 * durability the watched folder already gives folder samples. Stores the user's
 * own sample bytes (+ filename), never Nord factory library content (docs/LEGAL.md).
 */
import { idbTx, STORE_SAMPLE_IMPORTS } from '../idb';

export interface StoredSample { id: string; name: string; bytes: Uint8Array; }

export function saveSampleImport(rec: StoredSample): Promise<unknown> {
  return idbTx(STORE_SAMPLE_IMPORTS, 'readwrite', (s) => s.put(rec, rec.id));
}

export function listSampleImports(): Promise<StoredSample[]> {
  return idbTx<StoredSample[]>(STORE_SAMPLE_IMPORTS, 'readonly', (s) => s.getAll());
}

export function deleteSampleImport(id: string): Promise<unknown> {
  return idbTx(STORE_SAMPLE_IMPORTS, 'readwrite', (s) => s.delete(id));
}
