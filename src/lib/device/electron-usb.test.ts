import { describe, it, expect, afterEach, vi } from 'vitest';
import { ElectronUsbTransport, isElectronUsb, type NordNativeUsb } from './electron-usb';
import { TransportLostError, TransportTimeoutError } from './transport';

function installBridge(over: Partial<NordNativeUsb> = {}) {
  const calls: { bulkOut: string[] } = { bulkOut: [] };
  const bridge: NordNativeUsb = {
    backend: async () => ({ platform: 'win32', usbDkActive: true, usbDkInstalled: true }),
    list: async () => [{ productId: 0x0021, productName: 'Nord Stage 2' }],
    open: vi.fn(async () => {}),
    bulkOut: async (b64) => { calls.bulkOut.push(b64); },
    bulkIn: async () => btoa('\x05\x06'),
    close: vi.fn(async () => {}),
    ...over,
  };
  (globalThis as unknown as { window: Window }).window = { nordNativeUsb: bridge } as unknown as Window;
  return { bridge, calls };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
  vi.restoreAllMocks();
});

describe('isElectronUsb', () => {
  it('is true only when the native bridge is present', () => {
    installBridge();
    expect(isElectronUsb()).toBe(true);
    delete (globalThis as unknown as { window?: unknown }).window;
    expect(isElectronUsb()).toBe(false);
  });
});

describe('ElectronUsbTransport', () => {
  it('passes the selected productId to open()', async () => {
    const { bridge } = installBridge();
    await new ElectronUsbTransport(0x0021).open();
    expect(bridge.open).toHaveBeenCalledWith(0x0021);
  });

  it('marshals bulkOut bytes to base64 and decodes bulkIn back to bytes', async () => {
    const { calls } = installBridge();
    const t = new ElectronUsbTransport();
    await t.bulkOut(new Uint8Array([0x01, 0x02, 0xff]));
    expect(calls.bulkOut[0]).toBe(btoa('\x01\x02\xff'));
    const inBytes = await t.bulkIn(64);
    expect(Array.from(inBytes)).toEqual([0x05, 0x06]);
  });

  it('passes a read timeout to the bridge and maps its timed-out reply to TransportTimeoutError', async () => {
    const bulkIn = vi.fn(async (_max: number, timeoutMs?: number) => (timeoutMs ? null : btoa('\x05')));
    installBridge({ bulkIn });
    const t = new ElectronUsbTransport();
    await expect(t.bulkIn(64, 3000)).rejects.toBeInstanceOf(TransportTimeoutError);
    expect(bulkIn).toHaveBeenCalledWith(64, 3000);
    expect(Array.from(await t.bulkIn(64))).toEqual([0x05]); // no timeout: waits as before
  });

  it('closes via the bridge', async () => {
    const { bridge } = installBridge();
    await new ElectronUsbTransport().close();
    expect(bridge.close).toHaveBeenCalled();
  });

  it('throws a clear error when used outside the desktop app', async () => {
    // no window.nordNativeUsb installed
    await expect(new ElectronUsbTransport().open()).rejects.toThrow(/desktop app/);
  });
});

describe('ElectronUsbTransport.onLost', () => {
  it('reports an unplug when a transfer comes back with the main process’s disconnect error', async () => {
    installBridge({
      bulkIn: async () => { throw new Error("Error invoking remote method 'nord-usb:bulkIn': Error: Your Nord was disconnected."); },
    });
    const t = new ElectronUsbTransport();
    const lost = vi.fn();
    t.onLost(lost);
    await expect(t.bulkIn(64)).rejects.toBeInstanceOf(TransportLostError);
    await expect(t.bulkIn(64)).rejects.toBeInstanceOf(TransportLostError);
    expect(lost).toHaveBeenCalledTimes(1);
  });

  it('does not report an unplug for any other transfer error', async () => {
    installBridge({ bulkOut: async () => { throw new Error('LIBUSB_TRANSFER_STALL'); } });
    const t = new ElectronUsbTransport();
    const lost = vi.fn();
    t.onLost(lost);
    await expect(t.bulkOut(new Uint8Array(1))).rejects.toThrow(/STALL/);
    expect(lost).not.toHaveBeenCalled();
  });
});
