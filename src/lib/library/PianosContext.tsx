import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { usePianosPrefs } from '@/lib/library/prefs';
import {
  pianoEntriesFromScanned, pianoEntriesFromDevice, pianoEntriesFromBackupRefs,
  filterPianos, sortPianos,
  type PianoEntry,
} from '@/lib/library/piano-entries';
import type { LibrarySource } from '@/lib/library/types';
import { enumeratePianoLibrary, pullPiano } from '@/lib/device/pianos';
import { findUnusedPianos, normalizeSampleName, type SampleUsage } from '@/lib/device/dependencies';
import { planOffload } from '@/lib/device/offload';
import { executePlan } from '@/lib/device/execute';
import { sessionDeviceIO } from '@/lib/device/device-io';
import { WriteBlockedError } from '@/lib/device/write-guard';
import { buildOccupancy, type Addr } from '@/lib/device/reorg';
import { PARTITION_PIANO } from '@/lib/device/opcodes';
import { downloadBytes } from '@/lib/download';
import { useListFilters } from '@/lib/library/useListFilters';

// pure helper, exported for tests
export function selectedPianoBytes(entries: PianoEntry[], selected: Set<string>): number {
  return entries.filter((e) => selected.has(e.id)).reduce((n, e) => n + (e.device?.sizeBytes ?? e.size ?? 0), 0);
}

/** Merges device + folder pianos into one filtered/sorted list and owns the
 *  Pianos-screen view state. Mirrors SamplesContext with piano-specific deltas. */
function usePianosStateValue() {
  const { session, pianoEntries, setPianoEntries, isCurrent } = useDevice();
  const folder = useFolder();
  const prefs = usePianosPrefs();
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [query, setQuery] = useState('');

  // Piano-usage scan (device-connected): which installed pianos no program uses.
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

  // The usage tags and the picked pianos name this Nord's slots: a new
  // connection starts without them, so nothing picked on one Nord is removed
  // from the next.
  useEffect(() => {
    setUsage(null); setScanPct(null); setUnusedOnly(false); setSelected(new Set());
  }, [session]);

  async function scanUsage() {
    if (!session) return;
    setScanPct(0);
    try {
      const u = await findUnusedPianos(session, (done, total) => {
        if (isCurrent(session)) setScanPct(total ? Math.round((done / total) * 100) : 0);
      });
      if (isCurrent(session)) setUsage(u); // not tags for another Nord connected meanwhile
    } catch {
      if (isCurrent(session)) setUsage(null); // scan failed (unsupported/disconnected) — leave the list untagged
    } finally {
      if (isCurrent(session)) setScanPct(null); // a scan on another Nord's session doesn't touch this one's
    }
  }

  // Lazily enumerate the Piano Library when a device is connected. Cheap
  // (names/slots only); absent partitions reject and are ignored.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    enumeratePianoLibrary(session)
      .then((es) => { if (!cancelled) setPianoEntries(es); })
      .catch(() => { /* piano partition absent/unsupported — leave empty */ });
    return () => { cancelled = true; };
  }, [session, setPianoEntries]);

  // Tag device pianos the scan found unused (match by normalized name).
  const unusedNames = useMemo(() => (usage ? new Set(usage.unused.map((s) => normalizeSampleName(s.name))) : null), [usage]);
  const allEntries: PianoEntry[] = useMemo(() => [
    ...pianoEntriesFromDevice(pianoEntries).map((e) =>
      unusedNames ? { ...e, unused: unusedNames.has(normalizeSampleName(e.name)) } : e),
    ...pianoEntriesFromScanned(folder.result.pianos),
    ...pianoEntriesFromBackupRefs(folder.result.backupPianos),
  ], [pianoEntries, unusedNames, folder.result.pianos, folder.result.backupPianos]);
  const nordCount = allEntries.filter((e) => e.source === 'nord').length;
  const localCount = allEntries.length - nordCount;
  const showSourceFacet = nordCount > 0 && localCount > 0;
  const unusedCount = usage ? usage.unused.length : null;

  // The list follows the search a beat behind (an interruptible render), so the
  // field keeps up with typing in a big folder.
  const listQuery = useDeferredValue(query);
  const shown = useMemo(() => sortPianos(
    unusedOnly
      ? filterPianos(allEntries, source, listQuery).filter((e) => e.unused)
      : filterPianos(allEntries, source, listQuery),
    prefs.sort, prefs.favorites), [allEntries, source, listQuery, unusedOnly, prefs.sort, prefs.favorites]);
  const entryById = useCallback((id: string) => allEntries.find((e) => e.id === id), [allEntries]);

  const removableUnused = allEntries.filter((e) => e.source === 'nord' && e.unused && e.device);
  const selectAllUnused = () => setSelected(new Set(removableUnused.map((e) => e.id)));
  const selectedFreeBytes = selectedPianoBytes(allEntries, selected);
  // The selection from the whole list, not the filtered one: removal deletes
  // every selected entry, so the confirm dialog (keep-a-copy, re-install links)
  // must see the ones a search or facet is hiding too.
  const selectedEntries = useMemo(() => allEntries.filter((e) => selected.has(e.id)), [allEntries, selected]);

  async function removeFromNord({ keepCopyIds }: { keepCopyIds: Set<string> }): Promise<{ removed: number; failed: number }> {
    if (!session) return { removed: 0, failed: 0 };
    const targets = removableUnused.filter((e) => selected.has(e.id));
    if (targets.length === 0) return { removed: 0, failed: 0 };
    // Unconfirmed layout on this keyboard: refuse up front with the calm message.
    if (!session.canWrite(PARTITION_PIANO)) throw new WriteBlockedError();
    setRemoving(true);
    setRemovePct(0);
    let copyFailed = 0;
    const skip = new Set<string>(); // copy requested but failed → don't delete
    try {
      // 1. keep-a-copy (download) for the requested pianos, BEFORE deleting
      for (const e of targets) {
        if (!keepCopyIds.has(e.id)) continue;
        try {
          const bytes = await pullPiano(session, e.device!, () => {});
          downloadBytes(bytes, `${e.name}.npno`);
        } catch {
          copyFailed++; skip.add(e.id); // couldn't copy → keep it on the device
        }
      }
      const toRemove = targets.filter((e) => !skip.has(e.id));
      if (toRemove.length === 0) return { removed: 0, failed: copyFailed };
      const occ = buildOccupancy(toRemove.map((e) => e.device!));
      const addrs: Addr[] = toRemove.map((e) => ({ bank: e.device!.bank, slot: e.device!.slot }));
      const res = await session.withSession(PARTITION_PIANO, () =>
        executePlan(sessionDeviceIO(session), PARTITION_PIANO, planOffload(addrs, 'pianos'), occ,
          { onProgress: (p) => { if (isCurrent(session)) setRemovePct(Math.round((p.opIndex / p.opCount) * 100)); } }));
      // 2. refresh the device piano list
      // Unless the Nord changed meanwhile: then this list is the old one's.
      try { const es = await enumeratePianoLibrary(session); if (isCurrent(session)) setPianoEntries(es); } catch { /* leave as-is */ }
      if (isCurrent(session)) clearSelected(); // not another Nord's picks
      return res.ok
        ? { removed: toRemove.length, failed: copyFailed }
        : { removed: 0, failed: copyFailed + toRemove.length };
    } finally {
      setRemoving(false); setRemovePct(null);
    }
  }

  // The list's filters, once: `filtered` and the "clear filters" button both read
  // this, and a filter counts while set even if its facet is hidden right now.
  const { filtered, clearFilters, ensureListed } = useListFilters(shown, [
    // Counts once the list has caught up with the search (listQuery).
    { active: listQuery.trim() !== '', reset: () => setQuery('') },
    { active: source !== 'all', reset: () => setSource('all') },
    { active: unusedOnly, reset: () => setUnusedOnly(false) },
  ]);
  return {
    all: allEntries, clearFilters, filtered, ensureListed,
    shown, source, setSource, query, setQuery, prefs, entryById, nordCount, localCount, showSourceFacet, folder, session,
    // Piano-usage cleanup (device-connected)
    canScanUsage: !!session, scanUsage, scanPct, unusedCount,
    unusedOnly, setUnusedOnly,
    // Selection + removal
    selected, selectedEntries, toggleSelected, selectAllUnused, clearSelected, selectedFreeBytes,
    removeFromNord, removing, removePct,
  };
}

type PianosState = ReturnType<typeof usePianosStateValue>;
type PianosData = Pick<PianosState, 'all' | 'ensureListed'>;
const Ctx = createContext<PianosState | null>(null);
const DataCtx = createContext<PianosData | null>(null);

export function PianosProvider({ children }: { children: ReactNode }) {
  const state = usePianosStateValue();
  // What the always-mounted shell reads (the rail's count, the ⌘K palette):
  // its own context, so a search keystroke here doesn't re-render the shell.
  const { all, ensureListed } = state;
  const data = useMemo(() => ({ all, ensureListed }), [all, ensureListed]);
  return (
    <DataCtx.Provider value={data}>
      <Ctx.Provider value={state}>{children}</Ctx.Provider>
    </DataCtx.Provider>
  );
}

/** The entries and the jump-to helper, without the search state (see PianosProvider). */
export function usePianosData(): PianosData {
  const v = useContext(DataCtx);
  if (!v) throw new Error('usePianosData must be used within PianosProvider');
  return v;
}

export function usePianosState(): PianosState {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePianosState must be used within PianosProvider');
  return v;
}
