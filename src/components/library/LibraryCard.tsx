import type { ReactNode } from 'react';
import { Card, SourceBadge, type LibrarySource } from '../ui';

/**
 * Shared entry card for every Library category (Programs, Presets, User
 * Samples, Piano Samples). Each of those hand-rolled the same `lib-patch`
 * card — a `Card` wrapper made keyboard-activatable, a favorite star, the
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
      className="lib-patch"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen(); } }}
    >
      <div className="lib-patch__top">
        {select && (
          <input
            type="checkbox"
            className="lib-patch__select"
            aria-label={`Select ${name}`}
            checked={select.checked}
            onChange={select.onToggle}
            onClick={(ev) => ev.stopPropagation()}
          />
        )}
        <button
          className={`lib-fav${favorite ? ' is-fav' : ''}`}
          aria-label={favorite ? `Unfavorite ${name}` : `Favorite ${name}`}
          aria-pressed={favorite}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(ev) => { ev.stopPropagation(); onToggleFavorite(); }}
          onKeyDown={(ev) => ev.stopPropagation()}
        >{favorite ? '★' : '☆'}</button>
        <span className="lib-patch__nm">{name}</span>
        {unused && <span className="lib-tag lib-tag--unused" title="Not used by any program">unused</span>}
        {badge}
      </div>
      {engines}
      <div className="lib-patch__foot">
        <SourceBadge source={source} />
        {footExtras}
      </div>
    </Card>
  );
}
