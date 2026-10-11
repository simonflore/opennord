// src/routes/library.tsx
import { createRoute, redirect, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibrarySplit } from '@/components/library/LibrarySplit';

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
  component: ProgramsScreen,
});

function ProgramsScreen() {
  const { programId } = useParams({ from: ProgramsRoute.id });
  return <LibrarySplit selectedId={programId} />;
}
