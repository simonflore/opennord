import { createContext, useContext, useState, type ReactNode } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { useImportedLibrary } from '@/lib/library/useImportedLibrary';
import { useLibraryPrefs } from '@/lib/library/prefs';
import { nordEntriesFromDevice, entriesFromScannedPrograms, filterEntries, sortEntries } from '@/lib/library/entries';
import type { LibraryEntry, LibrarySource } from '@/lib/library/types';

/** Extensions the Programs importer accepts — programs/performances only.
 *  Presets (.ns4o/.ns4n/.ns4y) go to the Presets page and samples (.nsmp*) to
 *  Samples, so they can't be silently stored on the wrong page. */
const PROGRAM_IMPORT_EXTS = ['.ns4p', '.ns3p', '.ns3f', '.ns2p'];
const PRESET_EXTS = ['.ns4o', '.ns4n', '.ns4y', '.ns3y', '.ns2y'];
const SAMPLE_EXTS = ['.nsmp', '.nsmp3', '.nsmp4'];

/** Merges the three program sources (device, folder, imports) into one list and
 *  owns the library-screen view state. Lifted out of the old Shell so both the
 *  list route and the program-detail route read the same data. */
function useLibraryStateValue() {
  const { entries: deviceEntries } = useDevice();
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [generation, setGeneration] = useState<LibraryEntry['generation'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [importError, setImportError] = useState('');
  const folder = useFolder();
  const imported = useImportedLibrary();
  const prefs = useLibraryPrefs();

  const allEntries: LibraryEntry[] = [
    ...nordEntriesFromDevice(deviceEntries),
    ...entriesFromScannedPrograms(folder.result.programs),
    ...imported.entries,
  ];
  // Generations present across the *unfiltered* list — drives whether the format
  // facet is worth showing (only when there's more than one). Stage 4 → 2 order.
  const generationsPresent = (['Stage 4', 'Stage 3', 'Stage 2'] as const)
    .filter((g) => allEntries.some((e) => e.generation === g));
  const shown = sortEntries(filterEntries(allEntries, source, query, generation), prefs.sort, prefs.favorites);
  const entryById = (id: string) => allEntries.find((e) => e.id === id);

  function importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = PROGRAM_IMPORT_EXTS.join(',');
    // Append to the DOM: a detached file input's click() is silently ignored on
    // some WebKit/iOS WKWebView builds (we wrap to iOS via Capacitor).
    input.style.display = 'none';
    document.body.appendChild(input);
    const cleanup = () => input.remove();
    input.onchange = async () => {
      const f = input.files?.[0];
      cleanup();
      if (!f) return;
      const lower = f.name.toLowerCase();
      if (!PROGRAM_IMPORT_EXTS.some((e) => lower.endsWith(e))) {
        setImportError(
          PRESET_EXTS.some((e) => lower.endsWith(e))
            ? `“${f.name}” is a preset — import it from the Presets page.`
            : SAMPLE_EXTS.some((e) => lower.endsWith(e))
              ? `“${f.name}” is a sample — import it from the Samples page.`
              : `“${f.name}” isn’t a Nord program file.`,
        );
        return;
      }
      setImportError('');
      await imported.add(f);
    };
    input.oncancel = cleanup;
    input.click();
  }

  return {
    shown, source, setSource, generation, setGeneration, generationsPresent, query, setQuery,
    importFile, importError, clearImportError: () => setImportError(''), imported, prefs, folder, entryById,
  };
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
