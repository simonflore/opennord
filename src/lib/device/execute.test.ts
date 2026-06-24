import { describe, it, expect } from 'vitest';
import { FakeDevice } from './fake-device';
import { buildOccupancy, planMove, type Plan } from './reorg';
import { executePlan } from './execute';
import type { ProgramEntry } from './transfer';

const PART = 6;
const entry = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'Lead', categoryId: 6, version: 313, sizeBytes: 4, fourcc: 'ns4p', ...over,
});
const file = (n: number) => new Uint8Array(44 + n);

function setup() {
  const src = entry({ bank: 2, slot: 12, name: 'Wurli Soft' });
  const dev = new FakeDevice([{ partition: PART, file: file(4), entry: src }]);
  const occ = buildOccupancy([src]);
  const plan = planMove(occ, { bank: 2, slot: 12 }, { bank: 3, slot: 40 }) as Plan;
  const initial = dev.snapshot();
  return { dev, occ, plan, initial };
}

describe('executePlan', () => {
  it('moves a program: target occupied, source empty', async () => {
    const { dev, occ, plan } = setup();
    const res = await executePlan(dev, PART, plan, occ);
    expect(res.ok).toBe(true);
    expect(await dev.info(PART, { bank: 3, slot: 40 })).not.toBeNull();
    expect(await dev.info(PART, { bank: 2, slot: 12 })).toBeNull();
  });

  it('rolls back to the original state when the copy push fails', async () => {
    const { dev, occ, plan, initial } = setup();
    dev.failNext('push', PART, { bank: 3, slot: 40 });
    const res = await executePlan(dev, PART, plan, occ);
    expect(res.ok).toBe(false);
    expect(res.rolledBack).toBe(true);
    expect([...dev.snapshot()]).toEqual([...initial]); // final == initial
  });

  it('rolls back when the source delete fails (target gets removed again)', async () => {
    const { dev, occ, plan, initial } = setup();
    dev.failNext('delete', PART, { bank: 2, slot: 12 });
    const res = await executePlan(dev, PART, plan, occ);
    expect(res.ok).toBe(false);
    expect([...dev.snapshot()]).toEqual([...initial]);
  });

  it('rolls back on a verify mismatch (truncated push)', async () => {
    const { dev, occ, plan, initial } = setup();
    dev.truncateNextPush();
    const res = await executePlan(dev, PART, plan, occ);
    expect(res.ok).toBe(false);
    expect([...dev.snapshot()]).toEqual([...initial]);
  });

  it('rolls back when cancelled mid-plan', async () => {
    const { dev, occ, plan, initial } = setup();
    const ac = new AbortController();
    const res = await executePlan(dev, PART, plan, occ, {
      signal: ac.signal,
      onProgress: (p) => { if (p.phase === 'copy') ac.abort(); }, // abort before the delete op
    });
    expect(res.ok).toBe(false);
    expect([...dev.snapshot()]).toEqual([...initial]);
  });
});
