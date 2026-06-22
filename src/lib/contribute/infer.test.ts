import { describe, it, expect } from 'vitest';
import { changedBits, bitRuns, extractRaw, fitLinear, fitEnum, fitBool } from './infer';

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

describe('fitLinear', () => {
  it('fits a clean linear raw->value relation (value = 0.5*raw)', () => {
    const f = fitLinear([0, 10, 20, 40], [0, 5, 10, 20]);
    expect(f.a).toBeCloseTo(0.5, 6);
    expect(f.b).toBeCloseTo(0, 6);
    expect(f.residual).toBeLessThan(1e-6);
    expect(f.monotonic).toBe(true);
  });
  it('flags non-monotonic / poor fit with a high residual', () => {
    const f = fitLinear([0, 10, 20], [0, 99, 1]);
    expect(f.residual).toBeGreaterThan(0.1);
  });
});

describe('fitEnum', () => {
  it('maps each distinct raw to the option captured with it', () => {
    const r = fitEnum([0, 1, 2], ['LP12', 'LP24', 'HP24']);
    expect(r.map).toEqual({ 0: 'LP12', 1: 'LP24', 2: 'HP24' });
    expect(r.consistent).toBe(true);
  });
  it('is inconsistent when one raw carries two options', () => {
    const r = fitEnum([0, 0], ['LP12', 'LP24']);
    expect(r.consistent).toBe(false);
  });
});

describe('fitBool', () => {
  it('accepts exactly two distinct raw states', () => {
    expect(fitBool([0, 1]).ok).toBe(true);
    expect(fitBool([0, 0]).ok).toBe(false);
  });
});
