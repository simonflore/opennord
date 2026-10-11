import { useCallback, useEffect, useRef } from 'react';

/** One filter on a list: whether it's narrowing the list now, and how to switch it off. */
export interface ListFilter { active: boolean; reset: () => void }

/**
 * A list's filters, declared once: `filtered` is whether any is narrowing the
 * list, `clearFilters` switches them all off. Deriving both from one list keeps
 * them from drifting (a filter the clear button misses, or a "no matches" that
 * misreads as an empty library). `clearFilters` is stable across renders.
 */
export function useListFilters(filters: ListFilter[]): { filtered: boolean; clearFilters: () => void } {
  const latest = useRef(filters);
  useEffect(() => { latest.current = filters; });
  const clearFilters = useCallback(() => { for (const f of latest.current) f.reset(); }, []);
  return { filtered: filters.some((f) => f.active), clearFilters };
}
