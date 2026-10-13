import { useCallback, useMemo } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { isUnder, trimSlash } from '../../lib/library/categories';
import type { LibraryEntry } from '../../lib/library/types';
import { memberIds, type Mergeable } from '../../lib/library/found-on';
import { useStableCallback } from '../../lib/useStableCallback';
import type { NavTo } from '../shell/nav';


// Here rather than beside the router's Register: the pro build compiles these
// components against its own router.
declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Opened from its list, so the narrow back button can step back to it (see useBackToList). */
    fromList?: boolean;
  }
}

/**
 * Open library entries on their routes. The lists' rows and the ⌘K palette
 * share these. How depends on where the app is: from the entry's list, push
 * and remember that (Back then steps back to the list, see useBackToList); from
 * another entry of the same list, replace it, so history holds one entry per
 * visit and Back still knows where it came from; from anywhere else, push.
 */
export function useOpenEntry() {
  const navigate = useNavigate();
  const router = useRouter();
  return useMemo(() => {
    const how = (list: string) => {
      const { pathname: raw, state } = router.state.location;
      const pathname = trimSlash(raw);
      if (pathname === list) return { replace: false, state: { fromList: true } };
      if (isUnder(pathname, list)) return { replace: true, state: { fromList: !!state.fromList } };
      return { replace: false, state: { fromList: false } };
    };
    return {
      // `search: true` keeps the list's ?source= filter as the program opens.
      program: (e: LibraryEntry) => navigate({ to: '/library/programs/{-$programId}', params: { programId: e.id }, search: true, ...how('/library/programs') }),
      preset: (id: string) => navigate({ to: '/library/presets/{-$presetId}', params: { presetId: id }, ...how('/library/presets') }),
      sample: (id: string) => navigate({ to: '/library/samples/{-$sampleId}', params: { sampleId: id }, ...how('/library/samples') }),
      piano: (id: string) => navigate({ to: '/library/pianos/{-$pianoId}', params: { pianoId: id }, ...how('/library/pianos') }),
    };
  }, [navigate, router]);
}

/**
 * Leave the open entry for its `list`: a step back in history when it was
 * opened from that list, so the system Back doesn't reopen it and the list
 * isn't in history twice; otherwise (a deep link, a ⌘K jump from elsewhere)
 * its history entry is replaced by the list, for the same reason. Reads the
 * route when called; does nothing unless an entry of `list` is open.
 */
export function useLeaveEntry(list: NavTo): () => void {
  const navigate = useNavigate();
  const router = useRouter();
  return useCallback(() => {
    const { pathname, state } = router.state.location;
    const path = trimSlash(pathname);
    if (path === list || !isUnder(path, list)) return;
    if (state.fromList) router.history.back();
    // The program list keeps its ?source= filter (not the open program's full
    // view); the other lists have no search.
    else void navigate({ to: list, replace: true, search: list === '/library/programs' ? (prev: Record<string, unknown>) => ({ ...prev, view: undefined }) : {} });
  }, [navigate, router, list]);
}

/**
 * After an entry is removed: leave it (useLeaveEntry) if it's the one open now,
 * read from the route's params when called, so a removal that finishes after
 * the user moved on closes nothing else.
 */
export function useCloseRemoved(list: NavTo): (id: string) => void {
  const router = useRouter();
  const leave = useLeaveEntry(list);
  return useCallback((id: string) => {
    const params: Record<string, unknown> = router.state.matches.at(-1)?.params ?? {};
    if (Object.values(params).includes(id)) leave();
  }, [router, leave]);
}

/**
 * Remove an imported copy from `list`. When the sound is found elsewhere too
 * its row stays, and stays open (through another of its entries, via `reopen`)
 * if it was open through this one; otherwise the open entry closes as
 * useCloseRemoved does. The callback keeps its identity (the rows change with
 * every hash and fetch), so memoised list rows don't re-render for it.
 */
export function useRemoveCopy(
  list: NavTo, remove: (id: string) => Promise<void>, entryById: (id: string) => Mergeable | undefined, reopen: (id: string) => void,
): (id: string) => void {
  const router = useRouter();
  const closeRemoved = useCloseRemoved(list);
  return useStableCallback((id: string) => {
    const row = entryById(id);
    const stays = row && memberIds(row).find((m) => m !== id);
    void remove(id).then(() => {
      if (!stays) return closeRemoved(id);
      const params: Record<string, unknown> = router.state.matches.at(-1)?.params ?? {};
      if (Object.values(params).includes(id)) reopen(stays);
    });
  });
}
