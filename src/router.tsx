import { createRouter, createHashHistory, createRoute, redirect, type AnyRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibraryIndexRoute, ProgramsRoute, ProgramRoute } from '@/routes/library';
import { SamplesRoute, SamplesRedirectRoute } from '@/routes/samples';
import { PresetsRoute } from '@/routes/presets';
import { PianosRoute } from '@/routes/pianos';
import { DeviceRoute } from '@/routes/device';
import { AboutRoute } from '@/routes/about';
import { CompatibilityRoute } from '@/routes/compatibility';
import { RE_ROUTES } from '@/router-re';

// Index `/` → the Library (the home door).
const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/library/programs' }); },
});

/** Build the app router, optionally with extra (proprietary) routes injected by the
 *  commercial build. The open build calls it with no args. */
export function createAppRouter(extra: AnyRoute[] = []) {
  const routeTree = rootRoute.addChildren([
    IndexRoute,
    LibraryIndexRoute, ProgramsRoute, ProgramRoute,
    SamplesRedirectRoute, SamplesRoute,
    PresetsRoute, PianosRoute, DeviceRoute, CompatibilityRoute, AboutRoute,
    ...RE_ROUTES,
    ...extra,
  ]);
  return createRouter({
    routeTree,
    history: createHashHistory(),
    defaultPreload: false,
    defaultNotFoundComponent: () => {
      if (typeof window !== 'undefined') window.location.hash = '#/library/programs';
      return null;
    },
  });
}

export const router = createAppRouter();
export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
