import { describe, it, expect } from 'vitest';
import { firstFreeLocation } from './locations';

const banks = [{ slotCapacity: 2 }, { slotCapacity: 2 }];

describe('firstFreeLocation', () => {
  it('scans bank by bank for the first empty place', () => {
    expect(firstFreeLocation([], banks)).toEqual({ bank: 0, slot: 0 });
    expect(firstFreeLocation([{ bank: 0, slot: 0 }, { bank: 0, slot: 1 }], banks)).toEqual({ bank: 1, slot: 0 });
  });

  it('takes the preferred place when it is empty and inside the banks', () => {
    expect(firstFreeLocation([], banks, { prefer: { bank: 1, slot: 1 } })).toEqual({ bank: 1, slot: 1 });
    expect(firstFreeLocation([{ bank: 1, slot: 1 }], banks, { prefer: { bank: 1, slot: 1 } })).toEqual({ bank: 0, slot: 0 });
    // A generated sample's header says 0xFFFF: "no place".
    expect(firstFreeLocation([], banks, { prefer: { bank: 0xffff, slot: 0xffff } })).toEqual({ bank: 0, slot: 0 });
  });

  it('skips places taken earlier in the same batch', () => {
    expect(firstFreeLocation([], banks, { taken: [{ bank: 0, slot: 0 }] })).toEqual({ bank: 0, slot: 1 });
  });

  it('is null when every place is used', () => {
    const all = [0, 1].flatMap((bank) => [0, 1].map((slot) => ({ bank, slot })));
    expect(firstFreeLocation(all, banks)).toBeNull();
  });
});
