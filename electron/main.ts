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
 * NOTE: node-usb is a native module; it must be rebuilt for Electron's ABI
 * (`electron-rebuild`/`@electron/rebuild`). See electron/README.md.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { usb, findByIds, getDeviceList } from 'usb';

const NORD_VENDOR = 0x0ffc;
/** Stage-4 layout defaults; the real endpoints are discovered per device below. */
const DEFAULT_IFACE = 0;

interface OpenState {
  device: usb.Device;
  iface: usb.Interface;
  inEndpoint: usb.InEndpoint;
  outEndpoint: usb.OutEndpoint;
}
let state: OpenState | null = null;

function nordDevices(): usb.Device[] {
  return getDeviceList().filter((d) => d.deviceDescriptor.idVendor === NORD_VENDOR);
}

/** Find the vendor bulk interface + its bulk IN/OUT endpoints (mirrors the web transport). */
function findBulk(device: usb.Device): { iface: usb.Interface; inEp: usb.InEndpoint; outEp: usb.OutEndpoint } {
  device.open();
  for (const iface of device.interfaces ?? []) {
    const inEp = iface.endpoints.find((e) => e.direction === 'in' && e.transferType === usb.LIBUSB_TRANSFER_TYPE_BULK) as usb.InEndpoint | undefined;
    const outEp = iface.endpoints.find((e) => e.direction === 'out' && e.transferType === usb.LIBUSB_TRANSFER_TYPE_BULK) as usb.OutEndpoint | undefined;
    if (inEp && outEp) return { iface, inEp, outEp };
  }
  throw new Error('No bulk interface found on the Nord.');
}

function registerUsbIpc(): void {
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
    // The move WebUSB can't make: take the interface from the kernel driver
    // (Windows ClaviaUSB64.sys / Linux usbfs) so we can claim it.
    if (iface.isKernelDriverActive()) iface.detachKernelDriver();
    iface.claim();
    state = { device, iface, inEndpoint: inEp, outEndpoint: outEp };
  });

  ipcMain.handle('nord-usb:bulkOut', (_e, dataB64: string) =>
    new Promise<void>((resolve, reject) => {
      if (!state) return reject(new Error('Device not open.'));
      state.outEndpoint.transfer(Buffer.from(dataB64, 'base64'), (err) => (err ? reject(err) : resolve()));
    }),
  );

  ipcMain.handle('nord-usb:bulkIn', (_e, maxLength: number) =>
    new Promise<string>((resolve, reject) => {
      if (!state) return reject(new Error('Device not open.'));
      state.inEndpoint.transfer(maxLength, (err, data) =>
        err ? reject(err) : resolve(Buffer.from(data ?? Buffer.alloc(0)).toString('base64')),
      );
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
      });
    }),
  );
}

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: { preload: join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) await win.loadURL(devUrl);
  else await win.loadFile(join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
  registerUsbIpc();
  void createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
