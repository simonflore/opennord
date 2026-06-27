import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { useImportedSamples } from '@/lib/library/useImportedSamples';
import { useSamplesPrefs } from '@/lib/library/prefs';
import {
  sampleEntriesFromScanned, nordSampleEntriesFromDevice, sampleEntriesFromBackupRefs,
  filterSamples, sortSamples,
  type SampleEntry, type SampleGeneration,
} from '@/lib/library/sample-entries';
import type { LibrarySource } from '@/lib/library/types';
import { enumerateSampleLibrary, pullSample } from '@/lib/device/samples';
import { findUnusedSamples, normalizeSampleName, type SampleUsage } from '@/lib/device/dependencies';
import { useBackupOrigins } from './useBackupOrigins';
import { planOffload } from '@/lib/device/offload';
import { executePlan } from '@/lib/device/execute';
import { sessionDeviceIO } from '@/lib/device/device-io';
import { buildOccupancy, type Addr } from '@/lib/device/reorg';
import { PARTITION_SAMP_LIB } from '@/lib/device/opcodes';
import { downloadBytes } from '@/lib/download';

// pure helper, exported for tests
export function selectedBytes(entries: SampleEntry[], selected: Set<string>): number {
  return entries.filter((e) => selected.has(e.id)).reduce((n, e) => n + (e.device?.sizeBytes ?? e.size ?? 0), 0);
}

const SAMPLE_EXT: Record<string, string> = { og: 'nsmp', '3': 'nsmp3', '4': 'nsmp4', npno: 'npno' };
const extForGeneration = (g: string) => SAMPLE_EXT[g] ?? 'nsmp4';

/** Merges device + folder samples into one filtered/sorted list and owns the
 *  Samples-screen view state. Mirrors useLibraryStateValue for programs. */
function useSamplesStateValue() {
  const { session, sampleEntries, setSampleEntries } = useDevice();
  const folder = useFolder();
  const imported = useImportedSamples();
  const prefs = useSamplesPrefs();
  const origins = useBackupOrigins(folder.result.backupSamples, folder.openBundle);
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [generation, setGeneration] = useState<SampleGeneration | 'all'>('all');
  const [query, setQuery] = useState('');

  // Sample-usage scan (device-connected): which installed samples no program uses.
  // On-demand — it's one device round-trip per program — so a button triggers it.
  const [usage, setUsage] = useState<SampleUsage | null>(null);
  const [scanPct, setScanPct] = useState<number | null>(null);
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);
  const [removePct, setRemovePct] = useState<number | null>(null);
  const toggleSelected = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearSelected = () => setSelected(new Set());

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
    ...sampleEntriesFromBackupRefs(folder.result.backupSamples).map((e) => ({ ...e, factory: origins.get(e.id) })),
    ...imported.entries,
  ];
  const nordCount = allEntries.filter((e) => e.source === 'nord').length;
  const localCount = allEntries.length - nordCount;
  const storedCount = imported.entries.length;
  const storedBytes = imported.entries.reduce((n, e) => n + (e.size ?? 0), 0);
  const showSourceFacet = nordCount > 0 && localCount > 0;
  const showUnknownGen = allEntries.some((e) => e.generation === 'unknown' && e.source === 'local');
  const unusedCount = usage ? usage.unused.length : null;

  const shown = sortSamples(
    filterSamples(allEntries, source, generation, query, unusedOnly), prefs.sort, prefs.favorites);
  const entryById = (id: string) => allEntries.find((e) => e.id === id);

  const removableUnused = allEntries.filter((e) => e.source === 'nord' && e.unused && e.device);
  const selectAllUnused = () => setSelected(new Set(removableUnused.map((e) => e.id)));
  const selectedFreeBytes = selectedBytes(allEntries, selected);

  async function removeFromNord({ keepCopyIds }: { keepCopyIds: Set<string> }): Promise<{ removed: number; failed: number }> {
    if (!session) return { removed: 0, failed: 0 };
    const targets = removableUnused.filter((e) => selected.has(e.id));
    if (targets.length === 0) return { removed: 0, failed: 0 };
    setRemoving(true);
    setRemovePct(0);
    let copyFailed = 0;
    const skip = new Set<string>(); // copy requested but failed → don't delete
    try {
      // 1. keep-a-copy (download) for the requested user samples, BEFORE deleting
      for (const e of targets) {
        if (!keepCopyIds.has(e.id)) continue;
        try {
          const bytes = await pullSample(session, e.device!, () => {});
          downloadBytes(bytes, `${e.name}.${extForGeneration(e.generation)}`);
        } catch {
          copyFailed++; skip.add(e.id); // couldn't copy → keep it on the device
        }
      }
      const toRemove = targets.filter((e) => !skip.has(e.id));
      if (toRemove.length === 0) return { removed: 0, failed: copyFailed };
      const occ = buildOccupancy(toRemove.map((e) => e.device!));
      const addrs: Addr[] = toRemove.map((e) => ({ bank: e.device!.bank, slot: e.device!.slot }));
      const res = await session.withSession(PARTITION_SAMP_LIB, () =>
        executePlan(sessionDeviceIO(session), PARTITION_SAMP_LIB, planOffload(addrs), occ,
          { onProgress: (p) => setRemovePct(Math.round((p.opIndex / p.opCount) * 100)) }));
      // 2. refresh the device sample list
      try { setSampleEntries(await enumerateSampleLibrary(session)); } catch { /* leave as-is */ }
      clearSelected();
      return res.ok
        ? { removed: toRemove.length, failed: copyFailed }
        : { removed: 0, failed: copyFailed + toRemove.length };
    } finally {
      setRemoving(false); setRemovePct(null);
    }
  }

  return {
    shown, source, setSource, generation, setGeneration, query, setQuery,
    prefs, entryById, nordCount, localCount, showSourceFacet, showUnknownGen, folder,
    // Sample-usage cleanup (device-connected)
    canScanUsage: !!session, scanUsage, scanPct, unusedCount,
    unusedOnly, setUnusedOnly, missingCount: usage ? usage.missing.length : null,
    importSample: imported.add, removeSample: imported.remove, storedCount, storedBytes,
    // Selection + removal
    selected, toggleSelected, selectAllUnused, clearSelected, selectedFreeBytes,
    removeFromNord, removing, removePct,
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
