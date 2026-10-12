import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { usePresetsPrefs } from '@/lib/library/prefs';
import {
  presetEntriesFromScanned, presetEntriesFromDevice, filterPresets, sortPresets, presentKinds,
  type PresetEntry,
} from '@/lib/library/preset-entries';
import { useImportedPresets } from '@/lib/library/useImportedPresets';
import type { PresetKind } from '@/lib/clavia/preset-kind';
import type { LibrarySource } from '@/lib/library/types';
import { enumeratePresets } from '@/lib/device/presets';
import { modelById } from '@/lib/clavia/partitions';
import { useListFilters } from '@/lib/library/useListFilters';

/** Merges device + folder presets into one filtered/sorted list and owns the
 *  Presets-screen view state. Mirrors useSamplesStateValue, recognition-only. */
function usePresetsStateValue() {
  const { session, presetEntries, setPresetEntries } = useDevice();
  const folder = useFolder();
  const prefs = usePresetsPrefs();
  const imported = useImportedPresets();
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [kind, setKind] = useState<PresetKind | 'all'>('all');
  const [query, setQuery] = useState('');

  // Lazily enumerate the device preset partitions on connect (Stage-4 validated).
  // Best-effort; absent partitions are skipped inside enumeratePresets.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    enumeratePresets(session, modelById('stage-4')!)
      .then((g) => { if (!cancelled) setPresetEntries(g); })
      .catch(() => { /* unsupported — leave empty */ });
    return () => { cancelled = true; };
  }, [session, setPresetEntries]);

  const allEntries: PresetEntry[] = useMemo(() => [
    ...presetEntriesFromDevice(presetEntries),
    ...presetEntriesFromScanned(folder.result.presets),
    ...imported.entries,
  ], [presetEntries, folder.result.presets, imported.entries]);
  const nordCount = allEntries.filter((e) => e.source === 'nord').length;
  const localCount = allEntries.length - nordCount;
  const showSourceFacet = nordCount > 0 && localCount > 0;
  const kinds = presentKinds(allEntries);

  // The list follows the search a beat behind (an interruptible render), so the
  // field keeps up with typing in a big folder.
  const listQuery = useDeferredValue(query);
  const shown = useMemo(
    () => sortPresets(filterPresets(allEntries, source, kind, listQuery), prefs.sort, prefs.favorites),
    [allEntries, source, kind, listQuery, prefs.sort, prefs.favorites],
  );
  const entryById = useCallback((id: string) => allEntries.find((e) => e.id === id), [allEntries]);

  // The list's filters, once: `filtered` and the "clear filters" button both read
  // this, and a filter counts while set even if its facet is hidden right now.
  const { filtered, clearFilters, ensureListed } = useListFilters(shown, [
    // Counts once the list has caught up with the search (listQuery).
    { active: listQuery.trim() !== '', reset: () => setQuery('') },
    { active: source !== 'all', reset: () => setSource('all') },
    { active: kind !== 'all', reset: () => setKind('all') },
  ]);
  return {
    all: allEntries, clearFilters, filtered, ensureListed,
    shown, source, setSource, kind, setKind, query, setQuery,
    prefs, entryById, nordCount, localCount, showSourceFacet, kinds, folder, session,
    importPreset: imported.add, removePreset: imported.remove,
  };
}

type PresetsState = ReturnType<typeof usePresetsStateValue>;
type PresetsData = Pick<PresetsState, 'all' | 'ensureListed'>;
const Ctx = createContext<PresetsState | null>(null);
const DataCtx = createContext<PresetsData | null>(null);

export function PresetsProvider({ children }: { children: ReactNode }) {
  const state = usePresetsStateValue();
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

/** The entries and the jump-to helper, without the search state (see PresetsProvider). */
export function usePresetsData(): PresetsData {
  const v = useContext(DataCtx);
  if (!v) throw new Error('usePresetsData must be used within PresetsProvider');
  return v;
}

export function usePresetsState(): PresetsState {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePresetsState must be used within PresetsProvider');
  return v;
}
