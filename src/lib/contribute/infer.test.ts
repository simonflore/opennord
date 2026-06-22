import { describe, it, expect } from 'vitest';
import { changedBits, bitRuns, extractRaw } from './infer';

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

describe('extractRaw', () => {
  it('reads a sub-byte field (bitOffset/width within one byte)', () => {
    // byte 0 = 0b0110_1000; field at bitOffset 3, width 4 -> 0b1101 = 13
    expect(extractRaw(new Uint8Array([0x68]), 0, 3, 4, 'le')).toBe(13);
  });
  it('reads a little-endian 16-bit field', () => {
    expect(extractRaw(new Uint8Array([0x34, 0x12]), 0, 0, 16, 'le')).toBe(0x1234);
  });
  it('reads a big-endian 16-bit field', () => {
    expect(extractRaw(new Uint8Array([0x12, 0x34]), 0, 0, 16, 'be')).toBe(0x1234);
  });
});
