import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { usePresetsPrefs } from '@/lib/library/prefs';
import {
  presetEntriesFromScanned, presetEntriesFromDevice, filterPresets, sortPresets, presentKinds, cloudPresetEntries, presetFileExt,
  type PresetEntry,
} from '@/lib/library/preset-entries';
import { useCloudSnapshot } from '@/lib/library/CloudSnapshotContext';
import { useSoundRows } from '@/lib/library/useSoundRows';
import { safeFilename } from '@/lib/ns4/bundle';
import { useImportedPresets } from '@/lib/library/useImportedPresets';
import type { PresetKind } from '@/lib/clavia/preset-kind';
import type { LibrarySource } from '@/lib/library/types';
import { enumeratePresets } from '@/lib/device/presets';
import { modelById } from '@/lib/clavia/partitions';
import { useListFilters } from '@/lib/library/useListFilters';

// A device preset has its kind but no file tag; organ and synth presets of one name are not the same sound.
const PRESET_ROWS = { typeOf: (e: PresetEntry) => e.kind };

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

  // Lazily enumerate the device preset partitions on connect. Stage 4 only: its
  // preset indices (7/8/9) hold programs, Live or settings on other models, which
  // would be listed here as presets. Best-effort; absent partitions are skipped
  // inside enumeratePresets.
  useEffect(() => {
    if (!session?.stage4Layout) return;
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
  // One row per preset, as in the program list: `allEntries` stays what is here
  // and on the Nord (what backup and the share picker read); rows add the cloud.
  const cloud = useCloudSnapshot();
  const cloudEntries = useMemo(() => cloudPresetEntries(cloud.items, cloud.files), [cloud.items, cloud.files]);
  const { rows, byId, nordCount, localCount, showCloud, showSourceFacet } = useSoundRows(allEntries, cloudEntries, PRESET_ROWS);
  const kinds = presentKinds(rows);

  // The list follows the search a beat behind (an interruptible render), so the
  // field keeps up with typing in a big folder.
  const listQuery = useDeferredValue(query);
  const shown = useMemo(
    () => sortPresets(filterPresets(rows, source, kind, listQuery), prefs.sort, prefs.favorites),
    [rows, source, kind, listQuery, prefs.sort, prefs.favorites],
  );
  const entryById = useCallback((id: string) => byId.get(id), [byId]);
  // A copy of a cloud preset in OpenNord's own storage.
  const { add } = imported;
  const keepCopy = useCallback((e: PresetEntry, bytes: Uint8Array) =>
    add(new File([bytes as BlobPart], `${safeFilename(e.name)}.${presetFileExt(e.kind, bytes)}`)), [add]);

  // The list's filters, once: `filtered` and the "clear filters" button both read
  // this, and a filter counts while set even if its facet is hidden right now.
  const { filtered, clearFilters, ensureListed } = useListFilters(shown, [
    // Counts once the list has caught up with the search (listQuery).
    { active: listQuery.trim() !== '', reset: () => setQuery('') },
    { active: source !== 'all', reset: () => setSource('all') },
    { active: kind !== 'all', reset: () => setKind('all') },
  ]);
  return {
    all: allEntries, rows, clearFilters, filtered, ensureListed,
    shown, source, setSource, kind, setKind, query, setQuery,
    prefs, entryById, nordCount, localCount, showSourceFacet, showCloud, kinds, folder, session,
    importPreset: imported.add, removePreset: imported.remove, cloud, keepCopy,
  };
}

type PresetsState = ReturnType<typeof usePresetsStateValue>;
type PresetsData = Pick<PresetsState, 'all' | 'rows' | 'ensureListed'>;
const Ctx = createContext<PresetsState | null>(null);
const DataCtx = createContext<PresetsData | null>(null);

export function PresetsProvider({ children }: { children: ReactNode }) {
  const state = usePresetsStateValue();
  // What the always-mounted shell reads (the rail's count, the ⌘K palette):
  // its own context, so a search keystroke here doesn't re-render the shell.
  const { all, rows, ensureListed } = state;
  const data = useMemo(() => ({ all, rows, ensureListed }), [all, rows, ensureListed]);
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
