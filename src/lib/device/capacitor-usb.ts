import type { NordTransport } from './transport';
import { getCapacitorPlatform, isCapacitorPlatform } from '@/lib/platform';

/** Thrown by the iPad transport until the Phase B DriverKit bridge exists. */
export class TransportUnavailableError extends Error {
  constructor(public readonly reason: 'ipad-dext-pending') {
    super(`Nord USB transport unavailable: ${reason}`);
    this.name = 'TransportUnavailableError';
  }
}

/** Why USB transfer is or isn't reachable on this host. */
export type UsbAvailability = 'webusb' | 'ipad-dext-pending' | 'unsupported';

/**
 * Classify the host's USB-transfer reach:
 *   - 'webusb'            Chromium desktop — use WebUsbTransport.
 *   - 'ipad-dext-pending' native iPad — the DriverKit path lands in Phase B.
 *   - 'unsupported'       any other browser/device (iPhone, Safari, etc.).
 */
export function usbAvailability(): UsbAvailability {
  if (typeof navigator !== 'undefined' && 'usb' in navigator) return 'webusb';
  if (isCapacitorPlatform() && getCapacitorPlatform() === 'ios') return 'ipad-dext-pending';
  return 'unsupported';
}

/**
 * iPad USB transport. Phase B fills these with the native Capacitor plugin →
 * IOKit → DriverKit DEXT bridge (see docs/IPAD.md). Until then every I/O method
 * reports the pending state so the UI can explain it rather than crash.
 */
export class CapacitorUsbTransport implements NordTransport {
  async open(): Promise<void> {
    throw new TransportUnavailableError('ipad-dext-pending');
  }
  async bulkOut(_data: Uint8Array): Promise<void> {
    throw new TransportUnavailableError('ipad-dext-pending');
  }
  async bulkIn(_maxLength: number): Promise<Uint8Array> {
    throw new TransportUnavailableError('ipad-dext-pending');
  }
  async close(): Promise<void> {}
}
