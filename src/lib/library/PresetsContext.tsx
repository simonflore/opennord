import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolderLibrary } from '@/lib/folder/useFolderLibrary';
import { usePresetsPrefs } from '@/lib/library/prefs';
import {
  presetEntriesFromScanned, presetEntriesFromDevice, filterPresets, sortPresets, presentKinds,
  type PresetEntry,
} from '@/lib/library/preset-entries';
import type { PresetKind } from '@/lib/clavia/preset-kind';
import type { LibrarySource } from '@/lib/library/types';
import { enumeratePresets } from '@/lib/device/presets';
import { modelById } from '@/lib/clavia/partitions';

/** Merges device + folder presets into one filtered/sorted list and owns the
 *  Presets-screen view state. Mirrors useSamplesStateValue, recognition-only. */
function usePresetsStateValue() {
  const { session, presetEntries, setPresetEntries } = useDevice();
  const folder = useFolderLibrary();
  const prefs = usePresetsPrefs();
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

  const allEntries: PresetEntry[] = [
    ...presetEntriesFromDevice(presetEntries),
    ...presetEntriesFromScanned(folder.result.presets),
  ];
  const nordCount = allEntries.filter((e) => e.source === 'nord').length;
  const localCount = allEntries.length - nordCount;
  const showSourceFacet = nordCount > 0 && localCount > 0;
  const kinds = presentKinds(allEntries);

  const shown = sortPresets(filterPresets(allEntries, source, kind, query), prefs.sort, prefs.favorites);
  const entryById = (id: string) => allEntries.find((e) => e.id === id);

  return {
    shown, source, setSource, kind, setKind, query, setQuery,
    prefs, entryById, nordCount, localCount, showSourceFacet, kinds, folder, session,
  };
}

type PresetsState = ReturnType<typeof usePresetsStateValue>;
const Ctx = createContext<PresetsState | null>(null);

export function PresetsProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={usePresetsStateValue()}>{children}</Ctx.Provider>;
}

export function usePresetsState(): PresetsState {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePresetsState must be used within PresetsProvider');
  return v;
}
