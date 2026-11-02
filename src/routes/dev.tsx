import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { DecodeInspector } from '@/components/DecodeInspector';
import { ProgramDecode } from '@/components/decode/ProgramDecode';
import { InstrumentKit } from '@/components/dev/InstrumentKit';
import { HardwareChecks } from '@/components/dev/HardwareChecks';

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

/**
 * /dev/hardware: the hardware session's tools (components/dev/HardwareChecks.tsx).
 * Development builds only: in a production build `import.meta.env.DEV` is false, the
 * route is never created, and HardwareChecks is dropped from the bundle.
 */
export const HardwareRoute = import.meta.env.DEV
  ? createRoute({
    getParentRoute: () => rootRoute,
    path: '/dev/hardware',
    component: HardwareChecks,
  })
  : null;
