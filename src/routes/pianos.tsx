import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { PianosSplit } from '@/components/piano/PianosSplit';

export const PianosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/pianos',
  component: () => <PianosSplit />,
});
