import { useCallback, useEffect, useState } from 'react';
import type { LibraryEntry } from './types';
import { entryFromImport } from './entries';
import { saveImport, listImports, deleteImport, type StoredImport } from './importStore';

export interface ImportedLibrary {
  /** Imported programs, restored from IndexedDB on mount. */
  entries: LibraryEntry[];
  /** Import a file: parse, persist, and add it to the library. */
  add: (file: File) => Promise<void>;
  /** Remove an imported program by id (from the library and storage). */
  remove: (id: string) => Promise<void>;
}

/**
 * Local imports with persistence. Unlike the old session-only state, imports are
 * saved to IndexedDB so they survive a reload — matching the watched folder.
 * Storage failures (e.g. private-mode quota) degrade gracefully: the entry still
 * shows for the session, it just won't persist.
 */
export function useImportedLibrary(): ImportedLibrary {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    listImports()
      .then((recs) => { if (!cancelled) setEntries(recs.map(entryFromImport)); })
      .catch(() => { /* no persisted imports / storage unavailable */ });
    return () => { cancelled = true; };
  }, []);

  const add = useCallback(async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const rec: StoredImport = { id: `local:${crypto.randomUUID()}`, name: file.name, bytes };
    await saveImport(rec).catch(() => { /* keep it for the session even if persist fails */ });
    setEntries((prev) => [...prev, entryFromImport(rec)]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteImport(id).catch(() => { /* drop from view regardless */ });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, add, remove };
}
