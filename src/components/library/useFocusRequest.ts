import { useEffect } from 'react';

interface FocusableList<E extends { id: string }> {
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  shown: E[];
  clearFilters: () => void;
  entryById: (id: string) => E | undefined;
}

/**
 * Open the entry the ⌘K palette asked for (the list context's `focusId`) once
 * its page is showing: clear the list's filters if they would hide it, open it,
 * and drop the request.
 */
export function useFocusRequest<E extends { id: string }>(list: FocusableList<E>, open: (e: E) => void) {
  const { focusId, setFocusId, shown, clearFilters, entryById } = list;
  useEffect(() => {
    if (!focusId) return;
    const e = entryById(focusId);
    if (e) {
      if (!shown.some((x) => x.id === focusId)) clearFilters();
      open(e);
    }
    setFocusId(null);
  }, [focusId, setFocusId, shown, clearFilters, entryById, open]);
}
