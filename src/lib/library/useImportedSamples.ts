import { useCallback, useEffect, useState } from 'react';
import type { SampleEntry } from './sample-entries';
import { sampleEntryFromImport } from './sample-entries';
import { saveSampleImport, listSampleImports, deleteSampleImport, type StoredSample } from './sampleImportStore';
import { readFileBytes } from '../file';

export interface ImportedSamples {
  entries: SampleEntry[];
  add: (file: File) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** Local sample imports with persistence. Storage failures (quota/private mode)
 *  degrade gracefully: the entry shows for the session, it just won't persist. */
export function useImportedSamples(): ImportedSamples {
  const [entries, setEntries] = useState<SampleEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    listSampleImports()
      .then((recs) => { if (!cancelled) setEntries(recs.map(sampleEntryFromImport)); })
      .catch(() => { /* none persisted / storage unavailable */ });
    return () => { cancelled = true; };
  }, []);

  const add = useCallback(async (file: File) => {
    const bytes = await readFileBytes(file);
    const rec: StoredSample = { id: `local:${crypto.randomUUID()}`, name: file.name, bytes };
    await saveSampleImport(rec).catch(() => { /* keep for the session even if persist fails */ });
    setEntries((prev) => [...prev, sampleEntryFromImport(rec)]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSampleImport(id).catch(() => { /* drop from view regardless */ });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, add, remove };
}
