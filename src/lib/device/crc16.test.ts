import { describe, it, expect } from 'vitest';
import { crc16ccitt } from './crc16';

describe('crc16ccitt (CRC-16/CCITT-FALSE)', () => {
  it('matches the standard check vector', () => {
    expect(crc16ccitt(new TextEncoder().encode('123456789'))).toBe(0x29b1);
  });

  it('returns 0xFFFF for empty input (init value)', () => {
    expect(crc16ccitt(new Uint8Array(0))).toBe(0xffff);
  });

  it('computes the CRC of a real Begin(6) frame body (closes the loop with protocol.test)', () => {
    // The 20 bytes preceding the CRC in encodeMessage(CReqBegin, [6]):
    // [len=22][protoId 0x0C][version 0x0A][msgId 0x04][partition 6]
    const frameBody = new Uint8Array([
      0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x0c, 0x00, 0x00, 0x00, 0x0a,
      0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x06,
    ]);
    expect(crc16ccitt(frameBody)).toBe(0x825a);
  });

  it('handles a single-byte input', () => {
    // One pass of the loop over 0x00 from init 0xFFFF.
    expect(crc16ccitt(new Uint8Array([0x00]))).toBe(0xe1f0);
  });
});
