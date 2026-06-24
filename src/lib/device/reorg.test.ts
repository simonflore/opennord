import { describe, it, expect } from 'vitest';
import { buildOccupancy, planMove, isPlanError, addrKey } from './reorg';
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
