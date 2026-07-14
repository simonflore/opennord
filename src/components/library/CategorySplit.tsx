import type { ReactNode } from 'react';
import { Button, SplitView } from '@/components/ui';

/**
 * Shared master/detail shell for every Library category (Programs, Presets,
 * User Samples, Piano Samples). Each `*Split` hand-rolled the same responsive
 * branch — wide: list beside detail via `SplitView`; narrow: one pane at a
 * time with a "← back" button above the detail — which let them drift (back
 * labels, whether the empty pane rendered). This owns that branch; a category
 * supplies its `master`, its `detail`, whether a detail is selected, and how
 * to go back. The parent still decides `wide` (via `useSplitLayout`) and owns
 * selection, since that's URL-driven for some categories and local for others.
 */
export function CategorySplit({
  wide, master, detail, narrowDetail, hasDetail, onBack, backLabel,
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
}) {
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
  return <SplitView master={master} detail={detail} />;
}
