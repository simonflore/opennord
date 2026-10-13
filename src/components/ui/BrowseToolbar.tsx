import { useState } from 'react';
import { cn } from '@/lib/cn';
import { SearchField } from './SearchField';
import { FilterChip } from './FilterChip';

/** The look of a native `<select>` across the app. */
export const selectClass = cn(
  'cursor-pointer rounded-sm border border-line px-[10px] py-1.5 text-xs text-ink fill-raised elev-1',
  'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
  'hover:border-muted',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
);

export interface FacetOption { key: string; label: string }
export interface FacetGroup {
  /** Accessible name for this chip group, e.g. "Filter by source". */
  ariaLabel: string;
  value: string;
  options: FacetOption[];
  onChange: (key: string) => void;
  /** Show as a dropdown rather than chips (a format, where the options are file
   *  types); the first option ("All") reads as `allLabel` there. */
  select?: { allLabel: string };
}
export interface SortOption { key: string; label: string }

/** Facets longer than this collapse to a summary until expanded. */
const COLLAPSE_AT = 7;

/** Dashed, chromeless chip for the expand/collapse affordance — reads as an
 * action, not a selectable filter value, so it can't be mistaken for a chip. */
const toggleChip = cn(
  'cursor-pointer select-none rounded-full border border-dashed border-line px-[11px] py-1 text-[10px] font-semibold text-muted',
  'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
  'hover:border-muted hover:text-ink',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
);

/**
 * One filter-chip group. Short facets (source, format) render every chip. Long
 * ones (the sample category facet can carry 20+ labels) collapse by default to
 * just the "All" reset + the active selection + a "＋N more" toggle, so the
 * toolbar stays calm; expanding reveals the full set with a "Show less".
 */
function FacetChips({ group }: { group: FacetGroup }) {
  const [open, setOpen] = useState(false);
  const collapsible = group.options.length > COLLAPSE_AT;
  const chip = (o: FacetOption) => (
    <FilterChip key={o.key} active={group.value === o.key} onClick={() => group.onChange(o.key)}>{o.label}</FilterChip>
  );

  if (!collapsible || open) {
    return (
      <div className="contents" role="group" aria-label={group.ariaLabel}>
        {group.options.map(chip)}
        {collapsible && (
          <button type="button" className={toggleChip} aria-expanded onClick={() => setOpen(false)}>Show less</button>
        )}
      </div>
    );
  }

  // Collapsed: always show the "All" reset (options[0] by convention) and the
  // active selection when it isn't "All", then a toggle for the rest.
  const all = group.options[0];
  const active = group.options.find((o) => o.key === group.value);
  const shown = active && active.key !== all.key ? [all, active] : [all];
  const hidden = group.options.length - shown.length;
  return (
    <div className="contents" role="group" aria-label={group.ariaLabel}>
      {shown.map(chip)}
      <button type="button" className={toggleChip} aria-expanded={false} onClick={() => setOpen(true)}>
        + {hidden} more
      </button>
    </div>
  );
}

/** A facet as a dropdown: one compact control however many file types there are. */
function FacetSelect({ group }: { group: FacetGroup }) {
  return (
    <select
      className={selectClass}
      value={group.value}
      aria-label={group.ariaLabel}
      onChange={(e) => group.onChange(e.target.value)}
    >
      {group.options.map((o, i) => (
        <option key={o.key} value={o.key}>{i === 0 && group.select ? group.select.allLabel : o.label}</option>
      ))}
    </select>
  );
}

/**
 * Shared browse toolbar: a search field, one or more filter-chip groups, and a
 * sort select. Data-driven so the Library (one facet group) and Samples (two)
 * render the same control.
 */
export function BrowseToolbar(
  { query, onQuery, placeholder, facets, sort, sortOptions, onSort, sortAriaLabel }: {
    query: string; onQuery: (q: string) => void; placeholder: string;
    facets: FacetGroup[];
    sort: string; sortOptions: SortOption[]; onSort: (key: string) => void; sortAriaLabel: string;
  },
) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <SearchField value={query} onChange={onQuery} placeholder={placeholder} />
      {facets.map((g) => (g.select ? <FacetSelect key={g.ariaLabel} group={g} /> : <FacetChips key={g.ariaLabel} group={g} />))}
      <select
        className={cn('ml-auto', selectClass)}
        value={sort}
        aria-label={sortAriaLabel}
        onChange={(e) => onSort(e.target.value)}
      >
        {sortOptions.map((o) => (
          <option key={o.key} value={o.key}>Sort: {o.label}</option>
        ))}
      </select>
    </div>
  );
}
