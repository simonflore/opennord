/**
 * Nord Sample (`.nsmp`) block-stream **encoder** — the inverse of
 * {@link decodeStroke}. Produces an `NW1` block stream that round-trips through
 * our decoder: `decodeStroke(encodeStroke(pcm)) === pcm`.
 *
 * This is a *correct, simple* encoder, not a byte-for-byte clone of the editor's
 * `NW1::CEncode` (whose Phase1 picks optimal block boundaries at loop points —
 * `docs/NSMP-CODEC.md`). It splits into fixed-size blocks, picks the predictor
 * order that minimizes residual width per block, and packs residuals MSB-first.
 * Container assembly (CNSP/NSMP wrapper) and codec-4 segment markers are separate.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): for the user's own audio — local sample creation,
 * never factory content.
 */

import { PREDICTOR_COEFF } from './nsmp-codec';

const HISTORY_SIZE = 32;
const MAX_BITWIDTH = 16; // bitWidth field is 4 bits, stored minus one → 1..16
const MAX_ORDER = 7;

/** Smallest signed bit width (≥1) that holds every value in [min, max]. */
function signedBitWidth(min: number, max: number): number {
  let bw = 1;
  while (bw < 32 && (min < -(1 << (bw - 1)) || max > (1 << (bw - 1)) - 1)) bw++;
  return bw;
}

/** Predict sample `index` (channel `ch`) at `order` from a channel history ring. */
function predict(coeff: readonly number[], order: number, ring: Int32Array, head: number): number {
  let p = 0;
  for (let k = 0; k < order; k++) p += coeff[k] * ring[(head - 1 - k) & (HISTORY_SIZE - 1)];
  return p;
}

export interface EncodeOptions {
  /** Samples per block (per the interleaved stream). Default 2048. */
  blockSize?: number;
}

/**
 * Encode per-channel integer PCM into an `NW1` block stream (header words +
 * residuals + a final stop block). Channels are interleaved `i % channelCount`,
 * matching the decoder. Throws if a block's residuals need >16 bits at every
 * order (raise the source's headroom / pre-scale, as the editor does).
 */
export function encodeStroke(channels: ArrayLike<number>[], opts: EncodeOptions = {}): Uint8Array {
  const nCh = channels.length;
  if (nCh === 0) return new Uint8Array(0);
  const len = channels[0].length;
  const blockSize = Math.max(nCh, opts.blockSize ?? 2048);

  const out: number[] = []; // bytes
  const pushWord = (w: number) => out.push((w >>> 24) & 0xff, (w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff);

  // Per-channel history of original samples (== reconstructed, since decode is exact).
  const ring: Int32Array[] = [];
  const head: number[] = [];
  for (let c = 0; c < nCh; c++) {
    ring.push(new Int32Array(HISTORY_SIZE));
    head.push(0);
  }
  const sampleAt = (i: number) => channels[(i % nCh)][Math.floor(i / nCh)];

  const total = len * nCh;
  let i = 0;
  while (i < total) {
    const blockEnd = Math.min(i + blockSize, total);
    const sampleCnt = blockEnd - i;

    // Pass 1: choose the order with the narrowest residual width (history is
    // order-independent — it's the original samples — so snapshot and replay).
    const snapRing = ring.map((r) => Int32Array.from(r));
    const snapHead = head.slice();
    let bestOrder = 0;
    let bestBw = MAX_BITWIDTH + 1;
    for (let order = 0; order <= MAX_ORDER; order++) {
      const coeff = PREDICTOR_COEFF[order];
      const tRing = snapRing.map((r) => Int32Array.from(r));
      const tHead = snapHead.slice();
      let min = 0;
      let max = 0;
      for (let j = i; j < blockEnd; j++) {
        const ch = j % nCh;
        const s = sampleAt(j);
        const r = s - predict(coeff, order, tRing[ch], tHead[ch]);
        if (r < min) min = r;
        if (r > max) max = r;
        tRing[ch][tHead[ch]] = s;
        tHead[ch] = (tHead[ch] + 1) & (HISTORY_SIZE - 1);
      }
      const bw = signedBitWidth(min, max);
      if (bw <= MAX_BITWIDTH && bw < bestBw) {
        bestBw = bw;
        bestOrder = order;
      }
    }
    if (bestBw > MAX_BITWIDTH) {
      throw new Error(`encodeStroke: block at ${i} needs >${MAX_BITWIDTH}-bit residuals at every order`);
    }

    // Header word: bitWidth[19:22]-1, filterOrder[14:17], sampleCnt[0:13].
    pushWord((((bestBw - 1) & 0xf) << 19) | ((bestOrder & 0xf) << 14) | (sampleCnt & 0x3fff));

    // Pass 2: write residuals MSB-first (signed, bestBw bits), padded to whole
    // 32-bit words; advance the real history.
    const coeff = PREDICTOR_COEFF[bestOrder];
    let acc = 0n;
    let nbits = 0;
    const mask = (1n << BigInt(bestBw)) - 1n;
    for (let j = i; j < blockEnd; j++) {
      const ch = j % nCh;
      const s = sampleAt(j);
      const r = s - predict(coeff, bestOrder, ring[ch], head[ch]);
      acc = (acc << BigInt(bestBw)) | (BigInt(r) & mask);
      nbits += bestBw;
      while (nbits >= 32) {
        nbits -= 32;
        pushWord(Number((acc >> BigInt(nbits)) & 0xffffffffn));
      }
      ring[ch][head[ch]] = s;
      head[ch] = (head[ch] + 1) & (HISTORY_SIZE - 1);
    }
    if (nbits > 0) pushWord(Number((acc << BigInt(32 - nbits)) & 0xffffffffn)); // pad to word

    i = blockEnd;
  }

  pushWord(0); // stop block (order 0, bitWidth 1, sampleCnt 0 → decoder stops)
  return Uint8Array.from(out);
}
