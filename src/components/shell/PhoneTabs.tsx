import { cn } from '@/lib/cn';
import { READY_CATEGORIES, categoryForPath } from '../../lib/library/categories';
import { Led } from './Led';
import type { NavTo } from './nav';

const tab = cn(
  'flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 border-0 bg-transparent pb-3 pt-2.5',
  'text-[11px] font-semibold uppercase tracking-[0.06em]',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]',
);

/**
 * The phone's bottom tab bar, standing in for the rail below 720px: the library
 * lists, each with an LED that lights on the open one, and More, which opens
 * the palette (its empty state lists every page).
 */
export function PhoneTabs({ path, onNavigate, onMore }: { path: string; onNavigate: (to: NavTo) => void; onMore: () => void }) {
  const current = categoryForPath(path);
  return (
    <nav
      aria-label="Sections"
      className="on-tabs fixed inset-x-0 bottom-0 z-30 hidden border-t border-line bg-surface max-[720px]:flex"
    >
      {READY_CATEGORIES.map((c) => {
        const on = c === current;
        return (
          <button key={c.id} className={cn(tab, on ? 'text-ink' : 'text-muted')} aria-current={on ? 'page' : undefined} onClick={() => onNavigate(c.path)}>
            <Led on={on} />
            {c.short}
          </button>
        );
      })}
      {/* More opens the palette (every page), so it's never the "current" section. */}
      <button className={cn(tab, 'text-muted')} aria-haspopup="dialog" onClick={onMore}>
        <Led on={false} />
        More
      </button>
    </nav>
  );
}
