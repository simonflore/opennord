// src/routes/samples.tsx
import { createRoute, redirect, useParams } from '@tanstack/react-router';
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

/** One sample open in the inspector (pulled from the Nord first when it lives there). */
export const SampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/samples/$sampleId',
  component: SampleScreen,
});

function SampleScreen() {
  const { sampleId } = useParams({ from: '/library/samples/$sampleId' });
  return <SamplesSplit selectedId={sampleId} />;
}
