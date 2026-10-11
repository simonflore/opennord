// src/routes/library.tsx
import { useEffect, useRef } from 'react';
import { createRoute, redirect, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibrarySplit } from '@/components/library/LibrarySplit';
import { useLibraryState } from '@/lib/library/LibraryContext';
import { SOURCE_LABEL, type LibrarySource } from '@/lib/library/types';

const isSource = (v: unknown): v is LibrarySource => typeof v === 'string' && v in SOURCE_LABEL;

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
  // `?source=nord`: the list shows one source's programs (a link or Back keeps it).
  validateSearch: (search: Record<string, unknown>): { source?: LibrarySource } =>
    (isSource(search.source) ? { source: search.source } : {}),
  component: ProgramsScreen,
});

function ProgramsScreen() {
  const { programId } = useParams({ from: ProgramsRoute.id });
  useSourceInUrl();
  return <LibrarySplit selectedId={programId} />;
}

/**
 * Keeps the program list's source filter (held in LibraryContext, which sits
 * above the router) and the URL's `?source=` in step. On arrival a source in
 * the URL wins (a shared link, Back); with none, a filter already set is
 * written into the URL. After that, whichever side changed leads: the URL
 * (Back/Forward, a link) sets the filter, and the filter (the rail's Sources,
 * the list's tabs) replaces the URL.
 */
function useSourceInUrl() {
  const { source: url } = useSearch({ from: ProgramsRoute.id });
  const { source, setSource } = useLibraryState();
  const navigate = useNavigate({ from: ProgramsRoute.fullPath });
  const seen = useRef<{ url: LibrarySource | 'all'; filter: LibrarySource | 'all' } | null>(null);
  useEffect(() => {
    const fromUrl = url ?? 'all';
    const last = seen.current;
    seen.current = { url: fromUrl, filter: source };
    if (last ? fromUrl !== last.url : url !== undefined) {
      if (fromUrl !== source) { seen.current.filter = fromUrl; setSource(fromUrl); }
    } else if (fromUrl !== source) {
      seen.current.url = source;
      void navigate({ search: source === 'all' ? {} : { source }, replace: true, resetScroll: false });
    }
  }, [url, source, setSource, navigate]);
}
