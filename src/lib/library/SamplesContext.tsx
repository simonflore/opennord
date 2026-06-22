import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolderLibrary } from '@/lib/folder/useFolderLibrary';
import { useSamplesPrefs } from '@/lib/library/prefs';
import {
  sampleEntriesFromScanned, nordSampleEntriesFromDevice, filterSamples, sortSamples,
  type SampleEntry, type SampleGeneration,
} from '@/lib/library/sample-entries';
import type { LibrarySource } from '@/lib/library/types';
import { enumerateSampleLibrary } from '@/lib/device/samples';
import { findUnusedSamples, normalizeSampleName, type SampleUsage } from '@/lib/device/dependencies';

/** Merges device + folder samples into one filtered/sorted list and owns the
 *  Samples-screen view state. Mirrors useLibraryStateValue for programs. */
function useSamplesStateValue() {
  const { session, sampleEntries, setSampleEntries } = useDevice();
  const folder = useFolderLibrary();
  const prefs = useSamplesPrefs();
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [generation, setGeneration] = useState<SampleGeneration | 'all'>('all');
  const [query, setQuery] = useState('');

  // Sample-usage scan (device-connected): which installed samples no program uses.
  // On-demand — it's one device round-trip per program — so a button triggers it.
  const [usage, setUsage] = useState<SampleUsage | null>(null);
  const [scanPct, setScanPct] = useState<number | null>(null);
  const [unusedOnly, setUnusedOnly] = useState(false);

  async function scanUsage() {
    if (!session) return;
    setScanPct(0);
    try {
      const u = await findUnusedSamples(session, (done, total) =>
        setScanPct(total ? Math.round((done / total) * 100) : 0));
      setUsage(u);
    } catch {
      setUsage(null); // scan failed (unsupported/disconnected) — leave the list untagged
    } finally {
      setScanPct(null);
    }
  }

  // Lazily enumerate the user Sample Library when a device is connected. Cheap
  // (names/slots only); absent partitions reject and are ignored. No byte pull
  // here — the pull happens on tap, in SamplesSplit.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    enumerateSampleLibrary(session)
      .then((es) => { if (!cancelled) setSampleEntries(es); })
      .catch(() => { /* sample partition absent/unsupported — leave empty */ });
    return () => { cancelled = true; };
  }, [session, setSampleEntries]);

  // Tag device samples the scan found unused (match by normalized name).
  const unusedNames = usage ? new Set(usage.unused.map((s) => normalizeSampleName(s.name))) : null;
  const allEntries: SampleEntry[] = [
    ...nordSampleEntriesFromDevice(sampleEntries).map((e) =>
      unusedNames ? { ...e, unused: unusedNames.has(normalizeSampleName(e.name)) } : e),
    ...sampleEntriesFromScanned(folder.result.samples),
  ];
  const nordCount = allEntries.filter((e) => e.source === 'nord').length;
  const localCount = allEntries.length - nordCount;
  const showSourceFacet = nordCount > 0 && localCount > 0;
  const showUnknownGen = allEntries.some((e) => e.generation === 'unknown' && e.source === 'local');
  const unusedCount = usage ? usage.unused.length : null;

  const shown = sortSamples(
    filterSamples(allEntries, source, generation, query, unusedOnly), prefs.sort, prefs.favorites);
  const entryById = (id: string) => allEntries.find((e) => e.id === id);

  return {
    shown, source, setSource, generation, setGeneration, query, setQuery,
    prefs, entryById, nordCount, localCount, showSourceFacet, showUnknownGen, folder,
    // Sample-usage cleanup (device-connected)
    canScanUsage: !!session, scanUsage, scanPct, unusedCount,
    unusedOnly, setUnusedOnly, missingCount: usage ? usage.missing.length : null,
  };
}

type SamplesState = ReturnType<typeof useSamplesStateValue>;
const Ctx = createContext<SamplesState | null>(null);

export function SamplesProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useSamplesStateValue()}>{children}</Ctx.Provider>;
}

export function useSamplesState(): SamplesState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSamplesState must be used within SamplesProvider');
  return v;
}
