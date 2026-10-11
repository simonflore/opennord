import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { HomeView } from '@/components/home/HomeView';
import { isCapacitorPlatform } from '@/lib/platform';
import { isElectronUsb } from '@/lib/device/electron-usb';

// `/` is the public landing page — OpenNord's front door. It renders full-bleed
// (root.tsx skips the app rail for this path) and links into the app at /library.
// An installed app (iPad, desktop) has already arrived: it opens on the Library,
// and its links back to `/` land there too.
export const HomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (isCapacitorPlatform() || isElectronUsb()) throw redirect({ to: '/library/programs' });
  },
  component: HomeView,
});
