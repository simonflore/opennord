import { describe, it, expect } from 'vitest';
import { readDrawbars } from './drawbars';
import { CBIN_BODY_OFFSET, formatCbinVersion } from './cbin';

describe('readDrawbars', () => {
  it('unpacks 9 high-nibble-first drawbars + trailing from 5 bytes', () => {
    // bars: 1,2 / 3,4 / 5,6 / 7,8 / 9 + trailing 0xa
    const body = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a]);
    const d = readDrawbars(body, 0);
    expect(d.bars).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(d._trailing).toBe(0xa);
  });

  it('reads at an offset and zero-fills past the end', () => {
    const body = new Uint8Array([0, 0, 0x11, 0x22, 0x33, 0x44]); // byte at offset+4 (idx 6) is missing → 9th = 0
    expect(readDrawbars(body, 2).bars).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 0]);
    expect(readDrawbars(new Uint8Array([0x10]), 0)).toEqual({ bars: [1, 0, 0, 0, 0, 0, 0, 0, 0], _trailing: 0 });
  });
});

describe('formatCbinVersion / CBIN_BODY_OFFSET', () => {
  it('formats the u16 LE at 0x14 ÷100 to 2 decimals', () => {
    const bytes = new Uint8Array(0x16);
    bytes[0x14] = 313 & 0xff; bytes[0x15] = (313 >> 8) & 0xff;
    expect(formatCbinVersion(bytes)).toBe('3.13');
  });
  it('exposes the CBIN body offset constant', () => {
    expect(CBIN_BODY_OFFSET).toBe(0x2c);
  });
});
