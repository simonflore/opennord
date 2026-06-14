import { describe, it, expect } from 'vitest';
import { MockTransport } from './transport';

describe('MockTransport', () => {
  it('records outgoing frames and replays queued replies FIFO', async () => {
    const t = new MockTransport([new Uint8Array([1, 2]), new Uint8Array([3, 4])]);
    await t.open();
    await t.bulkOut(new Uint8Array([0xaa]));
    expect([...(await t.bulkIn(64))]).toEqual([1, 2]);
    expect([...(await t.bulkIn(64))]).toEqual([3, 4]);
    expect(t.sent).toHaveLength(1);
    expect([...t.sent[0]]).toEqual([0xaa]);
    await t.close();
  });

  it('throws if asked for more replies than were queued', async () => {
    const t = new MockTransport([]);
    await expect(t.bulkIn(64)).rejects.toThrow();
  });
});
