import { useCallback, useRef } from 'react';

/** One filter on a list: whether it's narrowing the list now, and how to switch it off. */
export interface ListFilter {
  active: boolean;
  /** Only calls a state setter, so the first render's reset stays valid. */
  reset: () => void;
}

/**
 * A list's filters, declared once: `filtered` is whether any is narrowing the
 * list, `clearFilters` switches them all off. Deriving both from one list keeps
 * them from drifting (a filter the clear button misses, or a "no matches" that
 * misreads as an empty library). `clearFilters` is stable across renders.
 */
export function useListFilters(filters: ListFilter[]): { filtered: boolean; clearFilters: () => void } {
  const resets = useRef(filters.map((f) => f.reset)).current;
  const clearFilters = useCallback(() => { for (const reset of resets) reset(); }, [resets]);
  return { filtered: filters.some((f) => f.active), clearFilters };
}
