import { describe, it, expect } from 'vitest';
import { isPlayerFacing } from '../src/lib/device/player-message';
import { isWinUsbBound, openFailure, scReportsRunning, shouldUseUsbDk } from './usb-backend';

const STAGE_2 = 0x21;
const STAGE_4 = 0x2e;

describe('Windows USB backend choice', () => {
  it('knows which Nords Windows binds to WinUSB (ClaviaWinUSB.inf)', () => {
    expect([0x23, 0x24, 0x2e, 0x2f, 0x37, 0x38, 0x3f, 0x40].map(isWinUsbBound))
      .toEqual([false, true, true, false, false, true, true, false]);
  });

  it('uses UsbDk only on Windows, only when installed and not turned off', () => {
    expect(shouldUseUsbDk({ platform: 'win32', usbDkInstalled: true, skipUsbDk: false })).toBe(true);
    expect(shouldUseUsbDk({ platform: 'win32', usbDkInstalled: false, skipUsbDk: false })).toBe(false);
    expect(shouldUseUsbDk({ platform: 'win32', usbDkInstalled: true, skipUsbDk: true })).toBe(false);
    expect(shouldUseUsbDk({ platform: 'darwin', usbDkInstalled: true, skipUsbDk: false })).toBe(false);
  });

  it('turns UsbDk off when it fails on a Nord that doesn’t need it', () => {
    const f = openFailure({ platform: 'win32', usingUsbDk: true, productId: STAGE_4, error: 'LIBUSB_ERROR_OTHER' });
    expect(f?.skipUsbDkNextTime).toBe(true);
    expect(f?.message).toMatch(/^Your Nord connects without the UsbDk driver/);
  });

  it('explains a UsbDk failure on a Nord that needs it', () => {
    const f = openFailure({ platform: 'win32', usingUsbDk: true, productId: STAGE_2, error: 'LIBUSB_ERROR_OTHER' });
    expect(f?.skipUsbDkNextTime).toBe(false);
    expect(f?.message).toMatch(/Quit Nord Sound Manager.*restart Windows.*Memory Integrity/);
  });

  it('says to restart Windows when UsbDk is installed but not running', () => {
    const f = openFailure({ platform: 'win32', usingUsbDk: true, productId: STAGE_2, error: 'LIBUSB_ERROR_OTHER', usbDkRunning: false });
    expect(f?.message).toMatch(/^The UsbDk driver is installed but isn’t running.*Restart Windows.*Memory Integrity/);
  });

  it('asks for UsbDk when an older Nord fails without it', () => {
    const f = openFailure({ platform: 'win32', usingUsbDk: false, productId: STAGE_2, error: 'LIBUSB_ERROR_NOT_SUPPORTED' });
    expect(f?.message).toMatch(/^This Nord needs the free UsbDk driver/);
  });

  it('says another program holds the Nord, and passes other errors on', () => {
    expect(openFailure({ platform: 'win32', usingUsbDk: false, productId: STAGE_4, error: 'LIBUSB_ERROR_ACCESS' })?.message)
      .toMatch(/^Another program is using your Nord/);
    expect(openFailure({ platform: 'win32', usingUsbDk: false, productId: STAGE_4, error: 'LIBUSB_ERROR_PIPE' })).toBeNull();
    expect(openFailure({ platform: 'darwin', usingUsbDk: false, productId: STAGE_2, error: 'LIBUSB_ERROR_OTHER' })).toBeNull();
  });

  it('turns UsbDk back on when an older Nord needs it and it was switched off', () => {
    const f = openFailure({ platform: 'win32', usingUsbDk: false, usbDkSkipped: true, productId: STAGE_2, error: 'LIBUSB_ERROR_NOT_SUPPORTED' });
    expect(f?.useUsbDkNextTime).toBe(true);
    expect(f?.skipUsbDkNextTime).toBe(false);
    expect(f?.message).toMatch(/^This Nord needs the UsbDk driver.*switched it back on.*Quit OpenNord/);
    // Without the switch-off, the same failure still says to install it.
    const g = openFailure({ platform: 'win32', usingUsbDk: false, usbDkSkipped: false, productId: STAGE_2, error: 'LIBUSB_ERROR_NOT_SUPPORTED' });
    expect(g?.useUsbDkNextTime).toBeFalsy();
    expect(g?.message).toMatch(/Install UsbDk/);
  });

  it('every failure it words is one the Connect screen shows as it is', () => {
    const cases = [
      { usingUsbDk: true, productId: STAGE_4, error: 'LIBUSB_ERROR_OTHER' },
      { usingUsbDk: true, productId: STAGE_2, error: 'LIBUSB_ERROR_OTHER' },
      { usingUsbDk: true, productId: STAGE_2, error: 'LIBUSB_ERROR_OTHER', usbDkRunning: false },
      { usingUsbDk: false, productId: STAGE_2, error: 'LIBUSB_ERROR_NOT_SUPPORTED' },
      { usingUsbDk: false, usbDkSkipped: true, productId: STAGE_2, error: 'LIBUSB_ERROR_NOT_SUPPORTED' },
      { usingUsbDk: false, productId: STAGE_4, error: 'LIBUSB_ERROR_ACCESS' },
    ];
    for (const c of cases) {
      const f = openFailure({ platform: 'win32', ...c });
      expect(f, JSON.stringify(c)).not.toBeNull();
      expect(isPlayerFacing(f!.message), f!.message).toBe(true);
    }
  });
});

describe('UsbDk service state, from `sc query UsbDk`', () => {
  const english = 'SERVICE_NAME: UsbDk\r\n        TYPE               : 1  KERNEL_DRIVER\r\n        STATE              : 4  RUNNING\r\n';
  it('reads a running service', () => {
    expect(scReportsRunning(english)).toBe(true);
  });
  it('reads it on a Windows in another language, where the label is translated', () => {
    expect(scReportsRunning(english.replace('STATE ', 'ÉTAT  '))).toBe(true);
    expect(scReportsRunning(english.replace('STATE ', 'STATUS'))).toBe(true);
    expect(scReportsRunning(english.replace('STATE ', 'ESTADO'))).toBe(true);
  });
  it('reads a stopped service as not running', () => {
    expect(scReportsRunning(english.replace('4  RUNNING', '1  STOPPED'))).toBe(false);
  });
  it('is not fooled by the type line, which also ends in a number and a word', () => {
    expect(scReportsRunning('        TYPE               : 4  RUNNING_LOOKALIKE\r\n        STATE              : 1  STOPPED\r\n')).toBe(false);
  });
});
