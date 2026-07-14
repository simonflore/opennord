import { describe, it, expect } from 'vitest';
import { FakeDevice } from './fake-device';
import type { ProgramEntry } from './transfer';

const entry = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'Lead', categoryId: 6, version: 313, sizeBytes: 4, fourcc: 'ns4p', ...over,
});
const file = (n: number) => new Uint8Array(44 + n); // 44-byte header + n body bytes

describe('FakeDevice', () => {
  it('pulls, pushes, deletes, and reports info', async () => {
    const dev = new FakeDevice([{ partition: 6, file: file(4), entry: entry({ bank: 2, slot: 12 }) }]);
    expect((await dev.info(6, { bank: 2, slot: 12 }))?.sizeBytes).toBe(4);
    expect(await dev.info(6, { bank: 3, slot: 40 })).toBeNull();

    const bytes = await dev.pull(6, entry({ bank: 2, slot: 12 }));
    await dev.push(6, { bank: 3, slot: 40 }, bytes, 'Wurli Soft');
    expect((await dev.info(6, { bank: 3, slot: 40 }))?.name).toBe('Wurli Soft');

    await dev.delete(6, { bank: 2, slot: 12 });
    expect(await dev.info(6, { bank: 2, slot: 12 })).toBeNull();
  });

  it('throws a scheduled failure exactly once', async () => {
    const dev = new FakeDevice([{ partition: 6, file: file(4), entry: entry({ bank: 2, slot: 12 }) }]);
    dev.failNext('push', 6, { bank: 3, slot: 40 });
    await expect(dev.push(6, { bank: 3, slot: 40 }, file(4), 'x')).rejects.toThrow();
    await dev.push(6, { bank: 3, slot: 40 }, file(4), 'x'); // second time succeeds
    expect(await dev.info(6, { bank: 3, slot: 40 })).not.toBeNull();
  });
});
