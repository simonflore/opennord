import { describe, it, expect } from 'vitest';
import { buildOccupancy, planMove, planSwap, planReorg, isPlanError, addrKey } from './reorg';
import type { ProgramEntry } from './transfer';

const entry = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'Lead', categoryId: 6, version: 313, sizeBytes: 600, fourcc: 'ns4p', ...over,
});

describe('planMove', () => {
  const occ = buildOccupancy([entry({ bank: 2, slot: 12, name: 'Wurli Soft' })]);

  it('plans copy-then-delete for a move to an empty slot', () => {
    const p = planMove(occ, { bank: 2, slot: 12 }, { bank: 3, slot: 40 });
    expect(isPlanError(p)).toBe(false);
    if (isPlanError(p)) return;
    expect(p.ops).toEqual([
      { kind: 'copy', from: { bank: 2, slot: 12 }, to: { bank: 3, slot: 40 } },
      { kind: 'delete', at: { bank: 2, slot: 12 } },
    ]);
    expect(p.journalSlots.map(addrKey).sort()).toEqual(['2:12', '3:40']);
    expect(p.summary).toContain('Wurli Soft');
    expect(p.summary).toContain('C:25'); // formatSlot(2,12)
    expect(p.summary).toContain('D:61'); // formatSlot(3,40)
  });

  it('rejects an empty source slot', () => {
    const p = planMove(occ, { bank: 5, slot: 0 }, { bank: 3, slot: 40 });
    expect(isPlanError(p) && p.error).toMatch(/no program/i);
  });

  it('rejects an occupied target slot', () => {
    const occ2 = buildOccupancy([entry({ bank: 2, slot: 12 }), entry({ bank: 3, slot: 40 })]);
    const p = planMove(occ2, { bank: 2, slot: 12 }, { bank: 3, slot: 40 });
    expect(isPlanError(p) && p.error).toMatch(/occupied/i);
  });

  it('rejects a no-op move onto itself', () => {
    const p = planMove(occ, { bank: 2, slot: 12 }, { bank: 2, slot: 12 });
    expect(isPlanError(p) && p.error).toMatch(/same/i);
  });
});

describe('planSwap', () => {
  const occ = buildOccupancy([entry({ bank: 2, slot: 12, name: 'Wurli' }), entry({ bank: 2, slot: 20, name: 'Beat' })]);
  it('plans two journaled copies to swap two occupied slots', () => {
    const p = planSwap(occ, { bank: 2, slot: 12 }, { bank: 2, slot: 20 });
    expect(isPlanError(p)).toBe(false);
    if (isPlanError(p)) return;
    expect(p.ops).toEqual([
      { kind: 'copy', from: { bank: 2, slot: 12 }, to: { bank: 2, slot: 20 } },
      { kind: 'copy', from: { bank: 2, slot: 20 }, to: { bank: 2, slot: 12 } },
    ]);
    expect(p.journalSlots.map(addrKey).sort()).toEqual(['2:12', '2:20']);
    expect(p.title).toBe('Swap programs');
    expect(p.summary).toContain('Wurli');
    expect(p.summary).toContain('Beat');
  });
  it('rejects swapping a slot with itself', () => {
    expect(isPlanError(planSwap(occ, { bank: 2, slot: 12 }, { bank: 2, slot: 12 })) && true).toBe(true);
  });
  it('rejects a swap where a slot is empty', () => {
    const p = planSwap(occ, { bank: 2, slot: 12 }, { bank: 5, slot: 0 });
    expect(isPlanError(p) && p.error).toMatch(/both slots/i);
  });
});

describe('planReorg dispatch', () => {
  const occ = buildOccupancy([entry({ bank: 0, slot: 0, name: 'A' }), entry({ bank: 0, slot: 1, name: 'B' })]);
  it('moves into an empty target', () => {
    const p = planReorg(occ, { bank: 0, slot: 0 }, { bank: 0, slot: 5 });
    expect(isPlanError(p)).toBe(false);
    if (!isPlanError(p)) expect(p.title).toBe('Move program');
  });
  it('swaps onto an occupied target', () => {
    const p = planReorg(occ, { bank: 0, slot: 0 }, { bank: 0, slot: 1 });
    expect(isPlanError(p)).toBe(false);
    if (!isPlanError(p)) expect(p.title).toBe('Swap programs');
  });
  it('rejects a drop on itself', () => {
    expect(isPlanError(planReorg(occ, { bank: 0, slot: 0 }, { bank: 0, slot: 0 })) && true).toBe(true);
  });
});
