// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const open = vi.fn();
const bulkOut = vi.fn();
const bulkIn = vi.fn();
const close = vi.fn();
const isAvailable = vi.fn();

vi.mock('capacitor-nord-usb', () => ({
  NordUsb: {
    open: (...a: unknown[]) => open(...a),
    bulkOut: (...a: unknown[]) => bulkOut(...a),
    bulkIn: (...a: unknown[]) => bulkIn(...a),
    close: (...a: unknown[]) => close(...a),
    isAvailable: (...a: unknown[]) => isAvailable(...a),
  },
}));

import { CapacitorUsbTransport, nordUsbAvailable, usbAvailability } from './capacitor-usb';
import { bytesToBase64 } from './base64';

function setNavigatorUsb(present: boolean) {
  if (present) (navigator as unknown as { usb?: unknown }).usb = {};
  else delete (navigator as unknown as { usb?: unknown }).usb;
}
function setCapacitor(value: unknown) {
  (window as unknown as { Capacitor?: unknown }).Capacitor = value;
}

afterEach(() => {
  vi.clearAllMocks();
  setNavigatorUsb(false);
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

describe('usbAvailability', () => {
  it('is webusb when navigator.usb exists', () => {
    setNavigatorUsb(true);
    expect(usbAvailability()).toBe('webusb');
  });
  it('is ipad-dext-pending on native iOS without WebUSB', () => {
    setNavigatorUsb(false);
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'ios' });
    expect(usbAvailability()).toBe('ipad-dext-pending');
  });
  it('is unsupported on a plain browser without WebUSB', () => {
    setNavigatorUsb(false);
    expect(usbAvailability()).toBe('unsupported');
  });
});

describe('nordUsbAvailable', () => {
  it('maps the native availability through', async () => {
    isAvailable.mockResolvedValue({ available: true });
    await expect(nordUsbAvailable()).resolves.toBe(true);
  });
  it('swallows a throwing/absent plugin to false', async () => {
    isAvailable.mockRejectedValue(new Error('no plugin'));
    await expect(nordUsbAvailable()).resolves.toBe(false);
  });
});

describe('CapacitorUsbTransport', () => {
  it('open() calls the plugin', async () => {
    open.mockResolvedValue(undefined);
    await new CapacitorUsbTransport().open();
    expect(open).toHaveBeenCalledTimes(1);
  });
  it('bulkOut() base64-encodes the exact bytes', async () => {
    bulkOut.mockResolvedValue(undefined);
    const bytes = new Uint8Array([0x00, 0x0c, 0xff]);
    await new CapacitorUsbTransport().bulkOut(bytes);
    expect(bulkOut).toHaveBeenCalledWith({ data: bytesToBase64(bytes) });
  });
  it('bulkIn() decodes the reply to the exact bytes', async () => {
    bulkIn.mockResolvedValue({ data: bytesToBase64(new Uint8Array([1, 2, 3])) });
    const out = await new CapacitorUsbTransport().bulkIn(16);
    expect(Array.from(out)).toEqual([1, 2, 3]);
    expect(bulkIn).toHaveBeenCalledWith({ maxLength: 16 });
  });
  it('close() calls the plugin', async () => {
    close.mockResolvedValue(undefined);
    await new CapacitorUsbTransport().close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
