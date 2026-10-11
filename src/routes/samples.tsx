// src/routes/samples.tsx
import { createRoute, redirect, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { SamplesSplit } from '@/components/sample/SamplesSplit';

// Back-compat: old `/samples` deep links now live under the Library.
export const SamplesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/samples',
  beforeLoad: () => { throw redirect({ to: '/library/samples/{-$sampleId}' }); },
});

/**
 * The user-samples list, with one sample open in the inspector when the path
 * names one (pulled from the Nord first when it lives there). One route (an
 * optional id), so the page stays mounted between the list and a sample.
 */
export const SamplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/samples/{-$sampleId}',
  component: SamplesScreen,
});

function SamplesScreen() {
  const { sampleId } = useParams({ from: SamplesRoute.id });
  return <SamplesSplit selectedId={sampleId} />;
}
