import { describe, it, expect } from 'vitest';
import { readAsciiFixed } from './ascii';

describe('readAsciiFixed', () => {
  it('reads a fixed-length ASCII field and trims trailing padding', () => {
    const bytes = new Uint8Array([...'Grand Piano '].map((c) => c.charCodeAt(0)));
    expect(readAsciiFixed(bytes, 0, bytes.length)).toBe('Grand Piano');
  });

  it('stops at a NUL terminator', () => {
    const bytes = new Uint8Array([0x41, 0x42, 0x00, 0x43]); // "AB\0C"
    expect(readAsciiFixed(bytes, 0, 4)).toBe('AB');
  });

  it('reads from an offset', () => {
    const bytes = new Uint8Array([0x00, 0x00, 0x4e, 0x53, 0x34]); // ..NS4
    expect(readAsciiFixed(bytes, 2, 3)).toBe('NS4');
  });
});
