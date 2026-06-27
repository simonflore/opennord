import { describe, it, expect } from 'vitest';
import { FakeDevice } from './fake-device';
import { buildOccupancy, planMove, planSwap, planArrange, type Plan } from './reorg';
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

  it('surfaces the trigger error in warnings, not just rollback failures', async () => {
    const { dev, occ, plan, initial } = setup();
    dev.failNext('push', PART, { bank: 3, slot: 40 });
    const res = await executePlan(dev, PART, plan, occ);
    expect(res.ok).toBe(false);
    expect(res.rolledBack).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings.some((w) => /fake push failure/i.test(w))).toBe(true);
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

  it('executes a swap: the two programs end exchanged', async () => {
    const a = entry({ bank: 2, slot: 12, name: 'Wurli' });
    const b = entry({ bank: 2, slot: 20, name: 'Beat' });
    const dev = new FakeDevice([
      { partition: PART, file: file(4), entry: a },
      { partition: PART, file: file(6), entry: b },
    ]);
    const occ = buildOccupancy([a, b]);
    const plan = planSwap(occ, { bank: 2, slot: 12 }, { bank: 2, slot: 20 }) as Plan;
    const res = await executePlan(dev, PART, plan, occ);
    expect(res.ok).toBe(true);
    expect((await dev.info(PART, { bank: 2, slot: 12 }))?.name).toBe('Beat');   // a now holds B
    expect((await dev.info(PART, { bank: 2, slot: 20 }))?.name).toBe('Wurli');  // b now holds A
  });

  it('rolls a failed swap back to the original layout', async () => {
    const a = entry({ bank: 2, slot: 12, name: 'Wurli' });
    const b = entry({ bank: 2, slot: 20, name: 'Beat' });
    const dev = new FakeDevice([
      { partition: PART, file: file(4), entry: a },
      { partition: PART, file: file(6), entry: b },
    ]);
    const initial = dev.snapshot();
    dev.failNext('push', PART, { bank: 2, slot: 12 }); // second copy (b→a) fails
    const occ = buildOccupancy([a, b]);
    const res = await executePlan(dev, PART, planSwap(occ, { bank: 2, slot: 12 }, { bank: 2, slot: 20 }) as Plan, occ);
    expect(res.ok).toBe(false);
    expect([...dev.snapshot()]).toEqual([...initial]); // both slots restored
  });

  it('executes a batch sort: programs end alphabetized at the top, tail cleared', async () => {
    const z = entry({ bank: 2, slot: 0, name: 'Zeta' });
    const a = entry({ bank: 2, slot: 1, name: 'Alpha' });
    const m = entry({ bank: 2, slot: 5, name: 'Mid' });
    const dev = new FakeDevice([
      { partition: PART, file: file(4), entry: z },
      { partition: PART, file: file(5), entry: a },
      { partition: PART, file: file(6), entry: m },
    ]);
    const occ = buildOccupancy([z, a, m]);
    const res = await executePlan(dev, PART, planArrange(occ, 2, 'name') as Plan, occ);
    expect(res.ok).toBe(true);
    expect((await dev.info(PART, { bank: 2, slot: 0 }))?.name).toBe('Alpha');
    expect((await dev.info(PART, { bank: 2, slot: 1 }))?.name).toBe('Mid');
    expect((await dev.info(PART, { bank: 2, slot: 2 }))?.name).toBe('Zeta');
    expect(await dev.info(PART, { bank: 2, slot: 5 })).toBeNull(); // vacated tail cleared
  });

  it('rolls a failed batch sort back to the original layout', async () => {
    const z = entry({ bank: 2, slot: 0, name: 'Zeta' });
    const a = entry({ bank: 2, slot: 1, name: 'Alpha' });
    const m = entry({ bank: 2, slot: 5, name: 'Mid' });
    const dev = new FakeDevice([
      { partition: PART, file: file(4), entry: z },
      { partition: PART, file: file(5), entry: a },
      { partition: PART, file: file(6), entry: m },
    ]);
    const initial = dev.snapshot();
    dev.failNext('push', PART, { bank: 2, slot: 2 }); // third copy (Zeta→slot2) fails
    const occ = buildOccupancy([z, a, m]);
    const res = await executePlan(dev, PART, planArrange(occ, 2, 'name') as Plan, occ);
    expect(res.ok).toBe(false);
    expect(res.rolledBack).toBe(true);
    expect([...dev.snapshot()]).toEqual([...initial]); // whole bank restored
  });
});
