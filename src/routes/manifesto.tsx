import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { ManifestoView } from '@/components/manifesto/ManifestoView';

// The manifesto as a page of the site. Full-bleed like the landing page
// (root.tsx skips the app shell for it), and reachable in the installed apps too.
export const ManifestoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/manifesto',
  component: ManifestoView,
});
