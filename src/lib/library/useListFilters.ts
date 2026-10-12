import { useCallback, useEffect, useRef } from 'react';

/** One filter on a list: whether it's narrowing the list now, and how to switch it off. */
export interface ListFilter {
  active: boolean;
  /** Only calls a state setter, so the first render's reset stays valid. */
  reset: () => void;
}

/**
 * A list's filters, declared once: `filtered` is whether any is narrowing the
 * list, `clearFilters` switches them all off, and `ensureListed(id)` clears them
 * only when they hide entry `id` (so a list opened at that entry, a ⌘K jump,
 * shows its row). Deriving all three from one list keeps them from drifting (a
 * filter the clear button misses, or a "no matches" that misreads as an empty
 * library). Both functions are stable across renders.
 */
export function useListFilters(shown: { id: string }[], filters: ListFilter[]) {
  const resets = useRef(filters.map((f) => f.reset)).current;
  const clearFilters = useCallback(() => { for (const reset of resets) reset(); }, [resets]);
  const shownRef = useRef(shown);
  useEffect(() => { shownRef.current = shown; });
  const ensureListed = useCallback((id: string) => {
    if (!shownRef.current.some((e) => e.id === id)) clearFilters();
  }, [clearFilters]);
  return { filtered: filters.some((f) => f.active), clearFilters, ensureListed };
}
