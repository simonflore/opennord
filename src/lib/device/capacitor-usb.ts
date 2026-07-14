import type { NordTransport } from './transport';
import { getCapacitorPlatform, isCapacitorPlatform } from '@/lib/platform';
import { NordUsb } from 'capacitor-nord-usb';
import { base64ToBytes, bytesToBase64 } from './base64';
import { isElectronUsb } from './electron-usb';

/** Why USB transfer is or isn't reachable on this host. */
export type UsbAvailability = 'electron' | 'webusb' | 'ipad-dext-pending' | 'unsupported';

/**
 * Classify the host's USB-transfer reach:
 *   - 'electron'          desktop app — use ElectronUsbTransport (node-usb; can
 *                         detach the kernel driver, so it reaches the pre-WinUSB
 *                         Nords the browser can't claim). Checked FIRST because
 *                         Electron's renderer also exposes navigator.usb.
 *   - 'webusb'            Chromium desktop browser — use WebUsbTransport.
 *   - 'ipad-dext-pending' native iPad — the DriverKit path; gate on nordUsbAvailable().
 *   - 'unsupported'       any other browser/device (iPhone, Safari, etc.).
 */
export function usbAvailability(): UsbAvailability {
  if (isElectronUsb()) return 'electron';
  if (typeof navigator !== 'undefined' && 'usb' in navigator) return 'webusb';
  if (isCapacitorPlatform() && getCapacitorPlatform() === 'ios') return 'ipad-dext-pending';
  return 'unsupported';
}

/**
 * True when a Nord is present and the DriverKit DEXT is reachable (native iPad).
 * Any error/absence (e.g. no DEXT installed) maps to false so the UI degrades to
 * the "coming to iPad" state rather than crashing.
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
  async open(): Promise<void> {
    await NordUsb.open();
  }
  async bulkOut(data: Uint8Array): Promise<void> {
    await NordUsb.bulkOut({ data: bytesToBase64(data) });
  }
  async bulkIn(maxLength: number): Promise<Uint8Array> {
    const { data } = await NordUsb.bulkIn({ maxLength });
    return base64ToBytes(data);
  }
  async close(): Promise<void> {
    await NordUsb.close();
  }
}
