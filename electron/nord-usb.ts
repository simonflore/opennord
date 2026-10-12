/**
 * The Nord's USB bridge: the `nord-usb:*` IPC channels that the preload
 * re-exposes as `window.nordNativeUsb`, backed by node-usb. Owns the open
 * device and notices when it is unplugged.
 *
 * (The note on why node-usb must never be rebuilt is at the top of main.ts.)
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { usb, findByIds, getDeviceList, useUsbDkBackend, type InEndpoint, type Interface, type OutEndpoint } from 'usb';
import { DISCONNECTED_MESSAGE, isSameUsbDevice, notOpenMessage } from './shell-policy';

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

export interface NordUsbHandle {
  /** True while the Nord's interface is claimed. */
  isOpen(): boolean;
}

export function initNordUsb(deps: {
  /** Only the app's own window may drive the Nord. */
  isTrustedSender: (event: IpcMainInvokeEvent) => boolean;
  /** Called whenever the device stops being open: closed by the app, or unplugged. */
  onClosed: () => void;
}): NordUsbHandle {
  initWindowsBackend(); // Windows: switch libusb to UsbDk if available (before any device access).

  let state: OpenState | null = null;
  /** True from an unplug until the next successful open — picks the error message. */
  let unplugged = false;

  /** Register a channel that refuses callers other than the app window. */
  const handle = <A extends unknown[], R>(channel: string, fn: (...args: A) => R): void => {
    ipcMain.handle(channel, (event, ...args) => {
      if (!deps.isTrustedSender(event)) throw new Error('Not allowed.');
      return fn(...(args as A));
    });
  };

  /** True when the open Nord is no longer on the bus. */
  const isGone = (open: OpenState): boolean => !getDeviceList().some((d) => isSameUsbDevice(d, open.device));

  // An unplugged device leaves a dead handle behind. Drop it — there is no
  // interface left to release — so the next connect starts clean, and remember
  // why, so the next call can say so.
  const dropUnplugged = (open: OpenState): void => {
    if (state !== open) return; // already dropped, or a newer session has started
    state = null;
    unplugged = true;
    try {
      open.device.close();
    } catch {
      /* a transfer may still be unwinding; the handle goes when it does */
    }
    deps.onClosed();
  };

  // The device list is the authority, not the event alone: the event is acted
  // on only if the Nord has really gone. (libusb's Windows hotplug together
  // with the UsbDk backend is not known to be reliable — see electron/README.md.)
  usb.on('detach', (device) => {
    if (state && isSameUsbDevice(device, state.device) && isGone(state)) dropUnplugged(state);
  });

  /**
   * A transfer that failed because the cable was pulled. The error code is no
   * guide — macOS reports a plain transfer error, and it often arrives before
   * the detach event — so ask the bus whether the Nord is still there.
   */
  const transferError = (open: OpenState, err: Error): Error => {
    if (!unplugged && !isGone(open)) return err;
    dropUnplugged(open);
    return new Error(DISCONNECTED_MESSAGE);
  };

  // Renderer can surface a "install UsbDk" hint on Windows when it isn't active.
  handle('nord-usb:backend', () => ({ platform: process.platform, usbDkActive }));

  handle('nord-usb:list', () =>
    nordDevices().map((d) => ({
      productId: d.deviceDescriptor.idProduct,
      // productName needs a string-descriptor read (async); left undefined for now.
      productName: undefined as string | undefined,
    })),
  );

  handle('nord-usb:open', async (productId?: number) => {
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
    unplugged = false;
  });

  handle('nord-usb:bulkOut', (dataB64: string) =>
    new Promise<void>((resolve, reject) => {
      const open = state;
      if (!open) return reject(new Error(notOpenMessage(unplugged)));
      open.outEndpoint.transfer(Buffer.from(dataB64, 'base64'), (err) => (err ? reject(transferError(open, err)) : resolve()));
    }),
  );

  // `timeoutMs` (0/absent = wait forever) is libusb's own transfer timeout: it
  // cancels the read, so a silent device can't strand one. A timeout resolves
  // null (an Error loses its errno crossing IPC); the renderer maps it.
  handle('nord-usb:bulkIn', (maxLength: number, timeoutMs?: number) =>
    new Promise<string | null>((resolve, reject) => {
      const open = state;
      if (!open) return reject(new Error(notOpenMessage(unplugged)));
      open.inEndpoint.timeout = timeoutMs ?? 0;
      open.inEndpoint.transfer(maxLength, (err, data) => {
        if (err?.errno === usb.LIBUSB_TRANSFER_TIMED_OUT) return resolve(null);
        if (err) return reject(transferError(open, err));
        resolve(Buffer.from(data ?? Buffer.alloc(0)).toString('base64'));
      });
    }),
  );

  handle('nord-usb:close', () =>
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
        deps.onClosed();
      });
    }),
  );

  return { isOpen: () => state !== null };
}
