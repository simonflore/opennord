// src/routes/presets.tsx
import { createRoute, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { PresetsSplit } from '@/components/preset/PresetsSplit';

export const PresetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/presets',
  component: () => <PresetsSplit />,
});

/** One preset open beside the list (or full-screen on a phone). */
export const PresetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/presets/$presetId',
  component: PresetScreen,
});

function PresetScreen() {
  const { presetId } = useParams({ from: '/library/presets/$presetId' });
  return <PresetsSplit selectedId={presetId} />;
}
