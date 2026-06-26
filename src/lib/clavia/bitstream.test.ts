import { describe, it, expect } from 'vitest';
import { readBits } from './bitstream';

describe('readBits', () => {
  it('reads MSB-first across byte boundaries', () => {
    const body = new Uint8Array([0b1011_0010, 0b1100_0000]);
    expect(readBits(body, 0, 4)).toBe(0b1011);
    expect(readBits(body, 4, 4)).toBe(0b0010);
    expect(readBits(body, 6, 4)).toBe(0b1011); // spans bytes 0→1
    expect(readBits(body, 0, 8)).toBe(0xb2);
  });

  it('treats reads past the end as zero bits', () => {
    expect(readBits(new Uint8Array([0xff]), 8, 8)).toBe(0);
  });

  it('returns an unsigned 32-bit value', () => {
    const body = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
    expect(readBits(body, 0, 32)).toBe(0xffffffff);
  });
});
