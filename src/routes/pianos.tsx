import { createRoute, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { PianosSplit } from '@/components/piano/PianosSplit';

/**
 * The pianos list, with one piano open beside it when the path names one.
 * One route (an optional id), so moving between the list and a piano keeps the
 * same page mounted — its scroll and state survive.
 */
export const PianosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/pianos/{-$pianoId}',
  component: PianosScreen,
});

function PianosScreen() {
  const { pianoId } = useParams({ from: PianosRoute.id });
  return <PianosSplit selectedId={pianoId} />;
}
