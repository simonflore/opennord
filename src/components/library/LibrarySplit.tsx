import { useNavigate } from '@tanstack/react-router';
import { Blueprint } from '@/components/ui';
import { LibraryView } from './LibraryView';
import { ProgramView } from '@/components/program/ProgramView';
import { CategorySplit } from './CategorySplit';
import { EmptyNote } from './EmptyNote';
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

  // The blueprint frame is mounted HERE rather than on the shell's <main>
  // (routes/root.tsx) on purpose: <main> is shared by every app screen, and
  // mounting it there would silently ship the grid to device, samples,
  // compatibility and dev before any of them has been looked at.
  // `quiet` keeps patch density the subject; the frame stays at the page
  // boundary and never enters a row or card.
  return (
    <div className="relative">
      <Blueprint variant="quiet" />
      <div className="relative z-10">
        <CategorySplit
          wide={wide}
          master={list}
          detail={program ?? <EmptyNote>Pick a program to see its details.</EmptyNote>}
          narrowDetail={program ?? <EmptyNote>This program isn’t open. Pick it from the Library.</EmptyNote>}
          hasDetail={!!selectedId}
          onBack={() => navigate({ to: '/library/programs' })}
          backLabel="← Library"
        />
      </div>
    </div>
  );
}
