import { createRouter, createHashHistory, type AnyRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { HomeRoute } from '@/routes/home';
import { LibraryIndexRoute, ProgramsRoute } from '@/routes/library';
import { SamplesRoute, SamplesRedirectRoute } from '@/routes/samples';
import { PresetsRoute } from '@/routes/presets';
import { PianosRoute } from '@/routes/pianos';
import { DeviceRoute } from '@/routes/device';
import { AboutRoute } from '@/routes/about';
import { CompatibilityRoute } from '@/routes/compatibility';
import { RE_ROUTES } from '@/router-re';
import { trimSlash } from './lib/library/categories';

/** Build the app router, optionally with extra (proprietary) routes injected by the
 *  commercial build. The open build calls it with no args. */
export function createAppRouter(extra: AnyRoute[] = []) {
  const routeTree = rootRoute.addChildren([
    HomeRoute,
    LibraryIndexRoute, ProgramsRoute,
    SamplesRedirectRoute, SamplesRoute,
    PresetsRoute, PianosRoute, DeviceRoute, CompatibilityRoute, AboutRoute,
    ...RE_ROUTES,
    ...extra,
  ]);
  return createRouter({
    routeTree,
    history: createHashHistory(),
    defaultPreload: false,
    // Each page keeps its scroll: leaving a list for an entry and coming back
    // (or going back in history) returns to where the list was, on a phone too.
    scrollRestoration: true,
    getScrollRestorationKey: (location) => trimSlash(location.pathname),
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
