import { describe, it, expect } from 'vitest';
import { crc16ccitt } from './crc16';

describe('crc16ccitt (CRC-16/CCITT-FALSE)', () => {
  it('matches the standard check vector', () => {
    expect(crc16ccitt(new TextEncoder().encode('123456789'))).toBe(0x29b1);
  });

  it('returns 0xFFFF for empty input (init value)', () => {
    expect(crc16ccitt(new Uint8Array(0))).toBe(0xffff);
  });
});
