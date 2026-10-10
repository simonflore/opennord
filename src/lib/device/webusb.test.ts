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
