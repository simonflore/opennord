// Proprietary-route slot. Default (open/local build): empty. The commercial build
// aliases @/router-pro to frontend-pro's real aggregator via apps/web's vite
// config — mirroring the existing @/router-re → router-re.stub.tsx native-build
// pattern in vite.config.ts. Core never imports proprietary code; it only leaves
// this seam open.
import type { AnyRoute } from '@tanstack/react-router';

export const PRO_ROUTES: AnyRoute[] = [];
