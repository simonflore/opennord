import type { ReactNode } from 'react';
import './library.css';

/**
 * Shared browse-screen chrome for every Library category (Programs, Presets,
 * User Samples, Piano Samples). Each of those hand-rolled the same `lib-panel`
 * frame — title + counts + actions over a `BrowseToolbar`, then an empty state
 * or a card grid — which let them drift (different titles, empty copy, spacing).
 * This owns the frame so they're consistent by construction; a category only
 * supplies its title/counts/actions, its toolbar, any banners, and its cards.
 */
export function CategoryPanel({
  title, counts, actions, headExtra, toolbar, banners, isEmpty, emptyState, children,
}: {
  /** Page heading — should match the category's rail label. */
  title: string;
  /** Sub-line under the title (count + source breakdown). */
  counts: ReactNode;
  /** Header-right actions (import, folder, scan-unused…). */
  actions?: ReactNode;
  /** Inside the head, above the toolbar — folder chip / reconnect / scan notices. */
  headExtra?: ReactNode;
  /** The `<BrowseToolbar>` element (search + facets + sort). */
  toolbar: ReactNode;
  /** Between the head and the grid (reclaim bar, remove-result status…). */
  banners?: ReactNode;
  /** True when there are no cards to show → render `emptyState` instead of the grid. */
  isEmpty: boolean;
  emptyState: ReactNode;
  /** The category's cards; wrapped in `lib-grid` by the panel. */
  children: ReactNode;
}) {
  return (
    <div className="lib-panel">
      <div className="lib-panel__head">
        <div className="lib-head">
          <div>
            <h1 className="lib-title">{title}</h1>
            <div className="lib-counts">{counts}</div>
          </div>
          {actions && <div className="lib-actions">{actions}</div>}
        </div>
        {headExtra}
        {toolbar}
      </div>
      {banners}
      <div className="lib-panel__body">
        {isEmpty ? emptyState : <div className="lib-grid">{children}</div>}
      </div>
    </div>
  );
}
