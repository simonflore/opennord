import { createRouter, createHashHistory, type AnyRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { HomeRoute } from '@/routes/home';
import { LibraryIndexRoute, ProgramsRoute } from '@/routes/library';
import { SamplesRoute, SamplesRedirectRoute } from '@/routes/samples';
import { BuildSampleRoute } from '@/routes/build-sample';
import { PresetsRoute } from '@/routes/presets';
import { PianosRoute } from '@/routes/pianos';
import { DeviceRoute } from '@/routes/device';
import { AboutRoute } from '@/routes/about';
import { CompatibilityRoute } from '@/routes/compatibility';
import { RE_ROUTES } from '@/router-re';

/** Build the app router, optionally with extra (proprietary) routes injected by the
 *  commercial build. The open build calls it with no args. */
export function createAppRouter(extra: AnyRoute[] = []) {
  const routeTree = rootRoute.addChildren([
    HomeRoute,
    LibraryIndexRoute, ProgramsRoute,
    SamplesRedirectRoute, SamplesRoute, BuildSampleRoute,
    PresetsRoute, PianosRoute, DeviceRoute, CompatibilityRoute, AboutRoute,
    ...RE_ROUTES,
    ...extra,
  ]);
  return createRouter({
    routeTree,
    history: createHashHistory(),
    defaultPreload: false,
    // Each history entry keeps its scroll: Back from an entry to its list (the
    // back button steps back when it can) returns to where the list was, on a
    // phone too, while a newly opened page starts fresh and the split's list
    // pane keeps its place.
    scrollRestoration: true,
    // The split's detail pane stays mounted between entries; a newly opened
    // entry starts at its top instead of inheriting the last one's scroll.
    scrollToTopSelectors: ['.on-split__detail'],
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
