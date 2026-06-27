import { describe, it, expect } from 'vitest';
import { planOffload } from './offload';
import { addrKey } from './reorg';

describe('planOffload', () => {
  it('builds a delete op per address, journaled, bulk', () => {
    const addrs = [{ bank: 1, slot: 3 }, { bank: 1, slot: 7 }];
    const p = planOffload(addrs);
    expect(p.ops).toEqual([
      { kind: 'delete', at: { bank: 1, slot: 3 } },
      { kind: 'delete', at: { bank: 1, slot: 7 } },
    ]);
    expect(p.journalSlots.map(addrKey)).toEqual(['1:3', '1:7']); // pulled before delete → rollback can restore
    expect(p.bulk).toBe(true);
    expect(p.title).toBe('Remove from Nord');
  });

  it('summarizes the count and the label', () => {
    expect(planOffload([{ bank: 0, slot: 0 }]).summary).toMatch(/1 sample/i);
    expect(planOffload([{ bank: 0, slot: 0 }, { bank: 0, slot: 1 }], 'pianos').summary).toMatch(/2 pianos/i);
  });
});
