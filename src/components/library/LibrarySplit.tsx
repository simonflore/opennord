import { useCallback } from 'react';
import { Blueprint, Button } from '@/components/ui';
import { LibraryView } from './LibraryView';
import { useStepKeys } from './useStepKeys';
import { useFullViewKeys } from './useFullViewKeys';
import { ProgramView } from '@/components/program/ProgramView';
import { CategorySplit } from './CategorySplit';
import { EmptyNote, NotListedNote } from './EmptyNote';
import { useLibraryState } from '@/lib/library/LibraryContext';
import { useSplitLayout } from '@/lib/responsive';
import { useCloseRemoved, useOpenEntry } from './openEntry';

const noop = () => {};

/**
 * The Library as master/detail. `/library/programs/{-$programId}` renders
 * this: at wide widths the list stays visible beside a detail pane; below the
 * split breakpoint it shows one pane at a time (today's full-page behavior).
 */
export function LibrarySplit({ selectedId, full = false, onFull }: {
  selectedId?: string;
  /** The open program across the full width (`?view=full`), wide screens only. */
  full?: boolean;
  /** Open or close the full view; without it there's no full view. */
  onFull?: (on: boolean) => void;
}) {
  const wide = useSplitLayout();
  const s = useLibraryState();
  const closeRemoved = useCloseRemoved('/library/programs');
  const open = useOpenEntry();
  const entry = selectedId ? s.entryById(selectedId) : undefined;
  // J/K step through the programs, here so they keep working with the list folded away (narrow).
  useStepKeys(s.shown, selectedId, open.program);
  // Stable, so the program table's memoised rows skip renders that don't touch them.
  const { remove } = s.imported;
  const onRemove = useCallback((id: string) => void remove(id).then(() => closeRemoved(id)), [remove, closeRemoved]);

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
      onOpen={open.program}
      onImport={s.importFile}
      onRemove={onRemove}
      importError={s.importError}
      onDismissImportError={s.clearImportError}
      prefs={s.prefs}
      folder={s.folder}
      engines={s.engines}
      onToggleEngine={s.toggleEngine}
      splitOnly={s.splitOnly}
      onSplitOnly={s.setSplitOnly}
    />
  );

  // The program view (when loaded) is the same node in both layouts; only the
  // "nothing to show" copy differs — narrow points back to the list (which is
  // hidden behind the back button), wide points at the list beside it.
  // Keyed per program: the list and programs share one route now, so without a
  // key the next program would inherit this one's view state (its scene).
  const program = entry?.program ? <ProgramView key={entry.id} program={entry.program} /> : null;
  // The inspector is a quick look; the full view gives the engines the page.
  // Only wide, where the list sits beside the program: narrow already shows it alone.
  const canFull = wide && !!program && !!onFull;
  const showFull = canFull && full;
  useFullViewKeys(canFull, showFull, onFull ?? noop);

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
          detail={(canFull ? (
            // --detail-bar: the bar's height, so the program header pins below it, not under it.
            <div className="[--detail-bar:36px]">
              <div className="sticky top-0 z-[4] flex h-[var(--detail-bar)] items-center bg-bg">
                <Button variant="ghost" onClick={() => onFull(!showFull)} aria-keyshortcuts={showFull ? 'F Escape' : 'F'}>
                  {showFull ? '← Programs' : 'Full view'}
                  <kbd aria-hidden="true" className="font-mono text-[10px] text-muted">{showFull ? 'Esc' : 'F'}</kbd>
                </Button>
              </div>
              {program}
            </div>
          ) : program)
            ?? (entry ? <EmptyNote>This slot hasn’t been read from your Nord yet. Read it on the Device page.</EmptyNote>
              : selectedId ? <NotListedNote noun="program" /> : null)}
          hasDetail={!!selectedId}
          // Nothing open: the table spans the page, every column showing. Open,
          // on a wide screen, the program sits in an inspector column beside it.
          solo={!selectedId}
          inspector
          full={showFull}
          list="/library/programs"
          backLabel="← Library"
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
