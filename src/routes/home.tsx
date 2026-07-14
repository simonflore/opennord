import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { HomeView } from '@/components/home/HomeView';

// `/` is the public landing page — OpenNord's front door. It renders full-bleed
// (root.tsx skips the app rail for this path) and links into the app at /library.
export const HomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeView,
});
