import { useCallback, useEffect, useRef } from 'react';

/**
 * `ensureListed(id)`: clear a list's filters when they hide entry `id`, so a
 * list opened at that entry (a ⌘K jump) shows its row. Reads the shown list
 * through a ref so the returned function stays stable across renders.
 */
export function useEnsureListed(shown: { id: string }[], clearFilters: () => void): (id: string) => void {
  const shownRef = useRef(shown);
  useEffect(() => { shownRef.current = shown; });
  return useCallback((id: string) => {
    if (!shownRef.current.some((e) => e.id === id)) clearFilters();
  }, [clearFilters]);
}
