import { describe, it, expect, afterEach, vi } from 'vitest';
import { WebUsbTransport } from './webusb';
import { TransportTimeoutError } from './transport';

/** A USBDevice whose reads stay pending until `answer` (or an interface release aborts them). */
function fakeDevice() {
  const calls: string[] = [];
  let pending: { resolve: (r: USBInTransferResult) => void; reject: (e: Error) => void } | undefined;
  const device = {
    transferIn: vi.fn(() => new Promise<USBInTransferResult>((resolve, reject) => { pending = { resolve, reject }; })),
    releaseInterface: vi.fn(async () => {
      calls.push('release');
      pending?.reject(new Error('AbortError: the transfer was cancelled')); // WebUSB aborts pending transfers
    }),
    claimInterface: vi.fn(async () => { calls.push('claim'); }),
  };
  const answer = (bytes: number[]) =>
    pending?.resolve({ data: new DataView(new Uint8Array(bytes).buffer), status: 'ok' } as USBInTransferResult);
  return { device: device as unknown as USBDevice, calls, answer };
}

afterEach(() => { vi.useRealTimers(); });

describe('WebUsbTransport.bulkIn with a timeout', () => {
  it('returns the reply when it arrives in time, leaving the interface alone', async () => {
    vi.useFakeTimers();
    const { device, calls, answer } = fakeDevice();
    const read = new WebUsbTransport(device).bulkIn(64, 1000);
    answer([0x05, 0x06]);
    expect(Array.from(await read)).toEqual([0x05, 0x06]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls).toEqual([]);
  });

  it('times out a silent read, aborting it (release + reclaim) so it cannot swallow the next reply', async () => {
    vi.useFakeTimers();
    const { device, calls } = fakeDevice();
    const read = new WebUsbTransport(device).bulkIn(64, 1000);
    const outcome = expect(read).rejects.toBeInstanceOf(TransportTimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await outcome;
    expect(calls).toEqual(['release', 'claim']);
  });

  it('waits indefinitely without a timeout, as before', async () => {
    vi.useFakeTimers();
    const { device, calls, answer } = fakeDevice();
    const read = new WebUsbTransport(device).bulkIn(64);
    await vi.advanceTimersByTimeAsync(60_000);
    answer([0x07]);
    expect(Array.from(await read)).toEqual([0x07]);
    expect(calls).toEqual([]);
  });
});

describe('WebUsbTransport.onLost', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('reports this device being unplugged, once, and no other device', () => {
    const listeners = new Set<(e: USBConnectionEvent) => void>();
    vi.stubGlobal('navigator', { usb: {
      addEventListener: (_: string, l: (e: USBConnectionEvent) => void) => listeners.add(l),
      removeEventListener: (_: string, l: (e: USBConnectionEvent) => void) => listeners.delete(l),
    } });
    const unplug = (device: USBDevice) => [...listeners].forEach((l) => l({ device } as USBConnectionEvent));
    const { device } = fakeDevice();
    const lost = vi.fn();
    new WebUsbTransport(device).onLost(lost);

    unplug(fakeDevice().device); // some other USB device
    expect(lost).not.toHaveBeenCalled();
    unplug(device);
    unplug(device);
    expect(lost).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  });
});

describe('WebUsbTransport transfers that fail', () => {
  it('reports a NetworkError as the Nord being gone, and passes any other error on', async () => {
    const { TransportLostError } = await import('./transport');
    const failing = (error: Error) => new WebUsbTransport({
      transferOut: vi.fn().mockRejectedValue(error),
      transferIn: vi.fn().mockRejectedValue(error),
    } as unknown as USBDevice);
    const gone = failing(new DOMException('A transfer error has occurred.', 'NetworkError'));
    await expect(gone.bulkOut(new Uint8Array(1))).rejects.toBeInstanceOf(TransportLostError);
    await expect(gone.bulkIn(64)).rejects.toBeInstanceOf(TransportLostError);
    await expect(failing(new DOMException('stalled', 'InvalidStateError')).bulkIn(64)).rejects.toThrow('stalled');
  });
});
