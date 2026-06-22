import { describe, it, expect } from 'vitest';
import { changedBits, bitRuns } from './infer';

describe('changedBits', () => {
  it('finds bits that vary across samples (LSB=0, byte*8+bit)', () => {
    // byte 1: 0x00 vs 0x06 -> bits 1 and 2 of byte 1 vary -> global 9,10
    const a = new Uint8Array([0xff, 0x00, 0x55]);
    const b = new Uint8Array([0xff, 0x06, 0x55]);
    expect(changedBits([a, b])).toEqual([9, 10]);
  });
  it('ignores bits constant across all samples', () => {
    const a = new Uint8Array([0x01]); const b = new Uint8Array([0x01]);
    expect(changedBits([a, b])).toEqual([]);
  });
});

describe('bitRuns', () => {
  it('groups consecutive bit indices into runs', () => {
    expect(bitRuns([9, 10, 11, 20])).toEqual([
      { startBit: 9, endBit: 11 }, { startBit: 20, endBit: 20 },
    ]);
  });
  it('returns [] for no bits', () => { expect(bitRuns([])).toEqual([]); });
});
