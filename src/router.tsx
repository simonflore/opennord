import { createRouter, createHashHistory, createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibraryRoute, ProgramRoute } from '@/routes/library';
import { SamplesRoute } from '@/routes/samples';
import { DeviceRoute } from '@/routes/device';
import { AboutRoute } from '@/routes/about';
import { CompatibilityRoute } from '@/routes/compatibility';
import { InspectRoute, DecodeRoute } from '@/routes/dev';

// Index `/` → the Library (the home door).
const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/library' }); },
});

const routeTree = rootRoute.addChildren([
  IndexRoute,
  LibraryRoute,        // /library
  ProgramRoute,        // /library/$programId
  SamplesRoute,        // /samples
  DeviceRoute,         // /device
  CompatibilityRoute,  // /compatibility
  AboutRoute,          // /about
  InspectRoute,        // /dev/inspect
  DecodeRoute,         // /dev/decode
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),   // Capacitor: non-http origin → hash URLs
  defaultPreload: false,
  // Unknown path → fall back to the Library rather than a bare 404.
  defaultNotFoundComponent: () => {
    if (typeof window !== 'undefined') window.location.hash = '#/library';
    return null;
  },
});

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
