// src/routes/library.tsx
import { createRoute, redirect, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibrarySplit } from '@/components/library/LibrarySplit';

// `/library` is a hub — send it to the default category.
export const LibraryIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  beforeLoad: () => { throw redirect({ to: '/library/programs' }); },
});

export const ProgramsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/programs',
  component: () => <LibrarySplit />,
});

export const ProgramRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/programs/$programId',
  component: ProgramScreen,
});

function ProgramScreen() {
  const { programId } = useParams({ from: '/library/programs/$programId' });
  return <LibrarySplit selectedId={programId} />;
}
