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
  /**
   * Emit the codec-4 layout — each channel a separate 32-bit-word bitstream
   * interleaved word-by-word (the inverse of `decodeStroke`'s `wordInterleaved`).
   * Default false (codec-3 single sample-interleaved stream).
   */
  wordInterleaved?: boolean;
  /**
   * Emit the OG/legacy layout — the same sample-interleaved stream as codec 3 but
   * in **24-bit units** (3-byte headers + 24-bit words). The inverse of
   * `decodeStroke`'s `u24` mode. Mutually exclusive with `wordInterleaved`.
   */
  u24?: boolean;
}

/** Pack signed `width`-bit residuals MSB-first into whole 32-bit BE words. */
function packResiduals(residuals: number[], width: number): number[] {
  const words: number[] = [];
  let acc = 0n;
  let nbits = 0;
  const mask = (1n << BigInt(width)) - 1n;
  for (const r of residuals) {
    acc = (acc << BigInt(width)) | (BigInt(r) & mask);
    nbits += width;
    while (nbits >= 32) {
      nbits -= 32;
      words.push(Number((acc >> BigInt(nbits)) & 0xffffffffn));
    }
  }
  if (nbits > 0) words.push(Number((acc << BigInt(32 - nbits)) & 0xffffffffn)); // pad to word
  return words;
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
  if (opts.wordInterleaved) return encodeStrokeWordInterleaved(channels, opts.blockSize ?? 2048);
  // OG/legacy packs the stream in 24-bit units (3-byte headers + 24-bit words);
  // codec 3 uses 32-bit. Same MSB-first residual packing either way.
  const u24 = opts.u24 === true;
  const wordBits = u24 ? 24 : 32;
  const wordMask = (1n << BigInt(wordBits)) - 1n;
  const len = channels[0].length;
  const blockSize = Math.max(nCh, opts.blockSize ?? 2048);

  const out: number[] = []; // bytes
  const pushWord = u24
    ? (w: number) => out.push((w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff)
    : (w: number) => out.push((w >>> 24) & 0xff, (w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff);

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
    // An order-0/bitWidth-1 header is byte-identical to the stop sentinel, so the
    // decoder would end the stroke early at a near-silent block. Promote to
    // bitWidth 2 (the 1-bit residuals still fit exactly) to keep the invariant.
    if (bestOrder === 0 && bestBw === 1) bestBw = 2;

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
      while (nbits >= wordBits) {
        nbits -= wordBits;
        pushWord(Number((acc >> BigInt(nbits)) & wordMask));
      }
      ring[ch][head[ch]] = s;
      head[ch] = (head[ch] + 1) & (HISTORY_SIZE - 1);
    }
    if (nbits > 0) pushWord(Number((acc << BigInt(wordBits - nbits)) & wordMask)); // pad to word

    i = blockEnd;
  }

  pushWord(0); // stop block (order 0, bitWidth 1, sampleCnt 0 → decoder stops)
  return Uint8Array.from(out);
}

/**
 * Codec-4 encode: per block, pick the order minimizing residual width across all
 * channels, then pack each channel's residuals into its own word-aligned bitstream
 * and interleave the words (word `w` → channel `w % nCh`). The inverse of
 * `decodeStroke`'s `wordInterleaved` mode; round-trips exactly. No stop block —
 * the `.nsmp` section bounds the stream (codec 4 runs to section end).
 */
function encodeStrokeWordInterleaved(channels: ArrayLike<number>[], blockPerCh: number): Uint8Array {
  const nCh = channels.length;
  const lenPerCh = channels[0].length;
  const perBlock = Math.max(1, blockPerCh);
  const out: number[] = [];
  const pushWord = (w: number) => out.push((w >>> 24) & 0xff, (w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff);

  const ring = Array.from({ length: nCh }, () => new Int32Array(HISTORY_SIZE));
  const head = new Array(nCh).fill(0);

  for (let start = 0; start < lenPerCh; start += perBlock) {
    const perCh = Math.min(perBlock, lenPerCh - start);

    // Order selection: lowest residual width across all channels (snapshot/replay).
    const snapRing = ring.map((r) => Int32Array.from(r));
    const snapHead = head.slice();
    let bestOrder = 0;
    let bestBw = MAX_BITWIDTH + 1;
    for (let order = 0; order <= MAX_ORDER; order++) {
      const coeff = PREDICTOR_COEFF[order];
      let min = 0;
      let max = 0;
      for (let ch = 0; ch < nCh; ch++) {
        const tRing = Int32Array.from(snapRing[ch]);
        let tHead = snapHead[ch];
        for (let j = start; j < start + perCh; j++) {
          const s = channels[ch][j];
          const r = s - predict(coeff, order, tRing, tHead);
          if (r < min) min = r;
          if (r > max) max = r;
          tRing[tHead] = s;
          tHead = (tHead + 1) & (HISTORY_SIZE - 1);
        }
      }
      const bw = signedBitWidth(min, max);
      if (bw <= MAX_BITWIDTH && bw < bestBw) { bestBw = bw; bestOrder = order; }
    }
    if (bestBw > MAX_BITWIDTH) throw new Error(`encodeStroke: block at ${start} needs >${MAX_BITWIDTH}-bit residuals`);

    pushWord((((bestBw - 1) & 0xf) << 19) | ((bestOrder & 0xf) << 14) | ((perCh * nCh) & 0x3fff));

    // Per-channel residuals → word-aligned bitstreams, then interleave the words.
    const coeff = PREDICTOR_COEFF[bestOrder];
    const chWords: number[][] = [];
    for (let ch = 0; ch < nCh; ch++) {
      const res: number[] = [];
      for (let j = start; j < start + perCh; j++) {
        const s = channels[ch][j];
        res.push(s - predict(coeff, bestOrder, ring[ch], head[ch]));
        ring[ch][head[ch]] = s;
        head[ch] = (head[ch] + 1) & (HISTORY_SIZE - 1);
      }
      chWords.push(packResiduals(res, bestBw));
    }
    const wpc = chWords[0].length;
    for (let w = 0; w < wpc; w++) for (let ch = 0; ch < nCh; ch++) pushWord(chWords[ch][w]);
  }
  return Uint8Array.from(out);
}
