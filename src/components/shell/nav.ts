import { useMemo } from 'react';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';

/** Route paths the shell can navigate to — kept in sync with the route tree in router.tsx. */
export type NavTo =
  | '/library' | '/library/programs' | '/library/pianos' | '/library/samples' | '/library/presets'
  | '/device' | '/compatibility' | '/contribute' | '/about' | '/dev/inspect' | '/dev/decode' | '/dev/kit';

export interface Dest { to: NavTo; label: string }

export const ABOUT: Dest = { to: '/about', label: 'About & legal' };

export const DEV_DESTS: Dest[] = [
  { to: '/dev/inspect', label: 'Decode Inspector' },
  { to: '/dev/decode', label: 'Program Decode' },
  { to: '/dev/kit', label: 'Instrument kit' },
];

// Cloud and Community are build-injected routes (present only when a proprietary
// build supplies them and the capability is available), so they sit outside the
// base NavTo union — cast once.
export const COMMUNITY_TO = '/community' as NavTo;
export const COMMUNITY_SUB: Dest[] = [
  { to: '/community' as NavTo, label: 'Browse' },
  { to: '/community/share' as NavTo, label: 'Share a patch' },
  { to: '/community/mine' as NavTo, label: 'My shares' },
];

// Device transfer rides vendor-USB (WebUSB) — desktop Chrome/Edge or the iPad app
// only. Where it's unavailable, Device stays visible but disabled with a reason.
export const usbSupported = typeof navigator !== 'undefined' && 'usb' in navigator;
export const DEVICE_DISABLED_HINT = 'Connecting to the Nord needs Chrome or Edge on a computer (or the iPad app).';

/** The shortcut key's name on this platform, for the ⌘K hints. */
export const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl ';

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
    { to: '/device', label: 'Device' },
    { to: '/compatibility', label: 'Compatibility' },
    ...(cloud ? [{ to: '/cloud' as NavTo, label: 'Cloud' }] : []),
    ...(community ? [{ to: COMMUNITY_TO, label: 'Community' }] : []),
    ...(__RE__ ? [{ to: '/contribute' as NavTo, label: 'Contribute' }] : []),
  ], [cloud, community]);
}
