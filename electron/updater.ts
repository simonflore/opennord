/**
 * Auto-update wiring (docs/specs/2026-10-11-desktop-auto-update-design.md).
 *
 * Everything here runs in the main process on purpose: an updater that needed
 * the web app could not repair a release whose web app fails to load.
 *
 * The decisions live in update-policy.ts (tested); this file only connects them
 * to electron-updater, native dialogs and timers. main.ts owns the menu and
 * calls `checkNow` from it.
 */
import { app, autoUpdater as nativeUpdater, BrowserWindow, dialog, type MessageBoxOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import { appendFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHECK_INTERVAL_MS, FIRST_CHECK_DELAY_MS, feedOverride, manualCheckMessage, manualCheckOutcome,
  shortError, shouldOfferMove, versionToPrompt,
} from './update-policy';

export interface UpdaterHandle {
  /** "Check for Updates…": always answers with a dialog. */
  checkNow(): void;
  /** Call when the Nord's USB interface has been closed: a held-back prompt can now show. */
  deviceClosed(): void;
}

/** A log entry may be a stack trace, but not GitHub's whole releases feed. */
const LOG_ENTRY_CAP = 2000;

function show(options: MessageBoxOptions) {
  // Attached to the window when there is one, so it cannot open behind it.
  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  return parent ? dialog.showMessageBox(parent, options) : dialog.showMessageBox(options);
}

async function inform(type: 'info' | 'warning', message: string, detail: string): Promise<void> {
  await show({ type, buttons: ['OK'], message, detail });
}

/** A two-button question; resolves true for `yes`. Escape means `no`. */
async function confirm(message: string, detail: string, yes: string, no: string): Promise<boolean> {
  const { response } = await show({ type: 'question', buttons: [yes, no], defaultId: 0, cancelId: 1, message, detail });
  return response === 0;
}

export function startUpdater(deps: { isDeviceOpen: () => boolean }): UpdaterHandle {
  if (!app.isPackaged) {
    return {
      checkNow: () => void inform('info', 'Updates are only available in the installed app.', 'This is a development build.'),
      deviceClosed: () => {},
    };
  }

  // A plain-text log per launch, next to the OS's other app logs. The previous
  // launch's log is kept: after an update restarts the app, it is the only
  // record of the update that just happened.
  const logsDir = app.getPath('logs');
  const logFile = join(logsDir, 'updater.log');
  try {
    mkdirSync(logsDir, { recursive: true });
    renameSync(logFile, join(logsDir, 'updater.previous.log'));
  } catch {
    /* first launch has nothing to keep; logging must never break the app */
  }
  const log = (entry: string): void => {
    try {
      appendFileSync(logFile, `${new Date().toISOString()} ${entry.slice(0, LOG_ENTRY_CAP)}\n`);
    } catch {
      /* same */
    }
  };
  log(`OpenNord ${app.getVersion()} — updater started`);

  // macOS replaces the app in place, which it cannot do from the disk image or
  // a quarantined download location. There, checking would only download an
  // update that can never install — so offer the move instead, at launch and
  // again whenever the player asks for updates.
  if (shouldOfferMove({ platform: process.platform, inApplications: process.platform === 'darwin' && app.isInApplicationsFolder() })) {
    log('not in Applications: updates are off until the app is moved there');
    const offerMove = async (): Promise<void> => {
      const move = await confirm(
        'Move OpenNord to your Applications folder?',
        'OpenNord can only keep itself up to date when it runs from Applications.',
        'Move to Applications', 'Not now',
      );
      if (!move) return;
      try {
        if (!app.moveToApplicationsFolder()) log('move to Applications was cancelled');
      } catch (error) {
        log(`move to Applications failed: ${shortError(error)}`);
      }
    };
    void offerMove();
    return { checkNow: () => void offerMove(), deviceClosed: () => {} };
  }

  let readyVersion: string | null = null;
  let askedVersion: string | null = null;
  let prompting = false;

  // Stated rather than left to defaults: these four lines are the spec.
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.logger = {
    info: (m: unknown) => log(`info ${String(m)}`),
    warn: (m: unknown) => log(`warn ${String(m)}`),
    error: (m: unknown) => log(`error ${String(m)}`),
    debug: () => {},
  };
  // The logger above already records every error; this listener exists because
  // an EventEmitter throws on an 'error' event nobody listens to.
  autoUpdater.on('error', () => {});

  const override = feedOverride(process.env);
  if (override) {
    log(`TEST FEED in use: ${override}`);
    autoUpdater.setFeedURL({ provider: 'generic', url: override });
  } else if (process.env.OPENNORD_UPDATE_FEED) {
    log('OPENNORD_UPDATE_FEED ignored: not an http(s) URL');
  }

  const maybePrompt = async (): Promise<void> => {
    if (prompting) return;
    const version = versionToPrompt({ readyVersion, askedVersion, deviceOpen: deps.isDeviceOpen() });
    if (!version) return;
    prompting = true;
    askedVersion = version;
    try {
      const restart = await confirm(
        `OpenNord ${version} is ready to install.`,
        'Restart to finish updating. If you choose Later, it installs when you quit.',
        'Restart now', 'Later',
      );
      if (!restart) return;
      if (deps.isDeviceOpen()) {
        // A Nord was connected while the dialog was up. Don't restart; ask again once it is closed.
        askedVersion = null;
        return;
      }
      log(`restarting into ${version}`);
      autoUpdater.quitAndInstall();
    } finally {
      prompting = false;
    }
  };

  const becomeReady = (version: string): void => {
    readyVersion = version;
    log(`ready ${version}`);
    void maybePrompt();
  };

  // On macOS electron-updater reports "downloaded" when IT has the file, before
  // Squirrel.Mac has fetched and staged it. Asking then is a trap: a "Restart
  // now" in that window makes electron-updater wait for Squirrel and quit
  // whenever it finishes — seconds or, after a Squirrel error, hours later, with
  // no prompt and no Nord check. So on macOS the update only becomes ready on
  // Squirrel's own event, after which a restart is immediate. (Registered after
  // autoUpdater is first touched above, so electron-updater's listener on the
  // same event has already run.)
  let stagedVersion: string | null = null;
  autoUpdater.on('update-downloaded', (info) => {
    if (process.platform === 'darwin') stagedVersion = info.version;
    else becomeReady(info.version);
  });
  if (process.platform === 'darwin') {
    nativeUpdater.on('update-downloaded', () => {
      if (stagedVersion) becomeReady(stagedVersion);
    });
  }

  /** One check. Resolves once the check is done; a download it starts carries on in the background. */
  const check = async (): Promise<{ available: string | null; error: string | null }> => {
    try {
      const result = await autoUpdater.checkForUpdates();
      // The download's failure is logged by the updater; left unhandled here it
      // would surface as an unhandled rejection in the main process.
      result?.downloadPromise?.catch(() => {});
      return { available: result?.isUpdateAvailable ? result.updateInfo.version : null, error: null };
    } catch (error) {
      return { available: null, error: shortError(error) };
    }
  };

  const checkNow = async (): Promise<void> => {
    const { available, error } = await check();
    const outcome = manualCheckOutcome({ current: app.getVersion(), available, readyVersion, deviceOpen: deps.isDeviceOpen(), error });
    if (outcome.kind === 'ready') {
      // The player asked, so ask again even after an earlier Later — unless the
      // prompt is on screen right now, which is already their answer.
      if (!prompting) askedVersion = null;
      await maybePrompt();
      return;
    }
    const { message, detail } = manualCheckMessage(outcome);
    await inform(outcome.kind === 'error' ? 'warning' : 'info', message, detail);
  };

  setTimeout(() => void check(), FIRST_CHECK_DELAY_MS);
  setInterval(() => void check(), CHECK_INTERVAL_MS);

  return { checkNow: () => void checkNow(), deviceClosed: () => void maybePrompt() };
}
