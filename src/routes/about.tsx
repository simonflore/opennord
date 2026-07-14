import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { AboutView } from '@/components/about/AboutView';

export const AboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutView,
});
