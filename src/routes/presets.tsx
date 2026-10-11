// src/routes/presets.tsx
import { createRoute, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { PresetsSplit } from '@/components/preset/PresetsSplit';

/**
 * The presets list, with one preset open beside it when the path names one.
 * One route (an optional id), so moving between the list and a preset keeps
 * the same page mounted — its scroll and state survive.
 */
export const PresetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/presets/{-$presetId}',
  component: PresetsScreen,
});

function PresetsScreen() {
  const { presetId } = useParams({ from: PresetsRoute.id });
  return <PresetsSplit selectedId={presetId} />;
}
