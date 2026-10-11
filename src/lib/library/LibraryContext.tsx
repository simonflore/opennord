import { createContext, useCallback, useContext, useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { useListFilters } from '@/lib/library/useListFilters';
import type { EngineKind } from '@/lib/clavia/engines';
import { useDevice } from '@/lib/device/DeviceContext';
import { useFolder } from '@/lib/folder/FolderContext';
import { useImportedLibrary } from '@/lib/library/useImportedLibrary';
import { useLibraryPrefs } from '@/lib/library/prefs';
import { nordEntriesFromDevice, entriesFromScannedPrograms, filterEntries, sortEntries, presentCategories } from '@/lib/library/entries';
import type { LibraryEntry, LibrarySource } from '@/lib/library/types';

/** Extensions the Programs importer accepts — programs/performances only.
 *  Presets (.ns4o/.ns4n/.ns4y) go to the Presets page and samples (.nsmp*) to
 *  Samples, so they can't be silently stored on the wrong page. */
const PROGRAM_IMPORT_EXTS = ['.ns4p', '.ns3p', '.ns3f', '.ns2p'];
const PRESET_EXTS = ['.ns4o', '.ns4n', '.ns4y', '.ns3y', '.ns2s'];
const SAMPLE_EXTS = ['.nsmp', '.nsmp3', '.nsmp4'];

/** Merges the three program sources (device, folder, imports) into one list and
 *  owns the library-screen view state. Lifted out of the old Shell so both the
 *  list route and the program-detail route read the same data. */
function useLibraryStateValue() {
  const { entries: deviceEntries } = useDevice();
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [generation, setGeneration] = useState<LibraryEntry['generation'] | 'all'>('all');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [query, setQuery] = useState('');
  // The LED filter keys: programs that play every lit engine, and only split ones.
  const [engines, setEngines] = useState<ReadonlySet<EngineKind>>(new Set());
  const [splitOnly, setSplitOnly] = useState(false);
  const toggleEngine = useCallback((k: EngineKind) => setEngines((on) => {
    const next = new Set(on);
    if (!next.delete(k)) next.add(k);
    return next;
  }), []);
  const [importError, setImportError] = useState('');
  const folder = useFolder();
  const imported = useImportedLibrary();
  const prefs = useLibraryPrefs();

  // Memoised so the list keeps its identity across renders that don't change it
  // (the ⌘K palette's command list is built from it).
  // Each source's entries are built on their own, so a device poll or a rescan
  // keeps the other sources' entry objects (and their memoised table rows).
  const nordEntries = useMemo(() => nordEntriesFromDevice(deviceEntries), [deviceEntries]);
  const folderEntries = useMemo(() => entriesFromScannedPrograms(folder.result.programs), [folder.result.programs]);
  const allEntries: LibraryEntry[] = useMemo(
    () => [...nordEntries, ...folderEntries, ...imported.entries],
    [nordEntries, folderEntries, imported.entries],
  );
  // Generations present across the *unfiltered* list — drives whether the format
  // facet is worth showing (only when there's more than one). Stage 4 → 2 order.
  const generationsPresent = useMemo(() => (['Stage 4', 'Stage 3', 'Stage 2'] as const)
    .filter((g) => allEntries.some((e) => e.generation === g)), [allEntries]);
  // Categories present across the *unfiltered* list — drives whether the
  // category facet is worth showing (only when there's more than one).
  const categoriesPresent = useMemo(() => presentCategories(allEntries), [allEntries]);
  // The list follows the search a beat behind (an interruptible render), so the
  // field keeps up with typing in a library of thousands.
  const listQuery = useDeferredValue(query);
  // Memoised: the Split key reads each program's zones, which other renders
  // (an open program, a device poll) shouldn't redo.
  const shown = useMemo(() => sortEntries(
    filterEntries(allEntries, source, listQuery, generation, category, { engines, split: splitOnly }),
    prefs.sort, prefs.favorites,
  ), [allEntries, source, listQuery, generation, category, engines, splitOnly, prefs.sort, prefs.favorites]);
  const entryById = useCallback((id: string) => allEntries.find((e) => e.id === id), [allEntries]);
  // The list's filters, once: `filtered` and the "clear filters" button both read
  // this, and a filter counts while set even if its facet is hidden right now.
  const { filtered, clearFilters, ensureListed } = useListFilters(shown, [
    // The search counts once the list has caught up with it (listQuery), so the
    // empty state never reads a still-empty list as an empty library.
    { active: listQuery.trim() !== '', reset: () => setQuery('') },
    { active: source !== 'all', reset: () => setSource('all') },
    { active: generation !== 'all', reset: () => setGeneration('all') },
    { active: category !== 'all', reset: () => setCategory('all') },
    { active: engines.size > 0, reset: () => setEngines(new Set()) },
    { active: splitOnly, reset: () => setSplitOnly(false) },
  ]);

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
    all: allEntries, clearFilters, filtered, ensureListed,
    shown, source, setSource, generation, setGeneration, generationsPresent,
    category, setCategory, categoriesPresent, query, setQuery,
    engines, toggleEngine, splitOnly, setSplitOnly,
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
