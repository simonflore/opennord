import { createContext, useContext, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { useImportedLibrary } from '@/lib/library/useImportedLibrary';
import { useLibraryPrefs } from '@/lib/library/prefs';
import { nordEntriesFromDevice, entriesFromScannedPrograms, filterEntries, sortEntries } from '@/lib/library/entries';
import type { LibraryEntry, LibrarySource } from '@/lib/library/types';

/** Merges the three program sources (device, folder, imports) into one list and
 *  owns the library-screen view state. Lifted out of the old Shell so both the
 *  list route and the program-detail route read the same data. */
function useLibraryStateValue() {
  const { entries: deviceEntries } = useDevice();
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [query, setQuery] = useState('');
  const folder = useFolder();
  const imported = useImportedLibrary();
  const prefs = useLibraryPrefs();

  const allEntries: LibraryEntry[] = [
    ...nordEntriesFromDevice(deviceEntries),
    ...entriesFromScannedPrograms(folder.result.programs),
    ...imported.entries,
  ];
  const shown = sortEntries(filterEntries(allEntries, source, query), prefs.sort, prefs.favorites);
  const entryById = (id: string) => allEntries.find((e) => e.id === id);

  function importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ns4p,.ns4o,.ns4n,.ns4y,.ns3p,.ns3f,.ns2p';
    // Append to the DOM: a detached file input's click() is silently ignored on
    // some WebKit/iOS WKWebView builds (we wrap to iOS via Capacitor).
    input.style.display = 'none';
    document.body.appendChild(input);
    const cleanup = () => input.remove();
    input.onchange = async () => {
      const f = input.files?.[0];
      cleanup();
      if (!f) return;
      await imported.add(f);
    };
    input.oncancel = cleanup;
    input.click();
  }

  return { shown, source, setSource, query, setQuery, importFile, imported, prefs, folder, entryById };
}

type LibraryState = ReturnType<typeof useLibraryStateValue>;
const Ctx = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useLibraryStateValue()}>{children}</Ctx.Provider>;
}

export function useLibraryState(): LibraryState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibraryState must be used within LibraryProvider');
  return v;
}
