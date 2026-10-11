import { createRoute, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { PianosSplit } from '@/components/piano/PianosSplit';

export const PianosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/pianos',
  component: () => <PianosSplit />,
});

/** One piano open beside the list (or full-screen on a phone). */
export const PianoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/pianos/$pianoId',
  component: PianoScreen,
});

function PianoScreen() {
  const { pianoId } = useParams({ from: '/library/pianos/$pianoId' });
  return <PianosSplit selectedId={pianoId} />;
}
