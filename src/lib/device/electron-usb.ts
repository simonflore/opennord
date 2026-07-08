import type { NordTransport } from './transport';

/**
 * The USB bridge the Electron preload exposes on `window.nordNativeUsb`
 * (contextBridge). The main process backs it with node-usb (libusb), which —
 * unlike WebUSB — can detach a kernel driver and claim the interface. That's the
 * whole reason the desktop app exists: it connects the pre-WinUSB Nords (product
 * id < 0x0024, e.g. Stage 2) that the browser cannot claim.
 *
 * Bytes cross the IPC boundary as base64 (same marshaling as the iPad bridge),
 * so the contract stays JSON-serialisable and identical in shape to the other
 * native transport.
 */
export interface NordNativeUsb {
  /** USB backend status — on Windows, `usbDkActive` false means UsbDk isn't
   *  installed, so pre-WinUSB Nords (e.g. Stage 2) still can't be claimed. */
  backend(): Promise<{ platform: string; usbDkActive: boolean }>;
  /** List connected Nord devices (USB vendor 0x0FFC). */
  list(): Promise<Array<{ productId: number; productName?: string }>>;
  /** Open + (detach kernel driver) + claim the vendor bulk interface. */
  open(productId?: number): Promise<void>;
  /** Bulk OUT — `dataB64` is base64-encoded bytes. */
  bulkOut(dataB64: string): Promise<void>;
  /** Bulk IN — returns base64-encoded bytes. */
  bulkIn(maxLength: number): Promise<string>;
  /** Release + close. */
  close(): Promise<void>;
}

declare global {
  interface Window {
    nordNativeUsb?: NordNativeUsb;
  }
}

/** True when running inside the Electron shell (preload bridge is present). */
export function isElectronUsb(): boolean {
  return typeof window !== 'undefined' && !!window.nordNativeUsb;
}

/** Base64 → bytes (shared with the iPad path's marshaling shape). */
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Bytes → base64. */
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Desktop USB transport: delegates the four-method NordTransport seam to the
 * Electron main process (node-usb / libusb) over the preload bridge. Everything
 * above this seam is reused unchanged, exactly like the iPad transport.
 */
export class ElectronUsbTransport implements NordTransport {
  constructor(private readonly productId?: number) {}

  private get bridge(): NordNativeUsb {
    const b = typeof window !== 'undefined' ? window.nordNativeUsb : undefined;
    if (!b) throw new Error('Native USB bridge not available (not running in the desktop app).');
    return b;
  }

  async open(): Promise<void> {
    await this.bridge.open(this.productId);
  }
  async bulkOut(data: Uint8Array): Promise<void> {
    await this.bridge.bulkOut(bytesToB64(data));
  }
  async bulkIn(maxLength: number): Promise<Uint8Array> {
    return b64ToBytes(await this.bridge.bulkIn(maxLength));
  }
  async close(): Promise<void> {
    await this.bridge.close();
  }
}
