import { Fragment, memo, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { READY_CATEGORIES, isUnder, type CategoryId } from '../../lib/library/categories';
import type { LibrarySource } from '../../lib/library/types';
import { BetaBadge } from './BetaBadge';
import { Led } from './Led';
import { groupLabel, rowActive } from './styles';
import { ABOUT, COMMUNITY_SUB, COMMUNITY_TO, DEV_DESTS, useTools, type NavTo } from './nav';
import { FolderMenu } from '../library/FolderMenu';
import { useFolderOptional } from '../../lib/folder/FolderContext';

/** One program source in the Sources group: where the programs in the library come from. */
export interface SourceItem {
  source: LibrarySource;
  label: string;
  count: number;
  /** Lights the LED: the source is live (the Nord is connected). */
  live: boolean;
}

interface Props {
  /** The current pathname, e.g. "/library/programs/abc". */
  path: string;
  onNavigate: (to: NavTo) => void;
  /** How many entries each library category holds. */
  counts: Record<CategoryId, number>;
  /** Program sources with entries; picking one filters the program list to it. */
  sources: SourceItem[];
  /** The source the program list is filtered to, if any. */
  activeSource: LibrarySource | 'all';
  /** Show only the programs from one source, or every source again with 'all'. */
  onPickSource: (source: LibrarySource | 'all') => void;
  /** A folder is connected: it's listed under Sources with its menu. */
  hasFolder?: boolean;
}

/**
 * A rail entry, set like the B×A console: lowercase mono (by CSS, so labels stay
 * in sentence case in the data), the count right-aligned, and the active entry
 * raised with the accent bar on its left edge.
 */
function Item({ label, active, onClick, count, led, sub, toggle }: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  /** Show an LED before the label; true lights it (only "connected" does). */
  led?: boolean;
  sub?: boolean;
  /** A filter rather than a page: announced as pressed, not as the current page. */
  toggle?: boolean;
}) {
  return (
    <button
      className={cn(
        'relative flex w-full items-center gap-2 border-0 bg-transparent py-1.5 pr-4 text-left font-mono text-xs lowercase',
        sub ? 'pl-7 text-[11px]' : 'pl-4',
        'cursor-pointer transition-colors duration-[120ms]',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]',
        active
          ? rowActive
          : 'text-dim hover:text-ink hover:tint-hover',
      )}
      aria-current={!toggle && active ? 'page' : undefined}
      aria-pressed={toggle ? active : undefined}
      onClick={onClick}
    >
      {led !== undefined && <Led on={led} tone="connected" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className={active ? 'text-dim' : 'text-muted'}>{count}</span>}
    </button>
  );
}

/** The connected folder: its own reader of the folder, so a scan tick re-renders it alone, not the rail. */
function RailFolder() {
  return <FolderMenu folder={useFolderOptional()} place="rail" />;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className={groupLabel}>{label}</div>
      {children}
    </div>
  );
}

/**
 * The desktop rail: Library (with counts), Sources (where the programs come
 * from) and Tools, then the developer tools, About and the beta label at the
 * foot. Memoised, with memoised data props, so a list change that doesn't move a
 * count (a search keystroke, a scan tick) doesn't re-render it. The wordmark and the Nord's connection live in the TopBar above; at
 * phone width the rail gives way to PhoneTabs.
 */
export const Rail = memo(function Rail({ path, onNavigate, counts, sources, activeSource, onPickSource, hasFolder = false }: Props) {
  const tools = useTools();
  // An entry is active on its page and the pages beneath it (/library/programs/$id keeps programs lit).
  const isActive = (to: string) => isUnder(path, to);
  const onPrograms = isActive('/library/programs');

  return (
    <nav
      aria-label="Main"
      className={cn(
        // Plain class kept as a hook: `[data-native] .on-rail` in shell.css layers
        // Capacitor safe-area insets on top of the utilities below.
        'on-rail',
        'flex w-[196px] flex-none flex-col gap-[18px] box-border py-3.5 fill-sink border-r border-line',
        'sticky top-[var(--topbar-h)] h-[calc(100vh-var(--topbar-h))] self-start overflow-y-auto',
        'max-[720px]:hidden',
      )}
    >
      <Group label="Library">
        {READY_CATEGORIES.map((c) => (
          <Item
            key={c.id}
            label={c.label}
            count={counts[c.id]}
            active={isActive(c.path)}
            onClick={() => onNavigate(c.path)}
          />
        ))}
      </Group>

      {(sources.length > 0 || hasFolder) && (
        <Group label="Sources">
          {sources.map((s) => (
            <Item
              key={s.source}
              label={s.label}
              count={s.count}
              toggle
              led={s.live}
              active={onPrograms && activeSource === s.source}
              // Pressing the lit source again shows every source.
              // Off the program list, it also goes there; on it (or a program open
              // beside it) it only filters, so the open program stays.
              onClick={() => {
                onPickSource(onPrograms && activeSource === s.source ? 'all' : s.source);
                if (!onPrograms) onNavigate('/library/programs');
              }}
            />
          ))}
          {hasFolder && <RailFolder />}
        </Group>
      )}

      <Group label="Tools">
        {tools.map((d) => (
          <Fragment key={d.to}>
            <Item
              label={d.label}
              active={isActive(d.to)}
              onClick={() => onNavigate(d.to)}
            />
            {/* Community's own pages, while on it. */}
            {d.to === COMMUNITY_TO && isActive(COMMUNITY_TO) && COMMUNITY_SUB.map((sub) => (
              <Item key={sub.to} sub label={sub.label} active={path === sub.to} onClick={() => onNavigate(sub.to)} />
            ))}
          </Fragment>
        ))}
      </Group>

      <div className="flex-1" />

      <div className="flex flex-col">
        {__RE__ && (
          <details>
            <summary className="cursor-pointer px-4 py-1.5 font-mono text-[10px] text-muted lowercase">Developer</summary>
            {DEV_DESTS.map((d) => (
              <Item key={d.to} sub label={d.label} active={isActive(d.to)} onClick={() => onNavigate(d.to)} />
            ))}
          </details>
        )}
        <Item label={ABOUT.label} active={isActive(ABOUT.to)} onClick={() => onNavigate(ABOUT.to)} />
      </div>

      <div className="mx-4 border-t border-line pt-3">
        <BetaBadge withNote />
      </div>
    </nav>
  );
});
