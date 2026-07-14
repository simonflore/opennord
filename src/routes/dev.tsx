import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { DecodeInspector } from '@/components/DecodeInspector';
import { ProgramDecode } from '@/components/decode/ProgramDecode';

export const InspectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/inspect',
  component: DecodeInspector,
});

export const DecodeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/decode',
  component: ProgramDecode,
});
