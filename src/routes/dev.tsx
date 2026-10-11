import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { DecodeInspector } from '@/components/DecodeInspector';
import { ProgramDecode } from '@/components/decode/ProgramDecode';
import { InstrumentKit } from '@/components/dev/InstrumentKit';

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

export const KitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/kit',
  component: InstrumentKit,
});
