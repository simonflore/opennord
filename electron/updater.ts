/**
 * Auto-update wiring.
 *
 * Everything here runs in the main process on purpose: an updater that needed
 * the web app could not repair a release whose web app fails to load.
 *
 * The decisions live in update-policy.ts (tested); this file only connects them
 * to electron-updater, native dialogs, the menu and timers.
 */
import { app, dialog, Menu, type MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import { appendFileSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMenuTemplate } from './menu';
import {
  CHECK_INTERVAL_MS, FIRST_CHECK_DELAY_MS, feedOverride, manualCheckMessage, manualCheckOutcome,
  shortError, shouldOfferMove, versionToPrompt,
} from './update-policy';

export interface UpdaterHandle {
  /** Call when the Nord's USB interface has been closed: a held-back prompt can now show. */
  deviceClosed(): void;
}

export function startUpdater(deps: { isDeviceOpen: () => boolean }): UpdaterHandle {
  let readyVersion: string | null = null;
  let availableVersion: string | null = null;
  let askedVersion: string | null = null;
  let lastError: string | null = null;
  let prompting = false;

  // A plain-text log per launch, next to the OS's other app logs. The previous
  // launch's log is kept: after an update restarts the app, it is the only
  // record of the update that just happened.
  const logFile = join(app.getPath('logs'), 'updater.log');
  const log = (line: string): void => {
    try {
      appendFileSync(logFile, `${new Date().toISOString()} ${shortError(line)}\n`);
    } catch {
      /* logging must never break the app */
    }
  };
  try {
    mkdirSync(app.getPath('logs'), { recursive: true });
    try {
      renameSync(logFile, join(app.getPath('logs'), 'updater.previous.log'));
    } catch {
      /* first launch: nothing to keep */
    }
    writeFileSync(logFile, '');
  } catch {
    /* same */
  }

  const maybePrompt = async (): Promise<void> => {
    if (prompting) return;
    const version = versionToPrompt({ readyVersion, askedVersion, deviceOpen: deps.isDeviceOpen() });
    if (!version) return;
    prompting = true;
    askedVersion = version;
    try {
      const { response } = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1,
        message: `OpenNord ${version} is ready to install.`,
        detail: 'Restart to finish updating. If you choose Later, it installs when you quit.',
      });
      // Re-check: a Nord may have been connected while the dialog was up.
      if (response === 0 && !deps.isDeviceOpen()) {
        log(`restarting into ${version}`);
        autoUpdater.quitAndInstall();
      }
    } finally {
      prompting = false;
    }
  };

  const check = async (): Promise<void> => {
    lastError = null;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      log(`check failed: ${lastError}`);
    }
  };

  const manualCheck = async (): Promise<void> => {
    await check();
    const outcome = manualCheckOutcome({
      current: app.getVersion(), available: availableVersion, readyVersion, deviceOpen: deps.isDeviceOpen(), error: lastError,
    });
    if (outcome.kind === 'ready') {
      askedVersion = null; // the player asked, so ask again even after an earlier Later
      await maybePrompt();
      return;
    }
    await dialog.showMessageBox({ type: outcome.kind === 'error' ? 'warning' : 'info', buttons: ['OK'], ...manualCheckMessage(outcome) });
  };

  // The menu is useful in every build; in development the item explains itself.
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate({
    mac: process.platform === 'darwin',
    appName: app.name,
    onCheckForUpdates: () => {
      if (app.isPackaged) void manualCheck();
      else void dialog.showMessageBox({ type: 'info', buttons: ['OK'], message: 'Updates are only available in the installed app.', detail: 'This is a development build.' });
    },
  }) as MenuItemConstructorOptions[]));

  if (!app.isPackaged) return { deviceClosed: () => {} };

  // macOS replaces the app in place, which it cannot do from the disk image or
  // a quarantined download location. Offer the move on every such launch.
  if (shouldOfferMove({ platform: process.platform, packaged: app.isPackaged, inApplications: process.platform === 'darwin' && app.isInApplicationsFolder() })) {
    void dialog.showMessageBox({
      type: 'question',
      buttons: ['Move to Applications', 'Not now'],
      defaultId: 0,
      cancelId: 1,
      message: 'Move OpenNord to your Applications folder?',
      detail: 'OpenNord can only keep itself up to date when it runs from Applications.',
    }).then(({ response }) => {
      if (response !== 0) return;
      try {
        app.moveToApplicationsFolder();
      } catch (error) {
        log(`move to Applications failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

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

  const override = feedOverride(process.env);
  if (override) {
    log(`TEST FEED in use: ${override}`);
    autoUpdater.setFeedURL({ provider: 'generic', url: override });
  } else if (process.env.OPENNORD_UPDATE_FEED) {
    log('OPENNORD_UPDATE_FEED ignored: not an http(s) URL');
  }

  autoUpdater.on('update-available', (info) => {
    availableVersion = info.version;
    log(`available ${info.version}`);
  });
  autoUpdater.on('update-not-available', () => {
    availableVersion = null;
  });
  autoUpdater.on('update-downloaded', (info) => {
    readyVersion = info.version;
    log(`downloaded ${info.version}`);
    void maybePrompt();
  });
  autoUpdater.on('error', (error) => {
    lastError = error.message;
    log(`error ${error.message}`);
  });

  log(`OpenNord ${app.getVersion()} — updater started`);
  setTimeout(() => void check(), FIRST_CHECK_DELAY_MS);
  setInterval(() => void check(), CHECK_INTERVAL_MS);

  return { deviceClosed: () => void maybePrompt() };
}
