import { useNavigate } from '@tanstack/react-router';
import { LibraryView } from './LibraryView';
import { ProgramView } from '@/components/program/ProgramView';
import { CategorySplit } from './CategorySplit';
import { useLibraryState } from '@/lib/library/LibraryContext';
import { useSplitLayout } from '@/lib/responsive';

/**
 * The Library as master/detail. Both `/library/programs` and `/library/programs/$programId` render
 * this: at wide widths the list stays visible beside a detail pane; below the
 * split breakpoint it shows one pane at a time (today's full-page behavior).
 */
export function LibrarySplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = useLibraryState();
  const navigate = useNavigate();
  const entry = selectedId ? s.entryById(selectedId) : undefined;

  const list = (
    <LibraryView
      entries={s.shown}
      source={s.source}
      query={s.query}
      onSource={s.setSource}
      generation={s.generation}
      onGeneration={s.setGeneration}
      generationsPresent={s.generationsPresent}
      category={s.category}
      onCategory={s.setCategory}
      categoriesPresent={s.categoriesPresent}
      onQuery={s.setQuery}
      onOpen={(e) => {
        if (e.program) navigate({ to: '/library/programs/$programId', params: { programId: e.id } });
        else navigate({ to: '/device' });
      }}
      onImport={s.importFile}
      onRemove={s.imported.remove}
      importError={s.importError}
      onDismissImportError={s.clearImportError}
      prefs={s.prefs}
      folder={s.folder}
    />
  );

  // The program view (when loaded) is the same node in both layouts; only the
  // "nothing to show" copy differs — narrow points back to the list (which is
  // hidden behind the back button), wide points at the list beside it.
  const program = entry?.program ? <ProgramView program={entry.program} /> : null;

  return (
    <CategorySplit
      wide={wide}
      master={list}
      detail={program ?? <p className="lib-empty">Pick a program to see its details.</p>}
      narrowDetail={program ?? <p className="lib-empty">This program isn’t open. Pick it from the Library.</p>}
      hasDetail={!!selectedId}
      onBack={() => navigate({ to: '/library/programs' })}
      backLabel="← Library"
    />
  );
}
