// RE-only route aggregator. The native build aliases this module to
// router-re.stub.tsx (see vite.config.ts), so none of these imports — nor the
// contribute/dev code they pull in — reach the iOS bundle.
import { ContributeRoute } from '@/routes/contribute';
import { InspectRoute, DecodeRoute } from '@/routes/dev';

export const RE_ROUTES = [ContributeRoute, InspectRoute, DecodeRoute];
