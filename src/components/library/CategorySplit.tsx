import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, SplitView } from '@/components/ui';

type ListRoute = '/library/programs' | '/library/presets' | '/library/samples' | '/library/pianos';

/**
 * Shared master/detail shell for every Library category (Programs, Presets,
 * User Samples, Piano Samples). Each `*Split` hand-rolled the same responsive
 * branch — wide: list beside detail via `SplitView`; narrow: one pane at a
 * time with a "← back" button above the detail — which let them drift (back
 * labels, whether the empty pane rendered). This owns that branch; a category
 * supplies its `master`, its `detail`, whether a detail is selected, and its
 * list's route. The parent still decides `wide` (via `useSplitLayout`) and owns
 * selection (from the route).
 */
export function CategorySplit({
  wide, master, detail, hasDetail, list, known, onBack, backLabel, selectedId,
}: {
  /** True when there's room for both panes (from `useSplitLayout`). */
  wide: boolean;
  master: ReactNode;
  /** Detail pane: beside the list (wide), or below the back button (narrow). */
  detail: ReactNode;
  /** Whether a detail is selected — narrow shows only the master until it is. */
  hasDetail: boolean;
  /** The bare list's route: where back goes, and where a removed entry leaves to. */
  list: ListRoute;
  /** Whether the open entry (`selectedId`) is in the list now. */
  known: boolean;
  /** Back to the list; defaults to navigating to `list`. */
  onBack?: () => void;
  backLabel: string;
  /** The open entry: when it changes, its row (`data-open-row`) scrolls into the list's view. */
  selectedId?: string;
}) {
  const navigate = useNavigate();
  // Back to the bare list when the open entry goes away (removed, or gone with
  // its Nord), instead of keeping its route and calling it "not in your
  // library". Only an entry that was shown counts: a deep link whose entry
  // hasn't loaded yet stays put. Replaces the history entry, so Back skips it.
  const shown = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (known) shown.current = selectedId;
    else if (selectedId && shown.current === selectedId) {
      shown.current = undefined;
      void navigate({ to: list, replace: true });
    }
  }, [selectedId, known, list, navigate]);

  const masterBox = useRef<HTMLDivElement>(null);
  // Once per selection, as soon as its row is on screen: the rows can arrive
  // after the selection (a folder scan, the Nord's list, narrow → wide), so this
  // checks after every render but scrolls only the first time it finds the row.
  const revealed = useRef<string | null>(null);
  // The wide list is a fresh mount after narrow → wide, so it needs revealing again.
  useEffect(() => { revealed.current = null; }, [wide]);
  useEffect(() => {
    if (!selectedId) { revealed.current = null; return; }
    if (revealed.current === selectedId) return;
    const row = masterBox.current?.querySelector<HTMLElement>('[data-open-row]');
    if (!row) return;
    revealed.current = selectedId;
    revealInScroller(row);
  });

  // Narrow: one pane at a time — master until something is selected, then the
  // detail with a back button to return to the list.
  if (!wide) {
    if (!hasDetail) return <>{master}</>;
    return (
      <div>
        <Button variant="ghost" onClick={onBack ?? (() => navigate({ to: list }))}>{backLabel}</Button>
        {detail}
      </div>
    );
  }
  return <SplitView master={<div ref={masterBox} className="contents">{master}</div>} detail={detail} />;
}

/**
 * Scroll `row` into view inside its nearest scrolling ancestor only — never
 * the page — and only as far as needed (a ⌘K jump or deep link can name a row
 * far down the list).
 */
function revealInScroller(row: HTMLElement) {
  let box = row.parentElement;
  while (box && !(/(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) {
    box = box.parentElement;
  }
  if (!box || box === document.scrollingElement) return;
  const r = row.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  if (r.top < b.top) box.scrollTop -= b.top - r.top;
  else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom;
}
