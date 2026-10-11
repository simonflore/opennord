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
 * `nord-usb:*` IPC channels below, which the preload re-exposes as
 * `window.nordNativeUsb` — the ElectronUsbTransport's four-method seam.
 *
 * NOTE: node-usb is native but N-API (ABI-stable across Node and Electron) and
 * ships prebuilds for every target, so it must NOT be rebuilt: a local
 * `electron-rebuild` writes a host-platform `build/Release/usb_bindings.node`,
 * which node-gyp-build then prefers over the correct `prebuilds/` binary and
 * which breaks a cross-platform pack. The `import` below is therefore fenced on
 * three sides: `PREBUILDS_ONLY=1` (an esbuild banner, so it is set before this
 * file's first `require`) makes node-gyp-build skip `build/` outright,
 * `build.files` drops it from the archive, and `usb-native-guard.mjs` fails the
 * pack if either slips. See electron/README.md.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { usb, findByIds, getDeviceList, useUsbDkBackend, type InEndpoint, type Interface, type OutEndpoint } from 'usb';
import { startUpdater, type UpdaterHandle } from './updater';

const NORD_VENDOR = 0x0ffc;

/**
 * Windows only: libusb's default (WinUSB) backend can't take a device from a
 * foreign kernel driver — so a Nord bound to NSM's custom `ClaviaUSB64.sys`
 * (product id < 0x0024, e.g. Stage 2) fails to open, exactly like the browser.
 * The UsbDk backend CAN capture such a device without replacing its driver
 * (NSM keeps working). It needs the one-time UsbDk runtime installed; if it's
 * missing, `useUsbDkBackend()` throws and we fall back to WinUSB (works for the
 * WinUSB-bound Stage 3/4). `usbDkActive` lets the renderer prompt to install it.
 */
let usbDkActive = false;
function initWindowsBackend(): void {
  if (process.platform !== 'win32') return;
  try {
    useUsbDkBackend();
    usbDkActive = true;
  } catch {
    usbDkActive = false; // UsbDk not installed → default WinUSB backend stands.
  }
}

interface OpenState {
  device: usb.Device;
  iface: Interface;
  inEndpoint: InEndpoint;
  outEndpoint: OutEndpoint;
}
let state: OpenState | null = null;
let updater: UpdaterHandle | null = null;

function nordDevices(): usb.Device[] {
  return getDeviceList().filter((d) => d.deviceDescriptor.idVendor === NORD_VENDOR);
}

/** Find the vendor bulk interface + its bulk IN/OUT endpoints (mirrors the web transport). */
function findBulk(device: usb.Device): { iface: Interface; inEp: InEndpoint; outEp: OutEndpoint } {
  device.open();
  for (const iface of device.interfaces ?? []) {
    const inEp = iface.endpoints.find((e) => e.direction === 'in' && e.transferType === usb.LIBUSB_TRANSFER_TYPE_BULK) as InEndpoint | undefined;
    const outEp = iface.endpoints.find((e) => e.direction === 'out' && e.transferType === usb.LIBUSB_TRANSFER_TYPE_BULK) as OutEndpoint | undefined;
    if (inEp && outEp) return { iface, inEp, outEp };
  }
  throw new Error('No bulk interface found on the Nord.');
}

function registerUsbIpc(): void {
  // Renderer can surface a "install UsbDk" hint on Windows when it isn't active.
  ipcMain.handle('nord-usb:backend', () => ({ platform: process.platform, usbDkActive }));

  ipcMain.handle('nord-usb:list', () =>
    nordDevices().map((d) => ({
      productId: d.deviceDescriptor.idProduct,
      // productName needs a string-descriptor read (async); left undefined for now.
      productName: undefined as string | undefined,
    })),
  );

  ipcMain.handle('nord-usb:open', async (_e, productId?: number) => {
    const device = productId ? findByIds(NORD_VENDOR, productId) : nordDevices()[0];
    if (!device) throw new Error('No Nord found over USB.');
    const { iface, inEp, outEp } = findBulk(device);
    // On Linux/macOS, take the interface from its kernel driver — the move WebUSB
    // can't make. Best-effort: unsupported on Windows (LIBUSB_ERROR_NOT_SUPPORTED),
    // where the UsbDk backend (initWindowsBackend) does the capturing instead.
    try {
      if (iface.isKernelDriverActive()) iface.detachKernelDriver();
    } catch {
      /* not supported on this platform/backend — UsbDk or WinUSB handles access */
    }
    iface.claim();
    state = { device, iface, inEndpoint: inEp, outEndpoint: outEp };
  });

  ipcMain.handle('nord-usb:bulkOut', (_e, dataB64: string) =>
    new Promise<void>((resolve, reject) => {
      if (!state) return reject(new Error('Device not open.'));
      state.outEndpoint.transfer(Buffer.from(dataB64, 'base64'), (err) => (err ? reject(err) : resolve()));
    }),
  );

  // `timeoutMs` (0/absent = wait forever) is libusb's own transfer timeout: it
  // cancels the read, so a silent device can't strand one. A timeout resolves
  // null (an Error loses its errno crossing IPC); the renderer maps it.
  ipcMain.handle('nord-usb:bulkIn', (_e, maxLength: number, timeoutMs?: number) =>
    new Promise<string | null>((resolve, reject) => {
      if (!state) return reject(new Error('Device not open.'));
      state.inEndpoint.timeout = timeoutMs ?? 0;
      state.inEndpoint.transfer(maxLength, (err, data) => {
        if (err?.errno === usb.LIBUSB_TRANSFER_TIMED_OUT) return resolve(null);
        if (err) return reject(err);
        resolve(Buffer.from(data ?? Buffer.alloc(0)).toString('base64'));
      });
    }),
  );

  ipcMain.handle('nord-usb:close', () =>
    new Promise<void>((resolve) => {
      if (!state) return resolve();
      const { iface, device } = state;
      state = null;
      iface.release(true, () => {
        try {
          device.close();
        } catch {
          /* already closed */
        }
        resolve();
        // A restart prompt held back during the session can show now.
        updater?.deviceClosed();
      });
    }),
  );
}

// The web build's `/` route is the public marketing landing page (the website's
// front door). A downloaded desktop app has already "arrived", so it should open
// straight into the tool — the Library is the app's home. The app uses hash
// routing, so we point the initial load at the Library route's hash.
const APP_ENTRY_HASH = '/library/programs';

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: { preload: join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) await win.loadURL(`${devUrl}#${APP_ENTRY_HASH}`);
  // Packed layout: <app>/electron/dist/main.cjs + <app>/dist/index.html, so the
  // web build is two levels up from __dirname (electron/dist), at the app root.
  else await win.loadFile(join(__dirname, '../../dist/index.html'), { hash: APP_ENTRY_HASH });
}

app.whenReady().then(() => {
  initWindowsBackend(); // Windows: switch libusb to UsbDk if available (before any device access).
  registerUsbIpc();
  updater = startUpdater({ isDeviceOpen: () => state !== null });
  void createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
