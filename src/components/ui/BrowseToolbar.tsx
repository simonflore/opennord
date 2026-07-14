import { useState } from 'react';
import { SearchField } from './SearchField';
import { FilterChip } from './FilterChip';

export interface FacetOption { key: string; label: string }
export interface FacetGroup {
  /** Accessible name for this chip group, e.g. "Filter by source". */
  ariaLabel: string;
  value: string;
  options: FacetOption[];
  onChange: (key: string) => void;
}
export interface SortOption { key: string; label: string }

/** Facets longer than this collapse to a summary until expanded. */
const COLLAPSE_AT = 7;

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
      <div className="lib-facet" role="group" aria-label={group.ariaLabel}>
        {group.options.map(chip)}
        {collapsible && (
          <button type="button" className="on-chip on-chip--toggle" aria-expanded onClick={() => setOpen(false)}>Show less</button>
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
    <div className="lib-facet" role="group" aria-label={group.ariaLabel}>
      {shown.map(chip)}
      <button type="button" className="on-chip on-chip--toggle" aria-expanded={false} onClick={() => setOpen(true)}>
        + {hidden} more
      </button>
    </div>
  );
}

/**
 * Shared browse toolbar: a search field, one or more filter-chip groups, and a
 * sort select. Data-driven so the Library (one facet group) and Samples (two)
 * render the same control. Uses the existing `lib-controls` / `lib-sort` CSS.
 */
export function BrowseToolbar(
  { query, onQuery, placeholder, facets, sort, sortOptions, onSort, sortAriaLabel }: {
    query: string; onQuery: (q: string) => void; placeholder: string;
    facets: FacetGroup[];
    sort: string; sortOptions: SortOption[]; onSort: (key: string) => void; sortAriaLabel: string;
  },
) {
  return (
    <div className="lib-controls">
      <SearchField value={query} onChange={onQuery} placeholder={placeholder} />
      {facets.map((g) => <FacetChips key={g.ariaLabel} group={g} />)}
      <select className="lib-sort" value={sort} aria-label={sortAriaLabel} onChange={(e) => onSort(e.target.value)}>
        {sortOptions.map((o) => (
          <option key={o.key} value={o.key}>Sort: {o.label}</option>
        ))}
      </select>
    </div>
  );
}
