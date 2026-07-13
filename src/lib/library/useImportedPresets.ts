import { useCallback, useEffect, useState } from 'react';
import type { PresetEntry } from './preset-entries';
import { presetEntryFromImport } from './preset-entries';
import { saveImport, listImports, deleteImport, type StoredImport } from './importStore';
import { readFileBytes } from '../file';

export interface ImportedPresets {
  /** Imported presets, restored from IndexedDB on mount. */
  entries: PresetEntry[];
  /** Import a preset file: persist and add it to the list (ignores non-presets). */
  add: (file: File) => Promise<void>;
  /** Remove an imported preset by id (from the list and storage). */
  remove: (id: string) => Promise<void>;
}

/**
 * Local preset imports with persistence — the Presets-page counterpart of
 * {@link useImportedLibrary}. Both share one IndexedDB store (bytes are
 * self-describing); this hook keeps only the records that identify as presets,
 * so a preset lands here and a program lands in the Library.
 */
export function useImportedPresets(): ImportedPresets {
  const [entries, setEntries] = useState<PresetEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    listImports()
      .then((recs) => {
        if (cancelled) return;
        setEntries(recs.map(presetEntryFromImport).filter((e): e is PresetEntry => e !== null));
      })
      .catch(() => { /* no persisted imports / storage unavailable */ });
    return () => { cancelled = true; };
  }, []);

  const add = useCallback(async (file: File) => {
    const bytes = await readFileBytes(file);
    const rec: StoredImport = { id: `local:${crypto.randomUUID()}`, name: file.name, bytes };
    const entry = presetEntryFromImport(rec);
    if (!entry) return; // not a preset — the caller guards, this is belt-and-braces
    await saveImport(rec).catch(() => { /* keep it for the session even if persist fails */ });
    setEntries((prev) => [...prev, entry]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteImport(id).catch(() => { /* drop from view regardless */ });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, add, remove };
}
