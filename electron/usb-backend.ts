/**
 * Windows USB backend choice for the Nord bridge (nord-usb.ts), as pure logic.
 *
 * libusb on Windows has two ways in. The default (WinUSB) opens a Nord that
 * Windows bound to its own WinUSB driver — every model from product id 0x0024
 * on (Clavia's `ClaviaWinUSB.inf`: 0x0024–0x002E, 0x0038–0x003F). An older
 * model (e.g. Stage 2) is bound to Nord Sound Manager's own driver, which only
 * the UsbDk backend can take over. UsbDk takes the whole device, and fails
 * ("Redirector startup failed" → LIBUSB_ERROR_OTHER) when another program holds
 * it, when its driver isn't loaded yet (installed without a restart), or when
 * Memory Integrity blocks it — so it is used only when it's installed, and a
 * model that doesn't need it can turn it off. libusb picks the backend once per
 * session, so turning it off takes effect on the next start.
 */

/** Product ids Windows binds to its WinUSB driver: these open without UsbDk. */
export function isWinUsbBound(productId: number): boolean {
  return (productId >= 0x24 && productId <= 0x2e) || (productId >= 0x38 && productId <= 0x3f);
}

/** Whether to switch libusb to UsbDk at startup. */
export function shouldUseUsbDk(o: { platform: string; usbDkInstalled: boolean; skipUsbDk: boolean }): boolean {
  return o.platform === 'win32' && o.usbDkInstalled && !o.skipUsbDk;
}

/**
 * Whether `sc query <service>` output reports the service running. Only the
 * state code and its name are matched ("4  RUNNING"): the label in front of them
 * is translated on a non-English Windows (ÉTAT, STATUS, ESTADO…), the rest is not.
 */
export function scReportsRunning(scOutput: string): boolean {
  return /:\s*4\s+RUNNING\s*$/m.test(scOutput);
}

/** Why opening the Nord failed, in words a player can act on, and whether to change the UsbDk choice. */
export interface OpenFailure {
  message: string;
  /** Remember to start without UsbDk: this Nord doesn't need it, and UsbDk is what failed. */
  skipUsbDkNextTime: boolean;
  /** Undo that: an older Nord, which only UsbDk can reach, has turned up since. */
  useUsbDkNextTime?: boolean;
}

/**
 * The player-facing failure for a libusb error while opening the Nord, or null
 * to pass the original error on. `error` is the libusb error text (its name,
 * e.g. "LIBUSB_ERROR_OTHER").
 */
export function openFailure(o: {
  platform: string; usingUsbDk: boolean; productId: number; error: string;
  /** UsbDk is installed but this session started without it, because an earlier failure switched it off. */
  usbDkSkipped?: boolean;
  /** Whether Windows reports UsbDk's driver service running (`sc query UsbDk`); null when unknown. */
  usbDkRunning?: boolean | null;
}): OpenFailure | null {
  if (o.platform !== 'win32') return null;
  const busy = /LIBUSB_ERROR_(ACCESS|BUSY)/.test(o.error);
  if (o.usingUsbDk && /LIBUSB_ERROR_OTHER/.test(o.error)) {
    if (isWinUsbBound(o.productId)) {
      return {
        message: 'Your Nord connects without the UsbDk driver, and UsbDk couldn’t reach it, so OpenNord ' +
          'will stop using UsbDk. Quit OpenNord, open it again, and connect.',
        skipUsbDkNextTime: true,
      };
    }
    if (o.usbDkRunning === false) {
      return {
        message: 'The UsbDk driver is installed but isn’t running, so it can’t reach your Nord. Restart Windows ' +
          'and try again. If it still isn’t running after a restart, Windows Security’s Memory Integrity setting ' +
          '(Device security › Core isolation) is likely blocking it.',
        skipUsbDkNextTime: false,
      };
    }
    return {
      message: 'The UsbDk driver couldn’t take over your Nord’s USB port. Quit Nord Sound Manager and any ' +
        'music app using the Nord, unplug the USB cable and plug it back in, then try again. If you installed ' +
        'UsbDk recently, restart Windows first. If it still fails, Windows Security’s Memory Integrity setting ' +
        '(Core Isolation) may be blocking UsbDk.',
      skipUsbDkNextTime: false,
    };
  }
  if (!o.usingUsbDk && !isWinUsbBound(o.productId) && /LIBUSB_ERROR_(NOT_SUPPORTED|ACCESS|OTHER)/.test(o.error)) {
    // The switch-off is not forever: it was made for a newer Nord (or for a
    // passing failure on one), and this older Nord can only be reached with UsbDk.
    if (o.usbDkSkipped) {
      return {
        message: 'This Nord needs the UsbDk driver, which OpenNord had stopped using for a newer Nord, so OpenNord ' +
          'has switched it back on. Quit OpenNord, open it again, and connect.',
        skipUsbDkNextTime: false,
        useUsbDkNextTime: true,
      };
    }
    return {
      message: 'This Nord needs the free UsbDk driver to connect on Windows. Install UsbDk, restart Windows, ' +
        'then open OpenNord again.',
      skipUsbDkNextTime: false,
    };
  }
  if (busy) {
    return {
      message: 'Another program is using your Nord. Quit Nord Sound Manager and any music app using the Nord, ' +
        'then try again.',
      skipUsbDkNextTime: false,
    };
  }
  return null;
}
