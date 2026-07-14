// src/routes/presets.tsx
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { PresetsSplit } from '@/components/preset/PresetsSplit';

export const PresetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/presets',
  component: () => <PresetsSplit />,
});
