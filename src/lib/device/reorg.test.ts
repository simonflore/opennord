import { describe, it, expect } from 'vitest';
import { buildOccupancy, planMove, planSwap, planReorg, isPlanError, addrKey, planArrange, planInsert, type Plan } from './reorg';
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

describe('planArrange', () => {
  const prog = (bank: number, slot: number, name: string): ProgramEntry => ({
    bank, slot, name, categoryId: 0, version: 313, sizeBytes: 100, fourcc: 'ns4p',
  });
  const occOf = (...e: ProgramEntry[]) => buildOccupancy(e);

  it('sorts a bank alphabetically: copies each program to its sorted index + deletes the vacated tail', () => {
    // slots 0,1,5 = Zeta, Alpha, Mid → sorted Alpha,Mid,Zeta at 0,1,2
    const p = planArrange(occOf(prog(2, 0, 'Zeta'), prog(2, 1, 'Alpha'), prog(2, 5, 'Mid')), 2, 'name');
    expect(isPlanError(p)).toBe(false);
    const plan = p as Plan;
    expect(plan.title).toBe('Sort bank A–Z');
    expect(plan.bulk).toBe(true); // mass rearrange → always confirms + MIDI advisory
    // Alpha 1→0, Mid 5→1, Zeta 0→2 ; delete original slot 5 (>= n=3)
    expect(plan.ops).toEqual([
      { kind: 'copy', from: { bank: 2, slot: 1 }, to: { bank: 2, slot: 0 } },
      { kind: 'copy', from: { bank: 2, slot: 5 }, to: { bank: 2, slot: 1 } },
      { kind: 'copy', from: { bank: 2, slot: 0 }, to: { bank: 2, slot: 2 } },
      { kind: 'delete', at: { bank: 2, slot: 5 } },
    ]);
  });

  it('compact preserves order and pulls programs up, removing gaps', () => {
    // slots 2,5,9 = B,A,C → compact keeps slot order (B,A,C) at 0,1,2
    const plan = planArrange(occOf(prog(0, 2, 'B'), prog(0, 5, 'A'), prog(0, 9, 'C')), 0, 'compact') as Plan;
    expect(plan.title).toBe('Compact bank');
    expect(plan.ops).toEqual([
      { kind: 'copy', from: { bank: 0, slot: 2 }, to: { bank: 0, slot: 0 } },
      { kind: 'copy', from: { bank: 0, slot: 5 }, to: { bank: 0, slot: 1 } },
      { kind: 'copy', from: { bank: 0, slot: 9 }, to: { bank: 0, slot: 2 } },
      { kind: 'delete', at: { bank: 0, slot: 5 } },
      { kind: 'delete', at: { bank: 0, slot: 9 } },
    ]);
  });

  it('every copy source is journaled (no "not journaled" gap)', () => {
    const plan = planArrange(occOf(prog(1, 0, 'Z'), prog(1, 1, 'A'), prog(1, 7, 'M')), 1, 'name') as Plan;
    const keys = new Set(plan.journalSlots.map(addrKey));
    for (const op of plan.ops) if (op.kind === 'copy') expect(keys.has(addrKey(op.from))).toBe(true);
  });

  it('returns a PlanError when the bank has fewer than two programs', () => {
    expect(planArrange(occOf(prog(0, 3, 'Solo')), 0, 'name')).toEqual({ error: 'Nothing to arrange in this bank.' });
  });

  it('returns a PlanError when the bank is already arranged', () => {
    expect(planArrange(occOf(prog(0, 0, 'A'), prog(0, 1, 'B')), 0, 'name'))
      .toEqual({ error: 'This bank is already arranged.' });
  });
});

describe('planInsert', () => {
  const prog = (bank: number, slot: number, name: string): ProgramEntry => ({
    bank, slot, name, categoryId: 0, version: 313, sizeBytes: 100, fourcc: 'ns4p',
  });
  const occOf = (...e: ProgramEntry[]) => buildOccupancy(e);

  it('inserts earlier into a full run — a clean rotation, no slot freed', () => {
    // A1 P1, A2 P2, A3 P3, A4 P4, A5 X ; insert X(slot4) at slot1
    const p = planInsert(occOf(prog(0,0,'P1'),prog(0,1,'P2'),prog(0,2,'P3'),prog(0,3,'P4'),prog(0,4,'X')),
      { bank:0, slot:4 }, { bank:0, slot:1 }) as Plan;
    expect(p.title).toBe('Insert program');
    expect(p.bulk).toBe(true);
    // shifts P2,P3,P4 down one, X→slot1, no delete (rotation)
    expect(p.ops).toEqual([
      { kind:'copy', from:{bank:0,slot:3}, to:{bank:0,slot:4} },
      { kind:'copy', from:{bank:0,slot:2}, to:{bank:0,slot:3} },
      { kind:'copy', from:{bank:0,slot:1}, to:{bank:0,slot:2} },
      { kind:'copy', from:{bank:0,slot:4}, to:{bank:0,slot:1} },
    ]);
  });

  it('inserts earlier with an internal gap — ripple stops at the gap, source freed', () => {
    // A1 P1, A2 P2, A3 empty, A4 P4, A5 X ; insert X(slot4) at slot1
    const p = planInsert(occOf(prog(0,0,'P1'),prog(0,1,'P2'),prog(0,3,'P4'),prog(0,4,'X')),
      { bank:0, slot:4 }, { bank:0, slot:1 }) as Plan;
    expect(p.ops).toEqual([
      { kind:'copy', from:{bank:0,slot:1}, to:{bank:0,slot:2} }, // P2 fills the gap at slot2
      { kind:'copy', from:{bank:0,slot:4}, to:{bank:0,slot:1} }, // X → slot1
      { kind:'delete', at:{bank:0,slot:4} },                      // X's old slot freed
    ]);
  });

  it('inserts later — symmetric ripple toward the source', () => {
    // A1 P1, A2 X, A3 P3, A4 P4, A5 P5 ; insert X(slot1) at slot3
    const p = planInsert(occOf(prog(0,0,'P1'),prog(0,1,'X'),prog(0,2,'P3'),prog(0,3,'P4'),prog(0,4,'P5')),
      { bank:0, slot:1 }, { bank:0, slot:3 }) as Plan;
    expect(p.ops).toEqual([
      { kind:'copy', from:{bank:0,slot:2}, to:{bank:0,slot:1} },
      { kind:'copy', from:{bank:0,slot:3}, to:{bank:0,slot:2} },
      { kind:'copy', from:{bank:0,slot:1}, to:{bank:0,slot:3} },
    ]);
    expect(p.bulk).toBe(true);
  });

  it('dropping onto an empty slot is a plain move (not bulk)', () => {
    const p = planInsert(occOf(prog(0,0,'X')), { bank:0, slot:0 }, { bank:0, slot:5 }) as Plan;
    expect(p.title).toBe('Move program');
    expect(p.bulk).toBeFalsy();
  });

  it('every copy source is journaled', () => {
    const p = planInsert(occOf(prog(0,0,'P1'),prog(0,1,'P2'),prog(0,2,'X')),
      { bank:0, slot:2 }, { bank:0, slot:0 }) as Plan;
    const keys = new Set(p.journalSlots.map(addrKey));
    for (const op of p.ops) if (op.kind === 'copy') expect(keys.has(addrKey(op.from))).toBe(true);
  });

  it('rejects cross-bank, same-slot, and empty-source', () => {
    const occ = occOf(prog(0,0,'X'), prog(1,0,'Y'));
    expect(planInsert(occ, { bank:0, slot:0 }, { bank:1, slot:0 })).toEqual({ error: 'Insert works within one bank for now.' });
    expect(planInsert(occ, { bank:0, slot:0 }, { bank:0, slot:0 })).toEqual({ error: 'Dropped on the same slot.' });
    expect(planInsert(occ, { bank:0, slot:9 }, { bank:0, slot:0 })).toEqual({ error: 'There is no program in the source slot.' });
  });
});
