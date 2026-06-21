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
      {facets.map((g) => (
        <div className="lib-facet" role="group" aria-label={g.ariaLabel} key={g.ariaLabel}>
          {g.options.map((o) => (
            <FilterChip key={o.key} active={g.value === o.key} onClick={() => g.onChange(o.key)}>{o.label}</FilterChip>
          ))}
        </div>
      ))}
      <select className="lib-sort" value={sort} aria-label={sortAriaLabel} onChange={(e) => onSort(e.target.value)}>
        {sortOptions.map((o) => (
          <option key={o.key} value={o.key}>Sort: {o.label}</option>
        ))}
      </select>
    </div>
  );
}
