import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolderLibrary } from '@/lib/folder/useFolderLibrary';
import { usePianosPrefs } from '@/lib/library/prefs';
import {
  pianoEntriesFromScanned, pianoEntriesFromDevice, filterPianos, sortPianos,
  type PianoEntry,
} from '@/lib/library/piano-entries';
import type { LibrarySource } from '@/lib/library/types';
import { enumeratePianoLibrary } from '@/lib/device/pianos';

/** Merges device + folder pianos into one filtered/sorted list and owns the
 *  Pianos-screen view state. Mirrors usePresetsStateValue, recognition-only. */
function usePianosStateValue() {
  const { session, pianoEntries, setPianoEntries } = useDevice();
  const folder = useFolderLibrary();
  const prefs = usePianosPrefs();
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    enumeratePianoLibrary(session)
      .then((es) => { if (!cancelled) setPianoEntries(es); })
      .catch(() => { /* piano partition absent/unsupported — leave empty */ });
    return () => { cancelled = true; };
  }, [session, setPianoEntries]);

  const allEntries: PianoEntry[] = [
    ...pianoEntriesFromDevice(pianoEntries),
    ...pianoEntriesFromScanned(folder.result.pianos),
  ];
  const nordCount = allEntries.filter((e) => e.source === 'nord').length;
  const localCount = allEntries.length - nordCount;
  const showSourceFacet = nordCount > 0 && localCount > 0;

  const shown = sortPianos(filterPianos(allEntries, source, query), prefs.sort, prefs.favorites);
  const entryById = (id: string) => allEntries.find((e) => e.id === id);

  return { shown, source, setSource, query, setQuery, prefs, entryById, nordCount, localCount, showSourceFacet, folder, session };
}

type PianosState = ReturnType<typeof usePianosStateValue>;
const Ctx = createContext<PianosState | null>(null);

export function PianosProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={usePianosStateValue()}>{children}</Ctx.Provider>;
}

export function usePianosState(): PianosState {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePianosState must be used within PianosProvider');
  return v;
}
