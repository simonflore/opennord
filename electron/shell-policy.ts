/**
 * What the desktop shell lets the page inside it do, as pure functions (no
 * Electron import; tested in shell-policy.test.ts). main.ts and nord-usb.ts
 * apply these through Electron's hooks. See
 * docs/specs/2026-10-11-desktop-shell-hardening-design.md.
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
 * A file: URL's path in a form two spellings of the same file agree on. Node
 * percent-encodes `~ [ ] | ^` where Chromium leaves them literal, and Windows
 * drive letters arrive in either case — so decode, and fold case when the path
 * starts with a drive letter. Null when the escapes are malformed.
 */
function filePathKey(u: URL): string | null {
  try {
    const path = decodeURIComponent(u.pathname);
    return /^\/[A-Za-z]:\//.test(path) ? path.toLowerCase() : path;
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
    if (!own || u.host !== own.host) return false;
    const key = filePathKey(u);
    return key !== null && key === filePathKey(own);
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
 *   midi, midiSysex            live MIDI keyboard input for the rompler
 *   clipboard-sanitized-write  copy buttons
 *   fileSystem                 the folder picker and save dialog behind the local Library
 * The Nord itself goes through the native bridge, so `usb` is deliberately absent.
 *
 * `midiSysex` is here although the app asks for MIDI *without* sysex: Chromium
 * (seen on 152 / Electron 44) reports even a plain `requestMIDIAccess()` to the
 * shell as `midiSysex`, so refusing it refuses all MIDI input. The access the
 * page gets back is still the non-sysex one it asked for.
 */
export const ALLOWED_PERMISSIONS: readonly string[] = ['midi', 'midiSysex', 'clipboard-sanitized-write', 'fileSystem'];

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
/** …and its title bar must be on that display, or there is nothing to drag it back by. */
const TITLE_BAR = 32;

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
    const titleBarOnDisplay = b.y >= d.y && b.y + TITLE_BAR <= d.y + d.height;
    return overlapX >= MIN_VISIBLE && overlapY >= MIN_VISIBLE && titleBarOnDisplay;
  });
  return reachable ? b : null;
}

export const DISCONNECTED_MESSAGE = 'Your Nord was disconnected.';

/** Why a transfer call found no open device: unplugged mid-session, or never opened. */
export function notOpenMessage(wasUnplugged: boolean): string {
  return wasUnplugged ? DISCONNECTED_MESSAGE : 'Device not open.';
}

/** Two libusb device records name the same physical connection. */
export function isSameUsbDevice(
  a: { busNumber: number; deviceAddress: number },
  b: { busNumber: number; deviceAddress: number },
): boolean {
  return a.busNumber === b.busNumber && a.deviceAddress === b.deviceAddress;
}

/**
 * An error thrown in the main process reaches the page wrapped as
 * "Error invoking remote method '<channel>': Error: <message>". Give the page
 * the message it was meant to show.
 */
export function cleanIpcError(message: string): string {
  return message.replace(/^Error invoking remote method '[^']*': (?:Error: )?/, '');
}
