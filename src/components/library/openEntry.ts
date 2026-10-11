import { useMemo } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { isUnder, trimSlash } from '../../lib/library/categories';
import type { LibraryEntry } from '../../lib/library/types';
import type { NavTo } from '../shell/nav';

type Navigate = ReturnType<typeof useNavigate>;

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
 * A program that hasn't been read (a Nord slot) opens the Device page instead.
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
      program: (e: LibraryEntry) => (e.program
        ? navigate({ to: '/library/programs/{-$programId}', params: { programId: e.id }, ...how('/library/programs') })
        : navigate({ to: '/device' })),
      preset: (id: string) => navigate({ to: '/library/presets/{-$presetId}', params: { presetId: id }, ...how('/library/presets') }),
      sample: (id: string) => navigate({ to: '/library/samples/{-$sampleId}', params: { sampleId: id }, ...how('/library/samples') }),
      piano: (id: string) => navigate({ to: '/library/pianos/{-$pianoId}', params: { pianoId: id }, ...how('/library/pianos') }),
    };
  }, [navigate, router]);
}

/**
 * After removing entries: back to the bare `list` if the open one was among
 * them, replacing its route so Back doesn't return to an entry that's gone.
 */
export function closeRemoved(navigate: Navigate, list: NavTo, openId: string | undefined, removed: Iterable<string>) {
  if (openId && [...removed].includes(openId)) void navigate({ to: list, replace: true });
}
