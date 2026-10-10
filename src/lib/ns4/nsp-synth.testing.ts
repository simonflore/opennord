/**
 * Test helpers: build synthetic `.npno` files the way the piano DSP reads them, so the
 * decoder can be round-trip tested without Nord's audio. Only tests import this.
 */
import { framesPerBlock } from './nsp-audio';
import { patchNs4Checksum } from '../clavia/checksum';
import { crc16ccitt } from '../clavia/crc16';

const PRED = [[], [1], [2, -1], [3, -3, 1], [4, -6, 4, -1]];

export interface SynthStroke {
  /** PCM per channel; padded with silence to a whole number of blocks. */
  pcm: number[][];
  velocityFrom: number;
  /** Signal before the stroke, per channel, oldest first (the record's seed). */
  before: number[][];
  loop?: { start: number; length: number };
}

/** Encode one stroke's blocks the way the piano DSP reads them. Returns the block bytes + frame count. */
export function encodeStroke(s: SynthStroke, channels: number, blockWords: number): { blocks: Uint8Array[]; frames: number } {
  const signal = (c: number, n: number) => (n < 0 ? s.before[c][4 + n] : (s.pcm[c][n] ?? 0));
  const blocks: Uint8Array[] = [];
  const total = s.pcm[0].length;
  let t = 0;
  let b = 0;
  while (t < total) {
    const order = b % 5;
    const residual = (c: number, n: number) => {
      let p = 0;
      PRED[order].forEach((k, j) => { p += k * signal(c, n - 1 - j); });
      return signal(c, n) - p;
    };
    // narrowest width whose block (own frames + 64 overlap) fits every residual
    let width = 1;
    for (; width <= 20; width++) {
      const own = framesPerBlock(blockWords, width, channels);
      const lim = 2 ** (width - 1);
      let fits = own > 0;
      for (let n = t; fits && n < t + own + 64; n++) {
        for (let c = 0; c < channels; c++) {
          const r = residual(c, n);
          if (r < -lim || r >= lim) { fits = false; break; }
        }
      }
      if (fits) break;
    }
    const own = framesPerBlock(blockWords, width, channels);
    const words = new Uint16Array(blockWords);
    words[0] = width | (order << 5) | (7 << 8);
    let bit = 0;
    for (let n = t; n < t + own + 64; n++) {
      for (let c = 0; c < channels; c++) {
        const v = (residual(c, n) + 2 ** width) % 2 ** width;
        for (let k = 0; k < width; k++, bit++) {
          if ((v >> k) & 1) words[1 + (bit >> 4)] |= 1 << (bit & 15);
        }
      }
    }
    const bytes = new Uint8Array(blockWords * 2);
    const view = new DataView(bytes.buffer);
    words.forEach((w, i) => view.setUint16(i * 2, w));
    blocks.push(bytes);
    t += own;
    b++;
  }
  return { blocks, frames: t };
}

/** A synthetic `.npno`: CBIN header, CNSP directory + records, then the stroke blocks. */
export function makeNpno(strokes: SynthStroke[], channels: 1 | 2, cnsp: number): Uint8Array {
  const blockWords = 511 * channels;
  const encoded = strokes.map((s) => encodeStroke(s, channels, blockWords));
  const dataStart = cnsp + 0x732 + strokes.length * 0x76;
  // v5 (CNSP at 0x18) ends with a 2-byte CRC-16 trailer; v6 carries a CRC-32 at 0x18.
  const size = dataStart + encoded.reduce((a, e) => a + e.blocks.length * blockWords * 2, 0) + (cnsp === 0x18 ? 2 : 0);
  const buf = new Uint8Array(size);
  const view = new DataView(buf.buffer);
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  ascii('CBIN', 0);
  if (cnsp === 0x2c) buf[4] = 1; // v6: format-1 envelope with a CRC-32 at 0x18 (v5 has none)
  ascii('npno', 8);
  view.setUint16(0x14, cnsp === 0x18 ? 530 : 610, true);
  ascii('CNSP', cnsp);
  ascii('Synth Piano', cnsp + 0x1c);
  for (let n = 0; n < 128; n++) buf[cnsp + 0x8c + n] = n < 60 ? 48 : 72;
  view.setUint16(cnsp + 0x61c, cnsp === 0x18 ? 0x450 : 0x464);
  view.setUint16(cnsp + 0x61e, channels);
  view.setUint16(cnsp + 0x620, strokes.length);
  let at = dataStart;
  strokes.forEach((s, i) => {
    const r = cnsp + 0x732 + i * 0x76;
    view.setUint32(r + 0x00, at - cnsp);
    view.setUint8(r + 0x05, s.velocityFrom);
    view.setUint32(r + 0x06, encoded[i].frames);
    view.setUint16(r + 0x0a, encoded[i].blocks.length);
    s.before.forEach((h, c) => h.forEach((v, k) => view.setInt16(r + 0x0c + c * 8 + k * 2, v)));
    if (s.loop) { view.setUint32(r + 0x1c, s.loop.start); view.setUint32(r + 0x20, s.loop.length); }
    for (const blk of encoded[i].blocks) { buf.set(blk, at); at += blk.length; }
  });
  if (cnsp === 0x2c) return patchNs4Checksum(buf);
  const crc = crc16ccitt(buf.subarray(0, size - 2));
  buf[size - 2] = crc & 0xff;
  buf[size - 1] = crc >>> 8;
  return buf;
}

/** A decaying two-partial tone with a little deterministic noise. */
export function tone(frames: number, f: number, amp: number, seed: number): number[] {
  let s = seed;
  return Array.from({ length: frames }, (_, n) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const env = Math.exp(-n / (frames / 3));
    return Math.round(amp * env * (Math.sin(2 * Math.PI * f * n) + 0.3 * Math.sin(4 * Math.PI * f * n)) + ((s >> 16) % 7) - 3) + 0; // + 0: no -0
  });
}
