import { cn } from '@/lib/cn';
import type { NavTo } from './nav';

const TABS: { to: NavTo; label: string }[] = [
  { to: '/library/programs', label: 'Programs' },
  { to: '/library/presets', label: 'Presets' },
  { to: '/library/samples', label: 'Samples' },
  { to: '/library/pianos', label: 'Pianos' },
];

const tab = cn(
  'flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 border-0 bg-transparent pb-3 pt-2.5',
  'text-[11px] font-semibold uppercase tracking-[0.06em]',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]',
);

function Led({ on }: { on: boolean }) {
  return <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-accent shadow-[0_0_6px_var(--accent)]' : 'bg-line')} aria-hidden="true" />;
}

/**
 * The phone's bottom tab bar, standing in for the rail below 720px: the four
 * library lists, each with an LED that lights on the open one, and More, which
 * opens the palette (its empty state lists every page).
 */
export function PhoneTabs({ active, onNavigate, onMore }: { active: string; onNavigate: (to: NavTo) => void; onMore: () => void }) {
  const path = '/' + active;
  const current = TABS.find((t) => path === t.to || path.startsWith(t.to + '/'));
  return (
    <nav
      aria-label="Sections"
      className="on-tabs fixed inset-x-0 bottom-0 z-30 hidden border-t border-line bg-surface max-[720px]:flex"
    >
      {TABS.map((t) => {
        const on = t === current;
        return (
          <button key={t.to} className={cn(tab, on ? 'text-ink' : 'text-muted')} aria-current={on ? 'page' : undefined} onClick={() => onNavigate(t.to)}>
            <Led on={on} />
            {t.label}
          </button>
        );
      })}
      <button className={cn(tab, !current ? 'text-ink' : 'text-muted')} onClick={onMore}>
        <Led on={!current} />
        More
      </button>
    </nav>
  );
}
