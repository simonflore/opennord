import type { ReactNode } from 'react';
import { Card, SourceBadge, type LibrarySource } from '../ui';
import { cn } from '@/lib/cn';

/**
 * Shared entry card for every Library category (Programs, Presets, User
 * Samples, Piano Samples). Each of those hand-rolled the same entry-card
 * skeleton — a `Card` wrapper made keyboard-activatable, a favorite star, the
 * name, an optional "unused" tag, an optional reclaim checkbox, and a foot
 * with the source badge — which let the a11y details drift (some cards missed
 * `onKeyDown`, the star's aria-label wording varied). This owns that skeleton
 * so it's identical by construction; a category supplies only what actually
 * differs: the top-right `badge`, the `engines` row, and any `footExtras`.
 */
export function LibraryCard({
  name, source, favorite, onToggleFavorite, onOpen,
  badge, unused, select, engines, footExtras,
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
  /** Engine/summary row between the name and the foot. */
  engines?: ReactNode;
  /** Foot content after the source badge (size, factory pill, remove…). */
  footExtras?: ReactNode;
}) {
  return (
    <Card
      accent={source === 'nord'}
      className={cn(
        'group cursor-pointer select-none',
        'transition-[transform,box-shadow,border-color] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
        'hover:-translate-y-0.5 hover:border-muted hover:elev-3',
        'focus-visible:-translate-y-0.5',
      )}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen(); } }}
    >
      <div className="flex items-baseline justify-between gap-2">
        {select && (
          <input
            type="checkbox"
            className="mr-2 flex-none"
            aria-label={`Select ${name}`}
            checked={select.checked}
            onChange={select.onToggle}
            onClick={(ev) => ev.stopPropagation()}
          />
        )}
        <button
          className={cn(
            '-my-2 inline-flex min-h-11 min-w-11 flex-none items-center justify-center text-base leading-none opacity-0',
            'transition-[opacity,color] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
            'group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
            'hover:text-red-bright',
            favorite ? 'text-red opacity-100' : 'text-muted',
          )}
          aria-label={favorite ? `Unfavorite ${name}` : `Favorite ${name}`}
          aria-pressed={favorite}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(ev) => { ev.stopPropagation(); onToggleFavorite(); }}
          onKeyDown={(ev) => ev.stopPropagation()}
        >{favorite ? '★' : '☆'}</button>
        <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">{name}</span>
        {unused && (
          <span
            className="shrink-0 rounded px-[5px] py-[3px] text-[9px]/none font-semibold uppercase tracking-[0.04em] text-warn shadow-[inset_0_0_0_1px_var(--warn)]"
            title="Not used by any program"
          >
            unused
          </span>
        )}
        {badge}
      </div>
      {engines}
      <div className="mt-[11px] flex items-center justify-between gap-2">
        <SourceBadge source={source} />
        {footExtras}
      </div>
    </Card>
  );
}
