/**
 * The Nord's USB bridge: the `nord-usb:*` IPC channels that the preload
 * re-exposes as `window.nordNativeUsb`, backed by node-usb. Owns the open
 * device and notices when it is unplugged.
 *
 * (The note on why node-usb must never be rebuilt is at the top of main.ts.)
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { usb, findByIds, getDeviceList, useUsbDkBackend, type InEndpoint, type Interface, type OutEndpoint } from 'usb';
import { DISCONNECTED_MESSAGE, isSameUsbDevice, notOpenMessage } from './shell-policy';
import { openFailure, scReportsRunning, shouldUseUsbDk } from './usb-backend';

const NORD_VENDOR = 0x0ffc;

/**
 * Windows only: libusb's default (WinUSB) backend can't take a device from a
 * foreign kernel driver — so a Nord bound to NSM's custom `ClaviaUSB64.sys`
 * (product id < 0x0024, e.g. Stage 2) fails to open, exactly like the browser.
 * The UsbDk backend CAN capture such a device without replacing its driver
 * (NSM keeps working); it needs the one-time UsbDk runtime installed. The choice
 * and its failure messages are in usb-backend.ts.
 *
 * Whether UsbDk is installed is read from its helper library on disk (the one
 * libusb loads): node-usb's `useUsbDkBackend()` ignores libusb's answer and
 * never throws, so it can't tell.
 *
 * `usb` is pinned to 2.17.0 (package.json): 2.18 builds libusb with its own
 * Windows hotplug (LIBUSB_WINDOWS_HOTPLUG). That scans every device with the
 * WinUSB backend when the module loads — before this switch — serves the
 * device list from that cache, and its rescans treat every device as a WinUSB
 * one, so UsbDk is handed WinUSB records and fails to open them
 * (LIBUSB_ERROR_OTHER, "Redirector startup failed"; seen on a Stage 2). Up to
 * 2.17 libusb asks the active backend for the list each time, and node-usb's
 * own Windows device notifications drive attach/detach.
 */
let usbDkInstalled = false;
let usbDkActive = false;
/** UsbDk is installed, but this session started without it because of the remembered switch-off. */
let usbDkSkipped = false;
/** Set when UsbDk failed on a Nord that doesn't need it: the next start skips UsbDk. */
const SKIP_USBDK_FILE = 'usb-backend.json';

function readSkipUsbDk(settingsDir: string): boolean {
  try {
    return (JSON.parse(readFileSync(join(settingsDir, SKIP_USBDK_FILE), 'utf8')) as { skipUsbDk?: unknown }).skipUsbDk === true;
  } catch {
    return false;
  }
}

function writeSkipUsbDk(settingsDir: string, skipUsbDk: boolean): void {
  try {
    writeFileSync(join(settingsDir, SKIP_USBDK_FILE), JSON.stringify({ skipUsbDk }));
  } catch {
    /* not saved: the same message comes back next time */
  }
}

/**
 * Whether Windows reports UsbDk's driver service running; null when it can't be
 * asked (not installed as a service, sc.exe unavailable, or no answer in time).
 * Asynchronous: this runs in the main process, which must not stall for it.
 */
function usbDkServiceRunning(): Promise<boolean | null> {
  return new Promise((resolve) => {
    execFile('sc.exe', ['query', 'UsbDk'], { encoding: 'utf8', timeout: 3000, windowsHide: true }, (error, stdout) =>
      resolve(error ? null : scReportsRunning(stdout)));
  });
}

function initWindowsBackend(settingsDir: string): void {
  if (process.platform !== 'win32') return;
  // Guarded as a whole: this runs before the window exists, and a Nord that
  // can't be reached must never become an app that doesn't open. On any
  // failure libusb's default (WinUSB) backend stands.
  try {
    usbDkInstalled = existsSync(join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'UsbDkHelper.dll'));
    const skipUsbDk = readSkipUsbDk(settingsDir);
    usbDkSkipped = usbDkInstalled && skipUsbDk;
    if (!shouldUseUsbDk({ platform: process.platform, usbDkInstalled, skipUsbDk })) return;
    useUsbDkBackend();
    usbDkActive = true;
  } catch (error) {
    usbDkActive = false;
    console.error('Could not set up the UsbDk backend; using the default one:', error);
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
  /** Release the Nord if it is open (the window closed or reloaded). */
  close(): Promise<void>;
}

export function initNordUsb(deps: {
  /** Only the app's own window may drive the Nord. */
  isTrustedSender: (event: IpcMainInvokeEvent) => boolean;
  /** Called whenever the device stops being open: closed by the app, or unplugged. */
  onClosed: () => void;
  /** The app's settings folder (userData), where the UsbDk choice is remembered. */
  settingsDir: string;
}): NordUsbHandle {
  initWindowsBackend(deps.settingsDir); // Windows: switch libusb to UsbDk if needed (before any device access).

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

  // Renderer can surface a "install UsbDk" hint on Windows when it isn't installed.
  handle('nord-usb:backend', () => ({ platform: process.platform, usbDkActive, usbDkInstalled }));

  handle('nord-usb:list', () =>
    nordDevices().map((d) => ({
      productId: d.deviceDescriptor.idProduct,
      // productName needs a string-descriptor read (async); left undefined for now.
      productName: undefined as string | undefined,
    })),
  );

  /**
   * Release the open Nord, if any, and report it closed — unless `notify` is
   * false, for a release that is only the first half of opening again. Resolves
   * true when there was a Nord to release.
   */
  const release = (notify = true): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      if (!state) return resolve(false);
      const { iface, device } = state;
      state = null;
      iface.release(true, () => {
        try {
          device.close();
        } catch {
          /* already closed */
        }
        resolve(true);
        if (notify) deps.onClosed();
      });
    });

  handle('nord-usb:open', async (productId?: number) => {
    // A reloaded page opens again while the main process still holds its earlier
    // claim. Not reported as "closed": the Nord is about to be open again, and
    // the updater must not take the gap as its cue to ask for a restart. If the
    // reopen then fails, it IS closed, and that is reported below.
    const wasOpen = await release(false);
    const device = productId ? findByIds(NORD_VENDOR, productId) : nordDevices()[0];
    if (!device) {
      if (wasOpen) deps.onClosed();
      throw new Error('No Nord found over USB.');
    }
    try {
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
    } catch (err) {
      try { device.close(); } catch { /* never opened */ }
      if (wasOpen) deps.onClosed();
      const failure = openFailure({
        platform: process.platform, usingUsbDk: usbDkActive, usbDkSkipped,
        productId: device.deviceDescriptor.idProduct, error: err instanceof Error ? err.message : String(err),
        usbDkRunning: usbDkActive ? await usbDkServiceRunning() : null,
      });
      if (!failure) throw err;
      if (failure.skipUsbDkNextTime) writeSkipUsbDk(deps.settingsDir, true);
      if (failure.useUsbDkNextTime) writeSkipUsbDk(deps.settingsDir, false);
      throw new Error(failure.message);
    }
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

  handle('nord-usb:close', async () => {
    await release();
  });

  return {
    isOpen: () => state !== null,
    close: async () => {
      await release();
    },
  };
}
