/**
 * OpenNord desktop shell — Electron main process.
 *
 * The one reason this exists: node-usb (libusb) can **detach the kernel driver
 * and claim the interface**, which WebUSB is forbidden to do. That's what lets
 * the desktop app connect the pre-WinUSB Nords (USB product id < 0x0024, e.g.
 * the Stage 2) that fail in the browser with "Unable to claim interface" —
 * because NSM bound them to a custom kernel driver, not WinUSB
 * (see memory: windows-webusb-driver-cutoff).
 *
 * The renderer is the unchanged Vite SPA. All Nord USB access goes through the
 * `nord-usb:*` IPC channels in nord-usb.ts, which the preload re-exposes as
 * `window.nordNativeUsb` — the ElectronUsbTransport's four-method seam.
 *
 * NOTE: node-usb is native but N-API (ABI-stable across Node and Electron) and
 * ships prebuilds for every target, so it must NOT be rebuilt: a local
 * `electron-rebuild` writes a host-platform `build/Release/usb_bindings.node`,
 * which node-gyp-build then prefers over the correct `prebuilds/` binary and
 * which breaks a cross-platform pack. The `usb` import (in nord-usb.ts) is
 * therefore fenced on three sides: `PREBUILDS_ONLY=1` (an esbuild banner, so it is set before this
 * file's first `require`) makes node-gyp-build skip `build/` outright,
 * `build.files` drops it from the archive, and `usb-native-guard.mjs` fails the
 * pack if either slips. See electron/README.md.
 */
import { app, BrowserWindow, Menu, screen, session, shell, type IpcMainInvokeEvent, type MenuItemConstructorOptions } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildMenuTemplate } from './menu';
import { initNordUsb, type NordUsbHandle } from './nord-usb';
import { DEFAULT_SIZE, externalUrlToOpen, isAppUrl, isPermissionAllowed, type AppLocation } from './shell-policy';
import { startUpdater, type UpdaterHandle } from './updater';
import { loadWindowState, saveWindowState } from './window-state';

// Packed layout: <app>/electron/dist/main.cjs + <app>/dist/index.html, so the
// web build is two levels up from __dirname (electron/dist), at the app root.
const INDEX_HTML = join(__dirname, '../../dist/index.html');
// Development only: a packed app must never take its trust anchor from the environment.
const DEV_URL = app.isPackaged ? null : (process.env.VITE_DEV_SERVER_URL ?? null);
const APP: AppLocation = { fileUrl: pathToFileURL(INDEX_HTML).href, devOrigin: DEV_URL };

// The web build's `/` route is the public marketing landing page (the website's
// front door). A downloaded desktop app has already "arrived", so it should open
// straight into the tool — the Library is the app's home. The app uses hash
// routing, so we point the initial load at the Library route's hash.
const APP_ENTRY_HASH = '/library/programs';

let mainWindow: BrowserWindow | null = null;
let nordUsb: NordUsbHandle | null = null;
let updater: UpdaterHandle | null = null;

/** Hand an https link to the system browser; anything else goes nowhere. */
function openExternally(url: string): void {
  const safe = externalUrlToOpen(url);
  if (safe) void shell.openExternal(safe);
  else console.warn(`Refused to open ${url}`);
}

/** The Nord bridge answers only the top frame of the app window, showing the app itself. */
function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame;
  return mainWindow !== null
    && event.sender === mainWindow.webContents
    && frame !== null
    && frame === event.sender.mainFrame
    && isAppUrl(frame.url, APP);
}

/**
 * Confine every page the app ever shows — this window and any created later:
 * no new app windows (links open in the browser), no navigating away.
 */
function confineWebContents(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      openExternally(url);
      return { action: 'deny' };
    });
    const stayInApp = (event: { preventDefault(): void; url: string }): void => {
      if (isAppUrl(event.url, APP)) return;
      event.preventDefault();
      openExternally(event.url);
    };
    contents.on('will-navigate', stayInApp);
    contents.on('will-redirect', stayInApp);
  });
}

/** Deny every browser permission except the few the app uses, and only to the app. */
function restrictPermissions(): void {
  // A refusal is logged: when a feature quietly stops working, this line is the
  // only clue that the allow-list in shell-policy.ts is why.
  // (Once per permission — Chromium re-checks the same one many times.)
  const reported = new Set<string>();
  const decide = (permission: string, requester: string): boolean => {
    const allowed = isPermissionAllowed(permission, requester, APP);
    if (!allowed && !reported.has(permission)) {
      reported.add(permission);
      console.warn(`Refused permission "${permission}" to ${requester || '(no origin)'}`);
    }
    return allowed;
  };
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    // The frame that asked, not the page it sits in.
    callback(decide(permission, details.requestingUrl || contents.getURL()));
  });
  session.defaultSession.setPermissionCheckHandler((contents, permission, requestingOrigin) =>
    decide(permission, requestingOrigin || contents?.getURL() || ''));
}

async function createWindow(): Promise<void> {
  const stateFile = join(app.getPath('userData'), 'window-state.json');
  const saved = loadWindowState(stateFile, screen.getAllDisplays().map((d) => d.workArea));

  const win = new BrowserWindow({
    ...DEFAULT_SIZE,
    ...(saved.bounds ?? {}),
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;
  if (saved.maximized) win.maximize();

  let saveTimer: NodeJS.Timeout | null = null;
  const save = (): void => {
    if (win.isDestroyed()) return;
    saveWindowState(stateFile, { bounds: win.getNormalBounds(), maximized: win.isMaximized() });
  };
  const saveSoon = (): void => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 500);
  };
  win.on('resize', saveSoon);
  win.on('move', saveSoon);
  win.on('close', () => {
    if (saveTimer) clearTimeout(saveTimer);
    save();
  });
  win.on('closed', () => {
    if (saveTimer) clearTimeout(saveTimer);
    if (mainWindow === win) mainWindow = null;
    void nordUsb?.close(); // don't keep the Nord claimed for a window that's gone
  });

  // Load the very URL the policy compares against, so the two cannot disagree
  // about how the install path is spelled.
  await win.loadURL(`${DEV_URL ?? APP.fileUrl}#${APP_ENTRY_HASH}`);
}

// One OpenNord at a time: two copies would compete for the Nord and the updater.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      // macOS keeps the app alive with no window; a second launch should bring one back.
      if (app.isReady()) void createWindow();
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  confineWebContents();

  app.whenReady().then(() => {
    restrictPermissions();
    // Guarded like the updater below: without the bridge the app can still read
    // files, and a window that explains itself beats a process with no window.
    try {
      nordUsb = initNordUsb({ isTrustedSender, onClosed: () => updater?.deviceClosed(), settingsDir: app.getPath('userData') });
    } catch (error) {
      console.error('The Nord USB bridge failed to start:', error);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate({
      mac: process.platform === 'darwin',
      appName: app.name,
      onCheckForUpdates: () => updater?.checkNow(),
    }) as MenuItemConstructorOptions[]));
    void createWindow();
    // After the window, and guarded: the updater exists to repair a broken
    // release, so nothing in it may ever stop the app from opening.
    try {
      updater = startUpdater({ isDeviceOpen: () => nordUsb?.isOpen() ?? false });
    } catch (error) {
      console.error('The updater failed to start:', error);
    }
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
