import type { ReactNode } from 'react';
import { SourceBadge, type LibrarySource } from '../ui';
import { cn } from '@/lib/cn';

/**
 * The clickable shell every Library row shares: Enter/Space and a click open the
 * entry, the open one is marked (`aria-current`, `data-open-row` for the list's
 * reveal) and carries the accent bar on its left edge. Owning it once keeps the
 * a11y details identical by construction (each category once hand-rolled its
 * own and they drifted); a row supplies only its layout (`className`) and cells.
 */
export function LibraryRow({ className, selected, onOpen, label, children }: {
  className: string;
  selected?: boolean;
  onOpen: () => void;
  /** The row's accessible name (its entry's name). */
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'group relative cursor-pointer select-none border-b border-line',
        'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:bg-surface-2 focus-visible:bg-surface-2',
        selected && "bg-surface-2 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-accent before:content-['']",
        className,
      )}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-current={selected ? 'true' : undefined}
      data-open-row={selected || undefined}
      onClick={onOpen}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen(); } }}
    >
      {children}
    </div>
  );
}

/** A row's favourite star: shown on hover (always on touch, and when set), a thumb-sized target. */
export function FavoriteStar({ name, favorite, onToggle }: { name: string; favorite: boolean; onToggle: () => void }) {
  return (
    <button
      className={cn(
        '-my-3 inline-flex min-h-11 min-w-9 flex-none items-center justify-center text-[15px] leading-none opacity-0',
        'transition-[opacity,color] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
        'group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
        'hover:text-accent-bright',
        favorite ? 'text-accent opacity-100' : 'text-muted',
      )}
      aria-label={favorite ? `Unfavorite ${name}` : `Favorite ${name}`}
      aria-pressed={favorite}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(ev) => { ev.stopPropagation(); onToggle(); }}
      onKeyDown={(ev) => ev.stopPropagation()}
    >{favorite ? '★' : '☆'}</button>
  );
}

/**
 * The entry row for Presets, User Samples and Piano Samples (Programs have
 * their own table, ProgramTable): a dense two-line row with a favourite star,
 * the name, an optional "unused" tag and reclaim checkbox, and a second line
 * with the source badge. A category supplies only what differs: the `badge`,
 * `engines` and `footExtras`.
 */
export function LibraryCard({
  name, source, favorite, onToggleFavorite, onOpen,
  badge, unused, select, engines, footExtras, selected,
}: {
  name: string;
  source: LibrarySource;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
  /** Slot / type badge shown top-right (e.g. "A:14", "Organ", ".nsmp4"). */
  badge?: ReactNode;
  /** Marks the entry unused (not referenced by any program). */
  unused?: boolean;
  /** Reclaim-flow selection checkbox; omit when the card isn't selectable. */
  select?: { checked: boolean; onToggle: () => void };
  /** Engine/summary tags on the row's second line. */
  engines?: ReactNode;
  /** Second-line content after the source (size, factory pill, remove…). */
  footExtras?: ReactNode;
  /** This entry is the one open in the detail pane. */
  selected?: boolean;
}) {
  return (
    // A dense two-line row (B×A: data stays flat): favourite + name + badge on
    // top, engines / source underneath.
    <LibraryRow
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1.5 gap-y-1 py-2 pr-3 pl-1"
      selected={selected}
      onOpen={onOpen}
    >
      <div className="flex items-center">
        {select && (
          <input
            type="checkbox"
            className="ml-2 mr-1 flex-none"
            aria-label={`Select ${name}`}
            checked={select.checked}
            onChange={select.onToggle}
            onClick={(ev) => ev.stopPropagation()}
          />
        )}
        <FavoriteStar name={name} favorite={favorite} onToggle={onToggleFavorite} />
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate text-[14px] font-semibold text-ink">{name}</span>
        {unused && (
          <span
            className="shrink-0 rounded-sm px-[5px] py-[3px] text-[9px]/none font-semibold uppercase tracking-[0.04em] text-warn shadow-[inset_0_0_0_1px_var(--warn)]"
            title="Not used by any program"
          >
            unused
          </span>
        )}
      </div>
      <div className="font-mono">{badge}</div>
      <div className="col-span-2 col-start-2 flex min-w-0 items-center gap-3">
        <div className="min-w-0 overflow-hidden">{engines}</div>
        <span className="ml-auto flex flex-none items-center gap-2 font-mono text-[11px] text-dim">
          <SourceBadge source={source} />
          {footExtras}
        </span>
      </div>
    </LibraryRow>
  );
}
