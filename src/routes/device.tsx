import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { DeviceManager } from '@/components/device/DeviceManager';

export const DeviceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/device',
  component: DeviceManager,
});
