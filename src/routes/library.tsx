import { createRoute, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibrarySplit } from '@/components/library/LibrarySplit';

export const LibraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: () => <LibrarySplit />,
});

export const ProgramRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/$programId',
  component: ProgramScreen,
});

function ProgramScreen() {
  const { programId } = useParams({ from: '/library/$programId' });
  return <LibrarySplit selectedId={programId} />;
}
