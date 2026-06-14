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
