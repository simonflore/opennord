import { describe, it, expect } from 'vitest';
import { encodeMessage } from './protocol';
import { CReqBegin } from './opcodes';

describe('encodeMessage', () => {
  it('encodes Begin(6) byte-exactly (validated frame)', () => {
    const bytes = encodeMessage(CReqBegin, [6]);
    expect([...bytes]).toEqual([
      0x00, 0x00, 0x00, 0x16, // length = 22
      0x00, 0x00, 0x00, 0x0c, // protoId
      0x00, 0x00, 0x00, 0x0a, // version
      0x00, 0x00, 0x00, 0x04, // msgId = Begin
      0x00, 0x00, 0x00, 0x06, // payload: partition 6
      0x82, 0x5a,             // CRC16
    ]);
  });

  it('includes trailing bytes before the CRC and sets length', () => {
    const trailing = new Uint8Array([0xaa, 0xbb]);
    const bytes = encodeMessage(0x10, [1, 2], trailing);
    // length = 16 header + 2 words*4 + 2 trailing + 2 crc = 28
    expect((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]).toBe(28);
    expect(bytes.length).toBe(28);
    expect([...bytes.slice(24, 26)]).toEqual([0xaa, 0xbb]);
  });
});
