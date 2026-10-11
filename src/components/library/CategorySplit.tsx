import { useEffect, useRef, type ReactNode } from 'react';
import { Button, SplitView } from '@/components/ui';

/**
 * Shared master/detail shell for every Library category (Programs, Presets,
 * User Samples, Piano Samples). Each `*Split` hand-rolled the same responsive
 * branch — wide: list beside detail via `SplitView`; narrow: one pane at a
 * time with a "← back" button above the detail — which let them drift (back
 * labels, whether the empty pane rendered). This owns that branch; a category
 * supplies its `master`, its `detail`, whether a detail is selected, and how
 * to go back. The parent still decides `wide` (via `useSplitLayout`) and owns
 * selection (from the route).
 */
export function CategorySplit({
  wide, master, detail, narrowDetail, hasDetail, onBack, backLabel, selectedId,
}: {
  /** True when there's room for both panes (from `useSplitLayout`). */
  wide: boolean;
  master: ReactNode;
  /** Detail pane (wide), and the fallback narrow detail when `narrowDetail` is omitted. */
  detail: ReactNode;
  /** Detail shown below the back button on narrow screens; defaults to `detail`. */
  narrowDetail?: ReactNode;
  /** Whether a detail is selected — narrow shows only the master until it is. */
  hasDetail: boolean;
  onBack: () => void;
  backLabel: string;
  /** The open entry: when it changes, its row (`data-open-row`) scrolls into the list's view. */
  selectedId?: string;
}) {
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

  // Narrow: the list unmounts while an entry is open, and the router scrolls the
  // page to the top on each navigation. So remember how far down the list was,
  // and put it back on return (after the router's own reset, hence the frame).
  const listY = useRef(0);
  const showingList = !wide && !hasDetail;
  useEffect(() => {
    if (!showingList) return;
    const restore = requestAnimationFrame(() => window.scrollTo(0, listY.current));
    const save = () => { listY.current = window.scrollY; };
    window.addEventListener('scroll', save, { passive: true });
    return () => { cancelAnimationFrame(restore); window.removeEventListener('scroll', save); };
  }, [showingList]);

  // Narrow: one pane at a time — master until something is selected, then the
  // detail with a back button to return to the list.
  if (!wide) {
    if (!hasDetail) return <>{master}</>;
    return (
      <div>
        <Button variant="ghost" onClick={onBack}>{backLabel}</Button>
        {narrowDetail ?? detail}
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
