/**
 * What the desktop shell lets the page inside it do, as pure functions (no
 * Electron import; tested in shell-policy.test.ts). main.ts and nord-usb.ts
 * apply these through Electron's hooks. See
 * the maintainers’ notes.
 */

/** Where the app's own document lives: the packed file, plus the Vite server in development. */
export interface AppLocation {
  /** file: URL of the packed dist/index.html. */
  fileUrl: string;
  /** Origin of the dev server (VITE_DEV_SERVER_URL), or null in a packed build. */
  devOrigin: string | null;
}

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * True when `url` is the app's own document. Exact, not prefix-based: for
 * file: the path must be the packed index.html (any hash route), for the dev
 * server the origin must match. Used for navigation and for IPC senders.
 */
export function isAppUrl(url: string, app: AppLocation): boolean {
  const u = parse(url);
  if (!u) return false;
  if (u.protocol === 'file:') {
    const own = parse(app.fileUrl);
    return own !== null && u.host === own.host && u.pathname === own.pathname;
  }
  return app.devOrigin !== null && u.origin === parse(app.devOrigin)?.origin;
}

/**
 * Origin-level version, for permission checks, where Electron only reports an
 * origin ("file:///"). Every file: document shares that origin; it is the
 * navigation rule above that keeps other files out of the window.
 */
export function isAppOrigin(urlOrOrigin: string, app: AppLocation): boolean {
  const u = parse(urlOrOrigin);
  if (!u) return false;
  if (u.protocol === 'file:') return true;
  return app.devOrigin !== null && u.origin === parse(app.devOrigin)?.origin;
}

/** The URL to hand to the system browser, or null. Only https ever leaves the app. */
export function externalUrlToOpen(url: string): string | null {
  const u = parse(url);
  return u?.protocol === 'https:' ? u.href : null;
}

/**
 * Everything the web app asks the browser for. Anything not listed is refused:
 *   midi                       live MIDI keyboard input for the rompler (no sysex)
 *   clipboard-sanitized-write  copy buttons
 *   fileSystem                 the folder picker and save dialog behind the local Library
 * The Nord itself goes through the native bridge, so `usb` is deliberately absent.
 */
export const ALLOWED_PERMISSIONS: readonly string[] = ['midi', 'clipboard-sanitized-write', 'fileSystem'];

export function isPermissionAllowed(permission: string, requester: string, app: AppLocation): boolean {
  return ALLOWED_PERMISSIONS.includes(permission) && isAppOrigin(requester, app);
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_SIZE = { width: 1200, height: 820 };
const MIN_SIZE = { width: 480, height: 360 };
/** A window must overlap some display by at least this much to count as reachable. */
const MIN_VISIBLE = 120;

/** Saved window bounds if they are still sane and on a connected display; otherwise null. */
export function usableBounds(saved: unknown, displays: Bounds[]): Bounds | null {
  if (typeof saved !== 'object' || saved === null) return null;
  const { x, y, width, height } = saved as Record<string, unknown>;
  if (![x, y, width, height].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  const b = { x, y, width, height } as Bounds;
  if (b.width < MIN_SIZE.width || b.height < MIN_SIZE.height) return null;
  const reachable = displays.some((d) => {
    const overlapX = Math.min(b.x + b.width, d.x + d.width) - Math.max(b.x, d.x);
    const overlapY = Math.min(b.y + b.height, d.y + d.height) - Math.max(b.y, d.y);
    return overlapX >= MIN_VISIBLE && overlapY >= MIN_VISIBLE;
  });
  return reachable ? b : null;
}

export const DISCONNECTED_MESSAGE = 'Your Nord was disconnected.';

/** Why a transfer call found no open device: unplugged mid-session, or never opened. */
export function notOpenMessage(wasUnplugged: boolean): string {
  return wasUnplugged ? DISCONNECTED_MESSAGE : 'Device not open.';
}
