import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { MatrixView } from '@/components/compatibility/MatrixView';

export const CompatibilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compatibility',
  component: MatrixView,
});
