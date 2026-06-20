// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  CapacitorUsbTransport,
  TransportUnavailableError,
  usbAvailability,
} from './capacitor-usb';

function setNavigatorUsb(present: boolean) {
  if (present) (navigator as unknown as { usb?: unknown }).usb = {};
  else delete (navigator as unknown as { usb?: unknown }).usb;
}
function setCapacitor(value: unknown) {
  (window as unknown as { Capacitor?: unknown }).Capacitor = value;
}

afterEach(() => {
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

describe('CapacitorUsbTransport', () => {
  it('throws the pending error from open()', async () => {
    const t = new CapacitorUsbTransport();
    await expect(t.open()).rejects.toBeInstanceOf(TransportUnavailableError);
  });

  it('throws the pending error from bulkOut()', async () => {
    const t = new CapacitorUsbTransport();
    await expect(t.bulkOut(new Uint8Array([1]))).rejects.toMatchObject({
      reason: 'ipad-dext-pending',
    });
  });

  it('close() resolves quietly', async () => {
    await expect(new CapacitorUsbTransport().close()).resolves.toBeUndefined();
  });
});
