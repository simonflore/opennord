/**
 * Auto-update decisions, as pure functions. No Electron import, so they are
 * unit-tested directly (update-policy.test.ts); electron/updater.ts wires them
 * to electron-updater, dialogs and timers. See
 * docs/specs/2026-10-11-desktop-auto-update-design.md.
 */

/** Wait this long after launch before the first check, so startup stays quick. */
export const FIRST_CHECK_DELAY_MS = 10_000;
export const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

export interface PromptState {
  /** Version whose download has finished, or null. */
  readyVersion: string | null;
  /** Version the player was already asked about in this run, or null. */
  askedVersion: string | null;
  /** True while the Nord's USB interface is open. */
  deviceOpen: boolean;
}

/**
 * The version to offer a restart for right now, or null. Held back while a
 * Nord is open — a dialog in the middle of a transfer is the one thing an
 * updater must not do — and asked once per version per run.
 */
export function versionToPrompt(s: PromptState): string | null {
  if (!s.readyVersion || s.deviceOpen || s.askedVersion === s.readyVersion) return null;
  return s.readyVersion;
}

export type ManualOutcome =
  | { kind: 'up-to-date'; current: string }
  | { kind: 'downloading'; version: string }
  | { kind: 'ready'; version: string }
  | { kind: 'ready-on-quit'; version: string }
  | { kind: 'error'; message: string };

/** What "Check for Updates…" should tell the player. */
export function manualCheckOutcome(i: {
  current: string;
  available: string | null;
  readyVersion: string | null;
  deviceOpen: boolean;
  error: string | null;
}): ManualOutcome {
  if (i.error) return { kind: 'error', message: i.error };
  if (i.readyVersion) return { kind: i.deviceOpen ? 'ready-on-quit' : 'ready', version: i.readyVersion };
  if (i.available) return { kind: 'downloading', version: i.available };
  return { kind: 'up-to-date', current: i.current };
}

/** Dialog copy for a manual check. `ready` is shown through the restart prompt instead. */
export function manualCheckMessage(o: ManualOutcome): { message: string; detail: string } {
  switch (o.kind) {
    case 'up-to-date':
      return { message: 'OpenNord is up to date.', detail: `You have version ${o.current}.` };
    case 'downloading':
      return { message: `Downloading OpenNord ${o.version}…`, detail: 'You can keep working. You’ll be asked to restart when it’s ready.' };
    case 'ready':
      return { message: `OpenNord ${o.version} is ready to install.`, detail: 'Restart to finish updating.' };
    case 'ready-on-quit':
      return { message: `OpenNord ${o.version} is ready to install.`, detail: 'Your Nord is connected, so nothing will restart now. The update installs when you quit OpenNord.' };
    case 'error':
      return { message: 'OpenNord couldn’t check for updates.', detail: `Check your internet connection and try again.\n\n${o.message}` };
  }
}

/** macOS can only replace the app in place when it runs from an Applications folder. */
export function shouldOfferMove(i: { platform: string; packaged: boolean; inApplications: boolean }): boolean {
  return i.platform === 'darwin' && i.packaged && !i.inApplications;
}

/**
 * Test hook: OPENNORD_UPDATE_FEED redirects the updater to a plain http(s)
 * folder, for rehearsing an update before two real releases exist. Anything
 * that is not an http(s) URL is ignored, so a stray value cannot break startup.
 */
export function feedOverride(env: Record<string, string | undefined>): string | null {
  const raw = env.OPENNORD_UPDATE_FEED;
  if (!raw) return null;
  try {
    const { protocol } = new URL(raw);
    return protocol === 'http:' || protocol === 'https:' ? raw : null;
  } catch {
    return null;
  }
}
