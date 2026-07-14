import { describe, it, expect } from 'vitest';
import { CBIN_HEADER_LEN, stripCbinHeader } from './body';

describe('stripCbinHeader', () => {
  it('drops the 44-byte CBIN header, returning the body', () => {
    const file = new Uint8Array(50);
    for (let i = 0; i < 50; i++) file[i] = i;
    const body = stripCbinHeader(file);
    expect(CBIN_HEADER_LEN).toBe(44);
    expect(body.length).toBe(6);
    expect([...body]).toEqual([44, 45, 46, 47, 48, 49]);
  });
  it('returns empty when the file is header-only or shorter', () => {
    expect(stripCbinHeader(new Uint8Array(44)).length).toBe(0);
    expect(stripCbinHeader(new Uint8Array(10)).length).toBe(0);
  });
});
