// src/routes/samples.tsx
import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { SamplesSplit } from '@/components/sample/SamplesSplit';

// Back-compat: old `/samples` deep links now live under the Library.
export const SamplesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/samples',
  beforeLoad: () => { throw redirect({ to: '/library/samples' }); },
});

export const SamplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/samples',
  component: () => <SamplesSplit />,
});
