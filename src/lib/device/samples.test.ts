import { describe, it, expect, vi } from 'vitest';
import { enumerateSampleLibrary, pullSample } from './samples';
import { PARTITION_SAMP_LIB } from './opcodes';
import * as transfer from './transfer';
import type { NordSession } from './session';
import type { ProgramEntry } from './transfer';

const entry: ProgramEntry = { bank: 0, slot: 0, name: 'Pad', categoryId: 0, version: 400, sizeBytes: 8, fourcc: 'nsmp' };

/** Fake session whose withSession records the partition and runs the body. */
function fakeSession(): { session: NordSession; partitions: number[] } {
  const partitions: number[] = [];
  const session = {
    withSession: <T,>(partition: number, fn: () => Promise<T>) => { partitions.push(partition); return fn(); },
  } as unknown as NordSession;
  return { session, partitions };
}

describe('enumerateSampleLibrary', () => {
  it('runs enumerateFiles inside the Samp Lib partition', async () => {
    const { session, partitions } = fakeSession();
    vi.spyOn(transfer, 'enumerateFiles').mockResolvedValue([entry]);
    const out = await enumerateSampleLibrary(session);
    expect(out).toEqual([entry]);
    expect(partitions).toEqual([PARTITION_SAMP_LIB]);
  });
});

describe('pullSample', () => {
  it('runs pullFile inside the Samp Lib partition and forwards progress', async () => {
    const { session, partitions } = fakeSession();
    const bytes = new Uint8Array([1, 2, 3]);
    const spy = vi.spyOn(transfer, 'pullFile').mockImplementation(async (_s, _e, onProgress) => {
      onProgress?.(5, 10);
      return bytes;
    });
    const seen: Array<[number, number]> = [];
    const out = await pullSample(session, entry, (d, t) => seen.push([d, t]));
    expect(out).toBe(bytes);
    expect(partitions).toEqual([PARTITION_SAMP_LIB]);
    expect(seen).toEqual([[5, 10]]);
    spy.mockRestore();
  });
});
