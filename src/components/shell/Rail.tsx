import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { LIBRARY_CATEGORIES, type CategoryId } from '../../lib/library/categories';
import type { LibrarySource } from '../../lib/library/types';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { BUILD, COMMIT, VERSION_FULL } from '../../lib/version';
import { CLOUD_TO, COMMUNITY_SUB, COMMUNITY_TO, DEVICE_DISABLED_HINT, DEV_DESTS, RE_DESTS, TOOLS, usbSupported, type NavTo } from './nav';
export type { NavTo } from './nav';

/** One program source in the Sources group: where the programs in the library come from. */
export interface SourceItem {
  source: LibrarySource;
  label: string;
  count: number;
  /** Lights the LED: the source is live (the Nord is connected). */
  live?: boolean;
}

interface Props {
  /** Current pathname without its leading slash (e.g. "library", "library/abc", "dev/inspect"). */
  active: string;
  onNavigate: (to: NavTo) => void;
  /** How many entries each library category holds. */
  counts?: Partial<Record<CategoryId, number>>;
  /** Program sources with entries; picking one filters the program list to it. */
  sources?: SourceItem[];
  /** The source the program list is filtered to, if any. */
  activeSource?: LibrarySource | 'all';
  /** Filter the program list to a source, or back to everything with 'all'. */
  onPickSource?: (source: LibrarySource | 'all') => void;
}

/**
 * A rail entry, set like the B×A console: lowercase mono, the count right-
 * aligned, and the active entry raised with the accent bar on its left edge.
 */
function Item({ label, active, onClick, count, led, disabled, title, sub }: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  /** Show an LED before the label; true lights it (only "connected" does). */
  led?: boolean;
  disabled?: boolean;
  title?: string;
  sub?: boolean;
}) {
  return (
    <button
      className={cn(
        'relative flex w-full items-center gap-2 border-0 bg-transparent py-1.5 pr-4 text-left font-mono text-xs',
        sub ? 'pl-7 text-[11px]' : 'pl-4',
        'cursor-pointer transition-colors duration-[120ms]',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'fill-raised text-ink shadow-[inset_3px_0_0_var(--accent)]'
          : 'text-dim hover:text-ink hover:[background:color-mix(in_srgb,var(--lift)_3%,transparent)]',
      )}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {led !== undefined && (
        <span
          className={cn('h-1.5 w-1.5 flex-none rounded-full', led ? 'bg-connected shadow-[0_0_6px_var(--connected)]' : 'bg-line')}
          aria-hidden="true"
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className={active ? 'text-dim' : 'text-muted'}>{count}</span>}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      {children}
    </div>
  );
}

/**
 * The desktop rail: Library (with counts), Sources (where the programs come
 * from) and Tools, then the developer tools, About and the beta label at the
 * foot. The wordmark and the Nord's connection live in the TopBar above; at
 * phone width the rail gives way to PhoneTabs.
 */
export function Rail({ active, onNavigate, counts = {}, sources = [], activeSource = 'all', onPickSource }: Props) {
  const caps = useCapabilities();
  const path = '/' + active;
  // An entry is active when the path equals it or sits beneath it (e.g.
  // /library/programs/$id keeps programs lit).
  const isActive = (to: string) => path === to || path.startsWith(to + '/');
  const onPrograms = isActive('/library/programs');

  return (
    <nav
      aria-label="Main"
      className={cn(
        // Plain class kept as a hook: `[data-native] .on-rail` in shell.css layers
        // Capacitor safe-area insets on top of the utilities below.
        'on-rail',
        'flex w-[196px] flex-none flex-col gap-[18px] box-border py-3.5 fill-sink border-r border-line',
        'sticky top-11 h-[calc(100vh-44px)] self-start overflow-y-auto',
        'max-[720px]:hidden',
      )}
    >
      <Group label="Library">
        {LIBRARY_CATEGORIES.map((c) => (
          <Item
            key={c.id}
            label={c.label.toLowerCase()}
            count={counts[c.id]}
            // A source filter moves the highlight to Sources.
            active={isActive(c.path) && !(c.id === 'programs' && activeSource !== 'all')}
            disabled={!c.ready}
            title={c.ready ? undefined : 'Coming soon'}
            onClick={() => { if (c.id === 'programs') onPickSource?.('all'); if (c.ready) onNavigate(c.path); }}
          />
        ))}
      </Group>

      {sources.length > 0 && (
        <Group label="Sources">
          {sources.map((s) => (
            <Item
              key={s.source}
              label={s.label}
              count={s.count}
              led={!!s.live}
              active={onPrograms && activeSource === s.source}
              onClick={() => { onPickSource?.(s.source); onNavigate('/library/programs'); }}
            />
          ))}
        </Group>
      )}

      <Group label="Tools">
        {TOOLS.map((d) => {
          const disabled = d.to === '/device' && !usbSupported;
          return (
            <Item
              key={d.to}
              label={d.label.toLowerCase()}
              active={isActive(d.to)}
              disabled={disabled}
              title={disabled ? DEVICE_DISABLED_HINT : undefined}
              onClick={() => onNavigate(d.to)}
            />
          );
        })}
        {/* Cloud and Community are build-injected: the open client never shows a dead link. */}
        {caps.cloud.available && <Item label="cloud" active={isActive(CLOUD_TO)} onClick={() => onNavigate(CLOUD_TO)} />}
        {caps.community.available && (
          <>
            <Item label="community" active={isActive(COMMUNITY_TO)} onClick={() => onNavigate(COMMUNITY_TO)} />
            {isActive(COMMUNITY_TO) && COMMUNITY_SUB.map((d) => (
              <Item key={d.to} sub label={d.label.toLowerCase()} active={path === d.to} onClick={() => onNavigate(d.to)} />
            ))}
          </>
        )}
        {__RE__ && RE_DESTS.map((d) => (
          <Item key={d.to} label={d.label.toLowerCase()} active={isActive(d.to)} onClick={() => onNavigate(d.to)} />
        ))}
      </Group>

      <div className="flex-1" />

      <div className="flex flex-col">
        {__RE__ && (
          <details>
            <summary className="cursor-pointer px-4 py-1.5 font-mono text-[10px] text-muted">developer</summary>
            {DEV_DESTS.map((d) => (
              <Item key={d.to} sub label={d.label.toLowerCase()} active={isActive(d.to)} onClick={() => onNavigate(d.to)} />
            ))}
          </details>
        )}
        <Item label="about & legal" active={isActive('/about')} onClick={() => onNavigate('/about')} />
      </div>

      <div
        className="mx-4 flex flex-col gap-[3px] border-t border-line pt-3"
        title={`${VERSION_FULL}. OpenNord is beta software, provided as-is with no warranty. Features may break, and device transfer writes to real hardware — back up your keyboard first. Use at your own risk.`}
      >
        <span className="flex items-center gap-1.5">
          <span className="rounded-sm border border-warn px-[5px] py-px text-[8px] font-bold tracking-[1px] text-warn">
            BETA
          </span>
          <span className="font-mono text-[10px] text-dim" aria-label={`build ${BUILD ?? COMMIT ?? 'dev'}`}>
            {BUILD ?? COMMIT ?? 'dev'}
          </span>
        </span>
        <span className="text-[9px] leading-[1.4] text-muted">use at your own risk</span>
      </div>
    </nav>
  );
}
