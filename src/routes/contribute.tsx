import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { ContributePage } from '../components/contribute/ContributePage';

export const ContributeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contribute',
  component: ContributePage,
});
