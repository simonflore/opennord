import { Blueprint } from '@/components/ui';
import { LibraryView } from './LibraryView';
import { useStepKeys } from './useStepKeys';
import { ProgramView } from '@/components/program/ProgramView';
import { CategorySplit } from './CategorySplit';
import { EmptyNote, NotListedNote } from './EmptyNote';
import { useLibraryState } from '@/lib/library/LibraryContext';
import { useSplitLayout } from '@/lib/responsive';
import { useCloseRemoved, useOpenEntry } from './openEntry';

/**
 * The Library as master/detail. `/library/programs/{-$programId}` renders
 * this: at wide widths the list stays visible beside a detail pane; below the
 * split breakpoint it shows one pane at a time (today's full-page behavior).
 */
export function LibrarySplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = useLibraryState();
  const closeRemoved = useCloseRemoved('/library/programs');
  const open = useOpenEntry();
  const entry = selectedId ? s.entryById(selectedId) : undefined;
  // J/K step through the programs, here so they keep working with the list folded away (narrow).
  useStepKeys(s.shown, selectedId, open.program);

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
      clearFilters={s.clearFilters}
      filtered={s.filtered}
      activeId={selectedId}
      onOpen={(e) => open.program(e)}
      onImport={s.importFile}
      onRemove={(id) => void s.imported.remove(id).then(() => closeRemoved(id))}
      importError={s.importError}
      onDismissImportError={s.clearImportError}
      prefs={s.prefs}
      folder={s.folder}
    />
  );

  // The program view (when loaded) is the same node in both layouts; only the
  // "nothing to show" copy differs — narrow points back to the list (which is
  // hidden behind the back button), wide points at the list beside it.
  // Keyed per program: the list and programs share one route now, so without a
  // key the next program would inherit this one's view state (its scene).
  const program = entry?.program ? <ProgramView key={entry.id} program={entry.program} /> : null;

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
          detail={program
            ?? (entry ? <EmptyNote>This slot hasn’t been read from your Nord yet. Read it on the Device page.</EmptyNote>
              : selectedId ? <NotListedNote noun="program" /> : null)}
          hasDetail={!!selectedId}
          // Nothing open: the table spans the page, every column showing.
          solo={!selectedId}
          list="/library/programs"
          backLabel="← Library"
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
