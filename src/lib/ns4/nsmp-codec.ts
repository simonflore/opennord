/**
 * Nord Sample (`.nsmp*`) audio decoder — the `Ymer::Codec::NW1` codec.
 *
 * Ported from the Nord Sample Editor v4.32 binary by interoperability RE
 * (`docs/NSMP-CODEC.md`): a block-based **fixed-polynomial linear-predictive**
 * codec (the FLAC/Shorten family). VALIDATED against a real user sample —
 * `Strings.nsmp3` decodes to a clean stereo waveform (see `nsmp-codec.test.ts`).
 *
 * ⚠️ SCOPE (docs/LEGAL.md): for the user's *own* recorded samples. Audio is
 * decoded locally for preview/inventory and is never embedded or shared.
 *
 * A stroke's audio is a sequence of blocks. Each block:
 *   - one 32-bit big-endian header word (see {@link readBlockHeader});
 *   - `sampleCnt` signed residuals, `bitWidth` bits each, MSB-first;
 * decoded by an order-`filterOrder` predictor over a per-channel history ring.
 * Samples are interleaved across channels (`channel = i % channelCount`).
 */

/**
 * Fixed predictor coefficients by filter order (orders 0–7 are the only ones
 * used). These are the rows of Pascal's triangle with alternating signs — the
 * order-N difference operator — extracted verbatim from `CFilter::g_coeff` in
 * the binary and equivalently generated here. Reconstruction uses **no shift**:
 *   `out = residual + Σ COEFF[order][k] · history[i-1-k]`.
 */
export const PREDICTOR_COEFF: readonly (readonly number[])[] = [
  [],
  [1],
  [2, -1],
  [3, -3, 1],
  [4, -6, 4, -1],
  [5, -10, 10, -5, 1],
  [6, -15, 20, -15, 6, -1],
  [7, -21, 35, -35, 21, -7, 1],
];

const HISTORY_SIZE = 32; // per-channel circular history (matches the binary's ring)

export interface BlockHeader {
  sampleCnt: number;
  filterOrder: number;
  bitWidth: number;
  /** True for the stop sentinel that ends a stroke (`filterOrder=0, bitWidth=1`). */
  isStop: boolean;
  /** Block-header bit 23 — set on segment-opening (loop-point) blocks + the stop. */
  linMode: boolean;
}

/** Parse a block header from one big-endian u32 (`NW1::CBlockHdr::Read`). */
export function readBlockHeader(word: number): BlockHeader {
  const sampleCnt = word & 0x3fff; // bits 0–13
  const filterOrder = (word >>> 14) & 0xf; // bits 14–17
  const bitWidth = ((word >>> 19) & 0xf) + 1; // bits 19–22, stored minus one
  // Stop sentinel: order 0 + bitWidth 1 (the editor never emits an order-0/bw-1
  // *data* block, so this is unambiguous; our encoder upholds the same invariant).
  const isStop = filterOrder === 0 && bitWidth === 1;
  return { sampleCnt, filterOrder, bitWidth, isStop, linMode: !!((word >>> 23) & 1) };
}

export interface DecodedStroke {
  /** Reconstructed PCM, one Int32Array per channel (raw, pre-normalization). */
  channels: Int32Array[];
  /** Byte offset just past the stop block. */
  endOffset: number;
  /**
   * Segment boundaries (interleaved sample positions) — the `linMode` block
   * starts after position 0 (the editor's region/loop points). Drives byte-exact
   * re-encoding; carried into a converted file to preserve loop structure.
   */
  segments: number[];
}

export interface DecodeStrokeOptions {
  /**
   * Codec-4 residual layout: each block's channels are packed as **separate
   * 32-bit-word bitstreams interleaved word-by-word** (word `w` → channel
   * `w % channelCount`), and zero-sample blocks are skipped as segment markers
   * (run to end-of-buffer). Codec-3 (default) is a single sample-interleaved
   * bitstream terminated by a stop block. See `docs/NSMP-CODEC.md`.
   */
  wordInterleaved?: boolean;
  /**
   * OG/legacy layout (original `.nsmp`, version 8 / `NWS` tree): the same
   * single sample-interleaved, stop-terminated stream as codec 3, but packed in
   * **24-bit units** — 3-byte block headers and 24-bit residual words. Each word
   * is MSB-justified into a 32-bit lane before accumulation (the `GetU24<<8`
   * step in the binary's `DecodeSamples` U24 path). See `docs/NSMP-CODEC.md`.
   */
  u24?: boolean;
}

/** Per-channel decode state: history ring + write head + reconstructed output. */
interface ChannelState {
  ring: Int32Array;
  head: number;
  out: number[];
}

function makeChannels(n: number): ChannelState[] {
  return Array.from({ length: n }, () => ({ ring: new Int32Array(HISTORY_SIZE), head: 0, out: [] }));
}

/** Reconstruct one sample on a channel from a residual + order-N prediction. */
function emit(cs: ChannelState, residual: number, coeff: readonly number[], order: number): void {
  let pred = 0;
  for (let k = 0; k < order; k++) pred += coeff[k] * cs.ring[(cs.head - 1 - k) & (HISTORY_SIZE - 1)];
  const sample = residual + pred;
  cs.ring[cs.head] = sample;
  cs.head = (cs.head + 1) & (HISTORY_SIZE - 1);
  cs.out.push(sample);
}

const signExtend = (v: number, bw: number) => (v >= 1 << (bw - 1) ? v - (1 << bw) : v);

/**
 * Decode one stroke's block stream starting at `byteOffset`, de-interleaving
 * `channelCount` channels. Returns raw reconstructed integer PCM per channel
 * (apply the stroke's normalization gain / bit-depth scaling separately).
 */
export function decodeStroke(
  bytes: Uint8Array,
  byteOffset: number,
  channelCount: number,
  opts: DecodeStrokeOptions = {},
): DecodedStroke {
  const u32be = (o: number) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  const u24be = (o: number) => ((bytes[o] << 16) | (bytes[o + 1] << 8) | bytes[o + 2]) >>> 0;
  // OG legacy (`.nsmp` v8) packs the stream in 24-bit units; codec 3/4 use 32-bit.
  const u24 = opts.u24 === true;
  const hdrBytes = u24 ? 3 : 4;
  const wordBytes = u24 ? 3 : 4;
  const wordBits = u24 ? 24 : 32;
  const readHdr = (o: number) => (u24 ? u24be(o) : u32be(o));
  // residual word, MSB-justified into a 32-bit lane (u24 → top 24 bits via `<<8`)
  const readWord = (o: number) => (u24 ? ((u24be(o) << 8) >>> 0) : u32be(o));
  const channels = makeChannels(channelCount);

  let o = byteOffset;
  let index = 0; // running interleaved sample index (sample mode)
  let cumIL = 0; // running interleaved position (word-interleaved mode)
  const segments: number[] = []; // interleaved positions of linMode (loop-point) blocks
  while (o + hdrBytes <= bytes.length) {
    const hdr = readBlockHeader(readHdr(o));
    o += hdrBytes;

    if (opts.wordInterleaved) {
      // Codec 4: zero-sample blocks are segment markers — skip; run to buffer end.
      if (hdr.sampleCnt === 0) continue;
      if (hdr.filterOrder > 7) break;
      if (hdr.linMode && cumIL > 0) segments.push(cumIL);
      cumIL += hdr.sampleCnt;
      const perCh = Math.floor(hdr.sampleCnt / channelCount);
      const wordsPerCh = Math.ceil((perCh * hdr.bitWidth) / 32);
      if (o + wordsPerCh * channelCount * 4 > bytes.length) break;
      const bw = hdr.bitWidth;
      const coeff = PREDICTOR_COEFF[hdr.filterOrder];
      for (let ch = 0; ch < channelCount; ch++) {
        // last channel absorbs any remainder when sampleCnt isn't divisible
        const count = ch === channelCount - 1 ? hdr.sampleCnt - perCh * (channelCount - 1) : perCh;
        let acc = 0n;
        let nbits = 0;
        let produced = 0;
        for (let w = 0; w < wordsPerCh; w++) {
          acc = (acc | (BigInt(u32be(o + (w * channelCount + ch) * 4)) << BigInt(32 - nbits))) & 0xffffffffffffffffn;
          nbits += 32;
          while (nbits >= bw && produced < count) {
            emit(channels[ch], signExtend(Number((acc >> BigInt(64 - bw)) & ((1n << BigInt(bw)) - 1n)), bw), coeff, hdr.filterOrder);
            produced++;
            acc = (acc << BigInt(bw)) & 0xffffffffffffffffn;
            nbits -= bw;
          }
        }
      }
      o += wordsPerCh * channelCount * 4;
      continue;
    }

    // Codec 3 / OG legacy: single sample-interleaved bitstream, stop-terminated.
    if (hdr.isStop) break;
    if (hdr.filterOrder > 7 || hdr.sampleCnt === 0) {
      throw new Error(`nsmp: invalid block header at 0x${(o - hdrBytes).toString(16)}`);
    }
    if (hdr.linMode && index > 0) segments.push(index);
    const nWords = Math.ceil((hdr.sampleCnt * hdr.bitWidth) / wordBits);
    if (o + nWords * wordBytes > bytes.length) {
      throw new Error(`nsmp: block overruns buffer at 0x${(o - hdrBytes).toString(16)}`);
    }
    let acc = 0n;
    let nbits = 0;
    let produced = 0;
    const bw = hdr.bitWidth;
    const coeff = PREDICTOR_COEFF[hdr.filterOrder];
    for (let w = 0; w < nWords; w++) {
      acc = (acc | (BigInt(readWord(o)) << BigInt(32 - nbits))) & 0xffffffffffffffffn;
      o += wordBytes;
      nbits += wordBits;
      while (nbits >= bw && produced < hdr.sampleCnt) {
        emit(channels[index % channelCount], signExtend(Number((acc >> BigInt(64 - bw)) & ((1n << BigInt(bw)) - 1n)), bw), coeff, hdr.filterOrder);
        produced++;
        index++;
        acc = (acc << BigInt(bw)) & 0xffffffffffffffffn;
        nbits -= bw;
      }
    }
  }

  return { channels: channels.map((c) => Int32Array.from(c.out)), endOffset: o, segments };
}
