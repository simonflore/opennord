import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { SamplesSplit } from '@/components/sample/SamplesSplit';

export const SamplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/samples',
  component: () => <SamplesSplit />,
});
