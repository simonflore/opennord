import { useMemo } from 'react';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { usbAvailability } from '../../lib/device/capacitor-usb';

/** Route paths the shell can navigate to — kept in sync with the route tree in router.tsx. */
export type NavTo =
  | '/library' | '/library/programs' | '/library/pianos' | '/library/samples' | '/library/presets'
  | '/device' | '/compatibility' | '/contribute' | '/about' | '/dev/inspect' | '/dev/decode' | '/dev/kit';

export interface Dest {
  to: NavTo;
  label: string;
  /** Why the destination can't be used here, when it can't (shown as a tooltip). */
  disabled?: string;
}

export const ABOUT: Dest = { to: '/about', label: 'About & legal' };

export const DEV_DESTS: Dest[] = [
  { to: '/dev/inspect', label: 'Decode Inspector' },
  { to: '/dev/decode', label: 'Program Decode' },
  { to: '/dev/kit', label: 'Instrument kit' },
];

// Cloud and Community are build-injected routes (present only when a proprietary
// build supplies them and the capability is available), so they sit outside the
// base NavTo union and are cast where they're named.
export const COMMUNITY_TO = '/community' as NavTo;
export const COMMUNITY_SUB: Dest[] = [
  { to: COMMUNITY_TO, label: 'Browse' },
  { to: '/community/share' as NavTo, label: 'Share a patch' },
  { to: '/community/mine' as NavTo, label: 'My shares' },
];

// Device transfer rides vendor USB — desktop Chrome/Edge, the desktop app or the
// iPad app. Where none is available, Device stays listed but disabled with why.
/** Why the Nord can't be reached from here, or undefined when it can. The rail, palette and Connect button share it. */
export function deviceUnavailable(): string | undefined {
  return usbAvailability() === 'unsupported'
    ? 'Connecting to the Nord needs Chrome or Edge on a computer, the desktop app or the iPad app.'
    : undefined;
}

/**
 * The tools beside the library, as this build and its capabilities allow: the
 * rail's Tools group and the palette's pages both read this, so a gated
 * destination is added in one place. Cloud and Community appear only when a
 * proprietary build supplies them; Contribute only in the web/dev build.
 */
export function useTools(): Dest[] {
  const caps = useCapabilities();
  const cloud = caps.cloud.available, community = caps.community.available;
  return useMemo(() => [
    { to: '/device', label: 'Device', disabled: deviceUnavailable() },
    { to: '/compatibility', label: 'Compatibility' },
    ...(cloud ? [{ to: '/cloud' as NavTo, label: 'Cloud' }] : []),
    ...(community ? [{ to: COMMUNITY_TO, label: 'Community' }] : []),
    ...(__RE__ ? [{ to: '/contribute' as const, label: 'Contribute' }] : []),
  ], [cloud, community]);
}
