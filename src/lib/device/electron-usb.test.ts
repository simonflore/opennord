import { describe, it, expect, afterEach, vi } from 'vitest';
import { ElectronUsbTransport, isElectronUsb, type NordNativeUsb } from './electron-usb';

function installBridge(over: Partial<NordNativeUsb> = {}) {
  const calls: { bulkOut: string[] } = { bulkOut: [] };
  const bridge: NordNativeUsb = {
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
