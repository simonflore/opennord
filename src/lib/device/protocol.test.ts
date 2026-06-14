import { describe, it, expect } from 'vitest';
import { encodeMessage, decodeReply, NordError } from './protocol';
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

describe('decodeReply', () => {
  it('round-trips a frame built by encodeMessage', () => {
    const frame = encodeMessage(0x05, [0, 7, 42]); // a fake "ack" with status 0
    const r = decodeReply(frame);
    expect(r.msgId).toBe(0x05);
    expect(r.status).toBe(0);
    expect(r.words).toEqual([0, 7, 42]);
    expect(r.payload.length).toBe(12);
  });

  it('throws on a CRC mismatch', () => {
    const frame = encodeMessage(0x05, [0]);
    frame[frame.length - 1] ^= 0xff; // corrupt the CRC
    expect(() => decodeReply(frame)).toThrow(NordError);
  });

  it('throws on a length mismatch', () => {
    const frame = encodeMessage(0x05, [0]);
    expect(() => decodeReply(frame.subarray(0, frame.length - 1))).toThrow(NordError);
  });
});
