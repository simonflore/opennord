import { createRouter, createHashHistory, createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibraryIndexRoute, ProgramsRoute, ProgramRoute } from '@/routes/library';
import { SamplesRoute, SamplesRedirectRoute } from '@/routes/samples';
import { PresetsRoute } from '@/routes/presets';
import { PianosRoute } from '@/routes/pianos';
import { DeviceRoute } from '@/routes/device';
import { AboutRoute } from '@/routes/about';
import { CompatibilityRoute } from '@/routes/compatibility';
import { RE_ROUTES } from '@/router-re';
import { PRO_ROUTES } from '@/router-pro';

// Index `/` → the Library (the home door).
const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/library/programs' }); },
});

const routeTree = rootRoute.addChildren([
  IndexRoute,
  LibraryIndexRoute,
  ProgramsRoute,
  ProgramRoute,
  SamplesRedirectRoute,
  SamplesRoute,
  PresetsRoute,
  PianosRoute,
  DeviceRoute,
  CompatibilityRoute,
  AboutRoute,
  ...RE_ROUTES, // /contribute, /dev/inspect, /dev/decode — empty on the native build
  ...PRO_ROUTES, // cloud/AI/community — empty in the open build, aliased by the product build
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),   // Capacitor: non-http origin → hash URLs
  defaultPreload: false,
  // Unknown path → fall back to the Library rather than a bare 404.
  defaultNotFoundComponent: () => {
    if (typeof window !== 'undefined') window.location.hash = '#/library/programs';
    return null;
  },
});

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
