import { describe, it, expect } from 'vitest';
import { readU32BE } from './payload-io';

describe('readU32BE', () => {
  it('reads a big-endian u32 at an offset', () => {
    const p = new Uint8Array([0, 0, 0x12, 0x34, 0x56, 0x78]);
    expect(readU32BE(p, 2)).toBe(0x12345678);
  });

  it('returns an unsigned value for the high bit', () => {
    expect(readU32BE(new Uint8Array([0xff, 0xff, 0xff, 0xff]), 0)).toBe(0xffffffff);
  });

  it('honors the view byteOffset of a subarray', () => {
    const backing = new Uint8Array([0xaa, 0, 0, 0x01, 0x00]);
    expect(readU32BE(backing.subarray(1), 0)).toBe(0x00000100);
  });
});
