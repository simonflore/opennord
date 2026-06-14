import { crc16ccitt } from './crc16';
import { PROTOCOL_ID, PROTOCOL_VERSION } from './opcodes';

/** An error from the device protocol layer (framing, CRC, opcode, or status). */
export class NordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NordError';
  }
}

/**
 * Build a request frame: [u32 length][u32 protoId][u32 version][u32 msgId]
 * [payload words big-endian][trailing bytes][u16 CRC16]. `length` counts every
 * byte including itself and the CRC. Big-endian throughout.
 */
export function encodeMessage(msgId: number, words: number[], trailing?: Uint8Array): Uint8Array {
  const trail = trailing ?? new Uint8Array(0);
  const total = 16 + words.length * 4 + trail.length + 2;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, total);
  dv.setUint32(4, PROTOCOL_ID);
  dv.setUint32(8, PROTOCOL_VERSION);
  dv.setUint32(12, msgId);
  let off = 16;
  for (const w of words) {
    dv.setUint32(off, w >>> 0);
    off += 4;
  }
  out.set(trail, off);
  off += trail.length;
  dv.setUint16(off, crc16ccitt(out.subarray(0, off)));
  return out;
}

export interface NordReply {
  msgId: number;
  /** Reply payload word 0 (0 = OK; 1 = empty/not-found; 2 = no-session; 3 = not-open). */
  status: number;
  /** Payload as big-endian u32 words. */
  words: number[];
  /** Raw payload bytes (everything after the 16-byte header, before the CRC). */
  payload: Uint8Array;
}

/** Parse + validate a reply frame (length + CRC). Throws NordError on corruption. */
export function decodeReply(frame: Uint8Array): NordReply {
  if (frame.length < 18) throw new NordError(`reply too short (${frame.length} bytes)`);
  const dv = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  const len = dv.getUint32(0);
  if (len !== frame.length) throw new NordError(`reply length mismatch: header says ${len}, got ${frame.length}`);
  const gotCrc = crc16ccitt(frame.subarray(0, len - 2));
  const expCrc = dv.getUint16(len - 2);
  if (gotCrc !== expCrc) throw new NordError('reply CRC mismatch');
  const msgId = dv.getUint32(12);
  const payload = frame.subarray(16, len - 2);
  const pdv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const words: number[] = [];
  for (let o = 0; o + 4 <= payload.length; o += 4) words.push(pdv.getUint32(o));
  return { msgId, status: words[0] ?? 0, words, payload };
}
