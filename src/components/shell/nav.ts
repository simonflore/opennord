import { useMemo } from 'react';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import type { Capabilities } from '../../lib/capabilities/types';

/** Route paths the shell can navigate to — kept in sync with the route tree in router.tsx. */
export type NavTo =
  | '/library' | '/library/programs' | '/library/pianos' | '/library/samples' | '/library/presets'
  | '/device' | '/compatibility' | '/contribute' | '/about' | '/dev/inspect' | '/dev/decode' | '/dev/kit';

export interface Dest { to: NavTo; label: string }

export const ABOUT: Dest = { to: '/about', label: 'About & legal' };

/** The published docs (docs-site/ in this repository). */
export const PUBLIC_DOCS_URL = 'https://opennord.gigmeister.app/docs/';

/**
 * Where "Docs" opens. The website serves the docs next to the app at /docs/;
 * the desktop and iPad apps load the app from a file or an app origin, and the
 * dev server has no docs, so those open the published site.
 */
export function docsUrl(location: Pick<Location, 'protocol'> | undefined = globalThis.location, dev = import.meta.env.DEV): string {
  const web = location?.protocol === 'https:' || location?.protocol === 'http:';
  return web && !dev ? '/docs/' : PUBLIC_DOCS_URL;
}

/** Opens the docs beside the app: a new tab, or the system browser in the desktop app. */
export function openDocs(): void {
  window.open(docsUrl(), '_blank', 'noopener');
}

export const DEV_DESTS: Dest[] = [
  { to: '/dev/inspect', label: 'Decode Inspector' },
  { to: '/dev/decode', label: 'Program Decode' },
  { to: '/dev/kit', label: 'Instrument kit' },
];

// Cloud, Community and Account are build-injected routes (present only when a proprietary
// build supplies them and the capability is available), so they sit outside the
// base NavTo union and are cast where they're named.
export const COMMUNITY_TO = '/community' as NavTo;
/** The share form; `?item=<library entry id>` opens it on that program or preset. */
export const COMMUNITY_SHARE_TO = '/community/share' as NavTo;
/** The signed-in person's page (sign-out, backups, shares, the MCP): only where this build can sign in. */
export const ACCOUNT_TO = '/account' as NavTo;
export const COMMUNITY_SUB: Dest[] = [
  { to: COMMUNITY_TO, label: 'Browse' },
  { to: COMMUNITY_SHARE_TO, label: 'Share a patch' },
  { to: '/community/mine' as NavTo, label: 'My shares' },
];

/**
 * Whether sharing can be offered: the community is on, and this build has a way
 * to sign in (a share belongs to an account). The desktop app can browse the
 * community without either "Share a patch" or "My shares".
 */
export function canShareToCommunity(caps: Pick<Capabilities, 'auth' | 'community'>): boolean {
  return caps.community.available && caps.auth.available;
}

const NO_PAGES: Dest[] = [];

/**
 * Community's own pages, for the rail and the palette. Without sharing there is
 * only "Browse", which is the Community entry itself, so nothing is listed.
 */
export function useCommunityPages(): Dest[] {
  return canShareToCommunity(useCapabilities()) ? COMMUNITY_SUB : NO_PAGES;
}

// Device stays reachable everywhere: where the Nord can't be reached (no USB
// route in this browser or on an iPhone), the Device page says why and what to use.

/**
 * The tools beside the library, as this build and its capabilities allow: the
 * rail's Tools group and the palette's pages both read this, so a gated
 * destination is added in one place. Cloud and Community appear only when a
 * proprietary build supplies them, Account only where it can sign in, and
 * Contribute only in the web/dev build.
 * Community is also listed where it is off but can be turned on (`optIn`): the
 * page it opens is where that is offered.
 */
export function useTools(): Dest[] {
  const caps = useCapabilities();
  const cloud = caps.cloud.available, community = caps.community.available || !!caps.community.optIn;
  const account = caps.auth.available;
  return useMemo(() => [
    { to: '/device', label: 'Device' },
    { to: '/compatibility', label: 'Compatibility' },
    ...(cloud ? [{ to: '/cloud' as NavTo, label: 'Cloud' }] : []),
    ...(community ? [{ to: COMMUNITY_TO, label: 'Community' }] : []),
    ...(__RE__ ? [{ to: '/contribute' as const, label: 'Contribute' }] : []),
    ...(account ? [{ to: ACCOUNT_TO, label: 'Account' }] : []),
  ], [cloud, community, account]);
}
