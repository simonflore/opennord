import type { ReactNode } from 'react';
import './library.css';

/**
 * Shared browse-screen chrome for every Library category (Programs, Presets,
 * User Samples, Piano Samples). Each of those hand-rolled the same panel
 * frame — title + counts + actions over a `BrowseToolbar`, then an empty state
 * or the entry list — which let them drift (different titles, empty copy, spacing).
 * This owns the frame so they're consistent by construction; a category only
 * supplies its title/counts/actions, its toolbar, any banners, and its rows.
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
  /** Between the head and the list (reclaim bar, remove-result status…). */
  banners?: ReactNode;
  /** True when there are no entries to show → render `emptyState` instead of the list. */
  isEmpty: boolean;
  emptyState: ReactNode;
  /** The category's entry rows; wrapped in the list by the panel. */
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div>
            <h1 className="m-0 text-[18px] font-extrabold text-ink">{title}</h1>
            <div className="mt-0.5 text-[11px] text-dim">{counts}</div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {headExtra}
        {toolbar}
      </div>
      {banners}
      <div className="lib-panel__body">
        {isEmpty ? emptyState : (
          // A flush list of rows (LibraryCard), not a card grid: a library is
          // scanned, so density wins here.
          <div className="flex flex-col border-t border-line">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
