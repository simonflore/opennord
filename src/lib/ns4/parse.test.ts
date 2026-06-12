import { describe, it, expect } from 'vitest';
import { parseNs4Program, readAsciiFixed } from './parse';

describe('parseNs4Program', () => {
  it('never throws and preserves raw bytes for an unknown buffer', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const program = parseNs4Program(bytes);
    expect(program.bytes).toBe(bytes);
    expect(program.parsed).toBe(false);
    // Transparency: it tells you what it couldn't do rather than guessing.
    expect(program.warnings.length).toBeGreaterThan(0);
  });

  it('handles an empty buffer', () => {
    const program = parseNs4Program(new Uint8Array());
    expect(program.bytes.length).toBe(0);
    expect(program.parsed).toBe(false);
  });
});

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
