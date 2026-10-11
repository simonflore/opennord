import type { ReactNode } from 'react';
import { SourceBadge, type LibrarySource } from '../ui';
import { cn } from '@/lib/cn';

/**
 * Shared entry row for every Library category (Programs, Presets, User
 * Samples, Piano Samples): a keyboard-activatable row with a favourite star,
 * the name, an optional "unused" tag and reclaim checkbox, and a second line
 * with the source badge. Owning it here keeps the a11y details identical by
 * construction (each category once hand-rolled its own and they drifted); a
 * category supplies only what differs: the `badge`, `engines`, `strip` and
 * `footExtras`.
 */
export function LibraryCard({
  name, source, favorite, onToggleFavorite, onOpen,
  badge, unused, select, engines, footExtras, strip, selected,
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
  /** A small glance beside the engines — the program's keyboard-zone strip. */
  strip?: ReactNode;
  /** This entry is the one open in the detail pane. */
  selected?: boolean;
}) {
  return (
    // A dense two-line row (B×A: data stays flat): favourite + name + badge on
    // top, engines / zone strip / source underneath. The open entry carries the
    // accent bar, like the selected row in a table.
    <div
      className={cn(
        'group relative grid cursor-pointer select-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1.5 gap-y-1',
        'border-b border-line py-2 pr-3 pl-1',
        'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:bg-surface-2 focus-visible:bg-surface-2',
        selected && "bg-surface-2 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-accent before:content-['']",
      )}
      role="button"
      tabIndex={0}
      aria-current={selected ? 'true' : undefined}
      onClick={onOpen}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen(); } }}
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
          onClick={(ev) => { ev.stopPropagation(); onToggleFavorite(); }}
          onKeyDown={(ev) => ev.stopPropagation()}
        >{favorite ? '★' : '☆'}</button>
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
        {strip}
        <span className="ml-auto flex flex-none items-center gap-2 font-mono text-[11px] text-dim">
          <SourceBadge source={source} />
          {footExtras}
        </span>
      </div>
    </div>
  );
}
