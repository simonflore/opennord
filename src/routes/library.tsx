// src/routes/library.tsx
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createRoute, redirect, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibrarySplit } from '@/components/library/LibrarySplit';
import { useLibraryData } from '@/lib/library/LibraryContext';
import { SOURCE_LABEL, type LibrarySource } from '@/lib/library/types';

type ProgramsSearch = { source?: LibrarySource; view?: 'full' };

const isSource = (v: unknown): v is LibrarySource => typeof v === 'string' && Object.hasOwn(SOURCE_LABEL, v);

// `/library` is a hub — send it to the default category.
export const LibraryIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  beforeLoad: () => { throw redirect({ to: '/library/programs/{-$programId}' }); },
});

/**
 * The program list, with one program open beside it when the path names one.
 * One route (an optional id), so moving between the list and a program keeps
 * the same page mounted — its scroll and state survive.
 */
export const ProgramsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/programs/{-$programId}',
  // `?source=nord`: the list shows one source's programs (see useSourceInUrl).
  // `?view=full`: the open program across the whole width, the list hidden.
  validateSearch: (search: Record<string, unknown>): ProgramsSearch => ({
    ...(isSource(search.source) ? { source: search.source } : {}),
    ...(search.view === 'full' ? { view: 'full' as const } : {}),
  }),
  component: ProgramsScreen,
});

function ProgramsScreen() {
  const { programId } = useParams({ from: ProgramsRoute.id });
  const { view } = useSearch({ from: ProgramsRoute.id });
  const navigate = useNavigate({ from: ProgramsRoute.fullPath });
  useSourceInUrl();
  // In place, not a new history entry: Back still leaves the program, as before.
  // `state: true` keeps the entry's fromList (useOpenEntry), which a navigate
  // without it would reset, and leaving the program would then stack the list.
  const onFull = useCallback((on: boolean) => {
    void navigate({ search: (prev: ProgramsSearch) => ({ ...prev, view: on ? 'full' as const : undefined }), replace: true, resetScroll: false, state: true });
  }, [navigate]);
  return <LibrarySplit selectedId={programId} full={view === 'full'} onFull={onFull} />;
}

/**
 * The program list's source filter (held in LibraryContext, above the router)
 * shown in the URL as `?source=`. The filter is the one owner: a source in the
 * URL on arrival (a shared link, a reload) is applied once, before the list
 * paints; after that the URL only mirrors the filter, replaced in place, so Back
 * and plain links to the list keep the filter you set.
 */
function useSourceInUrl() {
  const { source: url } = useSearch({ from: ProgramsRoute.id });
  const { source, setSource } = useLibraryData();
  const navigate = useNavigate({ from: ProgramsRoute.fullPath });
  // On arrival the URL's source is handed to the filter; the mirror skips the
  // render that still has the old filter, or it would write that one back.
  const arrival = useRef<{ done: boolean; applying?: LibrarySource }>({ done: false });
  useLayoutEffect(() => {
    if (arrival.current.done) return;
    arrival.current = { done: true, applying: url && url !== source ? url : undefined };
    if (arrival.current.applying) setSource(arrival.current.applying);
  }, [url, source, setSource]);
  useEffect(() => {
    const { applying } = arrival.current;
    if (applying) {
      arrival.current.applying = undefined; // wait one render at most, even if the filter moved on meanwhile
      if (source !== applying) return;
    }
    if ((url ?? 'all') === source) return;
    void navigate({ search: (prev: ProgramsSearch) => ({ ...prev, source: source === 'all' ? undefined : source }), replace: true, resetScroll: false, state: true });
  }, [url, source, navigate]);
}
