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
import { TransportTimeoutError } from './transport';

function setNavigatorUsb(present: boolean) {
  if (present) (navigator as unknown as { usb?: unknown }).usb = {};
  else delete (navigator as unknown as { usb?: unknown }).usb;
}
function setCapacitor(value: unknown) {
  (window as unknown as { Capacitor?: unknown }).Capacitor = value;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks(); // spies (navigator.platform) never leak into the next test
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
  it('is iphone in Safari on an iPhone', () => {
    setNavigatorUsb(false);
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
    expect(usbAvailability()).toBe('iphone');
  });
  it('is iphone in the iOS app on an iPhone', () => {
    setNavigatorUsb(false);
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => 'ios' });
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
    expect(usbAvailability()).toBe('iphone');
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
    open.mockResolvedValue({ productId: 0x2e });
    await new CapacitorUsbTransport().open();
    expect(open).toHaveBeenCalledTimes(1);
  });
  it('identify() reports the product id and open() reuses that open', async () => {
    open.mockResolvedValue({ productId: 0x2e });
    const t = new CapacitorUsbTransport();
    await expect(t.identify()).resolves.toBe(0x2e);
    await t.open();
    expect(open).toHaveBeenCalledTimes(1);
  });
  it('identify() can be retried after a failed open', async () => {
    open.mockRejectedValueOnce(new Error('no Nord')).mockResolvedValue({ productId: 0x2e });
    const t = new CapacitorUsbTransport();
    await expect(t.identify()).rejects.toThrow('no Nord');
    await expect(t.identify()).resolves.toBe(0x2e);
  });
  it('close() lets the next open() reach the plugin again', async () => {
    open.mockResolvedValue({ productId: 0x2e });
    close.mockResolvedValue(undefined);
    const t = new CapacitorUsbTransport();
    await t.open();
    await t.close();
    await t.open();
    expect(open).toHaveBeenCalledTimes(2);
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
    expect(bulkIn).toHaveBeenCalledWith({ maxLength: 16, timeoutMs: undefined });
  });
  it('bulkIn() passes the timeout down and throws TransportTimeoutError when it passes', async () => {
    bulkIn.mockResolvedValue({ data: '', timedOut: true });
    await expect(new CapacitorUsbTransport().bulkIn(16, 250)).rejects.toBeInstanceOf(TransportTimeoutError);
    expect(bulkIn).toHaveBeenCalledWith({ maxLength: 16, timeoutMs: 250 });
  });
  it('close() calls the plugin', async () => {
    close.mockResolvedValue(undefined);
    await new CapacitorUsbTransport().close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
