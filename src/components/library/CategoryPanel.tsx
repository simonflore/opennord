import type { ReactNode } from 'react';
import './library.css';

/**
 * Shared browse-screen chrome for every Library category (Programs, Presets,
 * User Samples, Piano Samples). Each of those hand-rolled the same panel
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
  /** The category's cards; wrapped in the card grid by the panel. */
  children: ReactNode;
}) {
  return (
    // `lib-panel`/`lib-panel__body` stay as class hooks: library.css keys
    // `.on-split .lib-panel`/`.lib-panel__body` descendant selectors off them
    // to stretch/scroll this panel when nested inside the Library's split
    // view (see SplitView.tsx + library.css for why that can't be plain
    // utilities). The rest of this shell converts freely.
    <div className="lib-panel flex flex-col">
      <div className="flex-none">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="m-0 text-[18px] font-extrabold text-ink">{title}</h1>
            <div className="mt-0.5 text-[11px] text-dim">{counts}</div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {headExtra}
        {toolbar}
      </div>
      {banners}
      <div className="lib-panel__body">
        {isEmpty ? emptyState : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3 max-[560px]:grid-cols-1">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
