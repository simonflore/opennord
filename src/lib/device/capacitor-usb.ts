import { TransportTimeoutError, type NordTransport } from './transport';
import { getCapacitorPlatform, isCapacitorPlatform, isIphone } from '@/lib/platform';
import { NordUsb } from 'capacitor-nord-usb';
import { base64ToBytes, bytesToBase64 } from './base64';
import { isElectronUsb } from './electron-usb';

/** Why USB transfer is or isn't reachable on this host. */
export type UsbAvailability = 'electron' | 'webusb' | 'ipad-dext-pending' | 'iphone' | 'unsupported';

/**
 * Classify the host's USB-transfer reach:
 *   - 'electron'          desktop app — use ElectronUsbTransport (node-usb; can
 *                         detach the kernel driver, so it reaches the pre-WinUSB
 *                         Nords the browser can't claim). Checked FIRST because
 *                         Electron's renderer also exposes navigator.usb.
 *   - 'webusb'            Chromium desktop browser — use WebUsbTransport.
 *   - 'ipad-dext-pending' native iPad — the DriverKit path; gate on nordUsbAvailable().
 *   - 'iphone'            an iPhone, app or browser — no USB route (DriverKit is iPad-only).
 *   - 'unsupported'       any other browser (Safari, Firefox, mobile browsers).
 */
export function usbAvailability(): UsbAvailability {
  if (isElectronUsb()) return 'electron';
  if (typeof navigator !== 'undefined' && 'usb' in navigator) return 'webusb';
  if (isIphone()) return 'iphone'; // the app or any browser: an iPhone has no USB route
  if (isCapacitorPlatform() && getCapacitorPlatform() === 'ios') return 'ipad-dext-pending';
  return 'unsupported';
}

/**
 * True when a Nord is present and the DriverKit DEXT is reachable (native iPad).
 * Any error/absence (e.g. no DEXT installed) maps to false so the UI degrades to
 * the "plug your Nord in" state rather than crashing.
 */
export async function nordUsbAvailable(): Promise<boolean> {
  try {
    const { available } = await NordUsb.isAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * iPad USB transport: delegates the four-method NordTransport seam to the native
 * NordUsb plugin (Swift CAPPlugin -> IOKit -> DriverKit DEXT), marshaling bytes as
 * base64 across the bridge. Everything above this seam is reused unchanged.
 */
export class CapacitorUsbTransport implements NordTransport {
  private opened: Promise<number> | undefined;

  /**
   * Open the Nord (once) and report its USB product id — 0 when the driver
   * couldn't read it. The id is only known once the driver is open, so the
   * connect flow asks here before it picks the model; `open()` then reuses it.
   */
  identify(): Promise<number> {
    this.opened ??= NordUsb.open().then(
      ({ productId }) => productId ?? 0,
      (e: unknown) => {
        this.opened = undefined; // let a retry open again
        throw e;
      },
    );
    return this.opened;
  }
  async open(): Promise<void> {
    await this.identify();
  }
  async bulkOut(data: Uint8Array): Promise<void> {
    await NordUsb.bulkOut({ data: bytesToBase64(data) });
  }
  async bulkIn(maxLength: number, timeoutMs?: number): Promise<Uint8Array> {
    const { data, timedOut } = await NordUsb.bulkIn({ maxLength, timeoutMs });
    if (timedOut) throw new TransportTimeoutError(timeoutMs ?? 0);
    return base64ToBytes(data);
  }
  async close(): Promise<void> {
    this.opened = undefined;
    await NordUsb.close();
  }
}
