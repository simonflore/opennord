/**
 * Nord Sample (`.nsmp*`) **byte-exact** `Ymer::Codec::NW1` encoder — a faithful
 * port of the editor's `NW1::CEncode` (Phase0/1/2 + `CChunk` + `WriteChunk` +
 * `CBlockHdr::Write`), recovered from the Nord Sample Editor's arm64 slice
 * (`docs/NSMP-CODEC.md`, `nse_decomp/arm64/`).
 *
 * Unlike {@link encodeStroke} (a *correct, simple* fixed-block inverse of the
 * decoder), this reproduces the editor's exact block layout: content-adaptive
 * segmentation, predictor-order selection (orders 0–4), run merging, and the
 * two block-header flag bits. Validated **byte-for-byte** against the editor's
 * own `impulse/ramp/sine_24.nsmp4` ground truth (`nw1-encode.test.ts`), which
 * makes the OG (codec-1) writer built on it correct by construction — the exact
 * bytes the editor would emit — without needing a Stage 2 to validate against.
 *
 * The input PCM must already be in the editor's *internal* (resampled) domain —
 * i.e. the integer PCM that {@link decodeStroke} returns. This encoder does not
 * resample; the source→internal conversion (`CreateIntermediate`) is upstream.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own audio only; never factory content.
 */

import { PREDICTOR_COEFF } from './nsmp-codec';

const HISTORY_SIZE = 32; // per-channel ring (matches the decoder + CChunk)

/**
 * `SMetric` block size, per channel (`SMetric[8]`). The interleaved fixed chunk
 * size is `BLOCK_PER_CH * channels` (= 64 for stereo) — the unit Phase1 splits on
 * and the `sampleCnt` carried in the stop block. Recovered from the stop block of
 * every ground-truth file (`sc == SMetric[8]·channels`).
 */
export const BLOCK_PER_CH = 32;

/**
 * Largest first-chunk remainder folded into a segment's opening block
 * (`+0x6c = (SMetric[0xc] − SMetric[8])·channels`). Every observed remainder
 * (24, 32) is ≤ this, so the opening chunk is a single `64 + remainder` block.
 */
const REMAINDER_LIMIT = 1 << 20;

/**
 * Cap on a merged block's interleaved `sampleCnt` (`SMetric[0x14]` gate in
 * Phase1). The 14-bit header field bounds it at 0x3fff regardless; the largest
 * merge seen in ground truth is 16320 (`ramp`), so values above that are
 * unverified — kept at the field limit.
 */
const MAX_BLOCK_SAMPLES = 0x3fff;

export interface NW1Block {
  /** Predictor order (0–4; 0 forced at segment starts). */
  order: number;
  /** Residual bit width (≥2 floor; ≤14 nominal target). */
  bw: number;
  /** Interleaved sample count. */
  sampleCnt: number;
  /** Block-header bit 23 — set on segment-start blocks and the stop block. */
  linMode: boolean;
  /** Block-header bit 18 — unused by the one-shot path (always false here). */
  flag2: boolean;
}

export interface EncodeNW1Options {
  /**
   * Segment boundaries in **interleaved** sample positions (the editor's region
   * pointers: secondStart, loop-in, …). Each non-empty segment opens with a
   * forced order-0 block. Defaults to a single segment spanning the whole stroke.
   */
  segmentsInterleaved?: number[];
  /** Codec-4 per-channel word interleaving. Default false (codec-1/3 sample-interleaved). */
  wordInterleaved?: boolean;
  /** OG/legacy 24-bit units (3-byte headers + 24-bit words). Default false (32-bit). */
  u24?: boolean;
}

/** Smallest signed bit width (≥1) holding every value in [min, max]. */
function signedBitWidth(min: number, max: number): number {
  let bw = 1;
  while (bw < 32 && (min < -(1 << (bw - 1)) || max > (1 << (bw - 1)) - 1)) bw++;
  return bw;
}

/** Order-N prediction from a channel ring (binomial coeff over prior samples). */
function predict(coeff: readonly number[], order: number, ring: Int32Array, head: number): number {
  let p = 0;
  for (let k = 0; k < order; k++) p += coeff[k] * ring[(head - 1 - k) & (HISTORY_SIZE - 1)];
  return p;
}

/** Per-channel persistent encode state (history ring carried across blocks). */
interface ChState {
  ring: Int32Array;
  head: number;
  idx: number; // consumed sample count
}

/** Channel sample counts for an interleaved block (last channel takes remainder). */
function perChannelCounts(sampleCnt: number, nCh: number): number[] {
  const base = Math.floor(sampleCnt / nCh);
  return Array.from({ length: nCh }, (_, ch) => (ch === nCh - 1 ? sampleCnt - base * (nCh - 1) : base));
}

/**
 * `CChunk`: the residual bit width for one predictor order over a chunk, using a
 * snapshot of each channel's ring (selection must not advance the real history).
 * Floors at 2 (the editor inits the width tracker to 2).
 */
function widthForOrder(
  channels: ArrayLike<number>[], st: ChState[], order: number, counts: number[],
): number {
  const coeff = PREDICTOR_COEFF[order];
  let min = 0;
  let max = 0;
  for (let ch = 0; ch < channels.length; ch++) {
    const ring = Int32Array.from(st[ch].ring);
    let head = st[ch].head;
    for (let j = 0; j < counts[ch]; j++) {
      const s = channels[ch][st[ch].idx + j];
      const r = s - predict(coeff, order, ring, head);
      if (r < min) min = r;
      if (r > max) max = r;
      ring[head] = s;
      head = (head + 1) & (HISTORY_SIZE - 1);
    }
  }
  const w = signedBitWidth(min, max);
  return w < 2 ? 2 : w;
}

/** `CChunk` order selection: orders 0–4, min width, ties → lowest order. */
function selectOrder(channels: ArrayLike<number>[], st: ChState[], counts: number[]): { order: number; bw: number } {
  let bestOrder = 0;
  let bestBw = 25;
  for (let order = 0; order <= 4; order++) {
    const w = widthForOrder(channels, st, order, counts);
    if (w < bestBw) {
      bestBw = w;
      bestOrder = order;
    }
  }
  return { order: bestOrder, bw: bestBw };
}

/** Advance the real per-channel rings over a block's samples. */
function advance(channels: ArrayLike<number>[], st: ChState[], counts: number[]): void {
  for (let ch = 0; ch < channels.length; ch++) {
    for (let j = 0; j < counts[ch]; j++) {
      const s = channels[ch][st[ch].idx + j];
      st[ch].ring[st[ch].head] = s;
      st[ch].head = (st[ch].head + 1) & (HISTORY_SIZE - 1);
    }
    st[ch].idx += counts[ch];
  }
}

/**
 * Phase0/1: plan the block list for a stroke. Splits each segment into a forced
 * order-0 opening block (`64 + remainder`) then fixed `64`-sample chunks, runs
 * `CChunk` per chunk, and merges consecutive non-forced chunks with identical
 * `(order, bw)`. No stop block (Phase2 appends it).
 */
export function planBlocks(channels: ArrayLike<number>[], opts: EncodeNW1Options = {}): NW1Block[] {
  const nCh = channels.length;
  if (nCh === 0) return [];
  const lenPerCh = channels[0].length;
  const total = lenPerCh * nCh; // interleaved
  const BS = BLOCK_PER_CH * nCh;

  // Segment boundaries → segment lengths (interleaved). Clamp, dedupe, sort.
  const bounds = (opts.segmentsInterleaved ?? [])
    .map((b) => Math.max(0, Math.min(total, b)))
    .filter((b) => b > 0 && b < total)
    .sort((a, b) => a - b);
  const segStarts = [0, ...bounds];
  const segments = segStarts.map((s, i) => ({ start: s, len: (segStarts[i + 1] ?? total) - s })).filter((s) => s.len > 0);

  const st: ChState[] = Array.from({ length: nCh }, () => ({ ring: new Int32Array(HISTORY_SIZE), head: 0, idx: 0 }));
  const blocks: NW1Block[] = [];

  for (const seg of segments) {
    let remaining = seg.len;
    let first = true;
    // current open (merged) block, or null
    let open: NW1Block | null = null;

    while (remaining > 0) {
      let chunk: number;
      let forced: boolean;
      if (first) {
        const rem = seg.len % BS;
        const take = Math.min(rem, REMAINDER_LIMIT);
        chunk = Math.min(BS + take, remaining); // opening block: 64 + remainder
        forced = true;
        first = false;
      } else {
        chunk = Math.min(BS, remaining);
        forced = chunk !== BS; // trailing partials are also forced order-0/lin1
      }
      const counts = perChannelCounts(chunk, nCh);

      // Decide whether this chunk extends the open run or starts a new block.
      // The editor (Phase1) keeps the run — at the run's fixed (order, bw) — when
      // the chunk both *fits* at the run's order within the run's bw and doesn't
      // prefer a narrower coding (its own best width ≥ the run's bw); otherwise it
      // flushes and the chunk's own best (order, width) starts the next run.
      // Forced (segment-start / trailing-partial) chunks are order-0/lin-1 and
      // never merge.
      const canMerge =
        !forced && open !== null && open.linMode === false &&
        open.sampleCnt + chunk <= MAX_BLOCK_SAMPLES &&
        widthForOrder(channels, st, open.order, counts) <= open.bw &&
        selectOrder(channels, st, counts).bw >= open.bw;

      if (canMerge && open) {
        open.sampleCnt += chunk;
      } else {
        const sel = forced ? { order: 0, bw: widthForOrder(channels, st, 0, counts) } : selectOrder(channels, st, counts);
        open = { order: sel.order, bw: sel.bw, sampleCnt: chunk, linMode: forced, flag2: false };
        blocks.push(open);
        if (forced) open = null; // forced blocks never absorb followers
      }
      advance(channels, st, counts);
      remaining -= chunk;
    }
  }
  return blocks;
}

/** Build a `CBlockHdr` header word (`CBlockHdr::Write`). */
export function blockHeaderWord(b: { order: number; bw: number; sampleCnt: number; linMode: boolean; flag2: boolean }): number {
  return (
    (((b.linMode ? 1 : 0) << 23) |
      (((b.bw - 1) & 0xf) << 19) |
      ((b.flag2 ? 1 : 0) << 18) |
      ((b.order & 0xf) << 14) |
      (b.sampleCnt & 0x3fff)) >>> 0
  );
}

/**
 * Phase2: serialize the planned blocks to a byte stream — for each block a
 * `CBlockHdr` word then its residuals (`WriteChunk`), and finally the stop block
 * (`linMode, bw=1, order=0, sampleCnt=blockSize`). Residual packing matches the
 * decoder/`WriteChunk` byte-for-byte (verified): sample-interleaved 32/24-bit, or
 * codec-4 per-channel word-interleaving.
 */
export function encodeStrokeNW1(channels: ArrayLike<number>[], opts: EncodeNW1Options = {}): Uint8Array {
  const nCh = channels.length;
  if (nCh === 0) return new Uint8Array(0);
  const blocks = planBlocks(channels, opts);

  const u24 = opts.u24 === true;
  const wordBits = u24 ? 24 : 32;
  const wordMask = (1n << BigInt(wordBits)) - 1n;
  const out: number[] = [];
  const pushWord = u24
    ? (w: number) => out.push((w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff)
    : (w: number) => out.push((w >>> 24) & 0xff, (w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff);

  // Per-channel rings (re-run prediction to emit residuals; mirrors planBlocks).
  const st: ChState[] = Array.from({ length: nCh }, () => ({ ring: new Int32Array(HISTORY_SIZE), head: 0, idx: 0 }));

  const packChannelWords = (res: number[], bw: number): number[] => {
    const words: number[] = [];
    let acc = 0n;
    let nbits = 0;
    const mask = (1n << BigInt(bw)) - 1n;
    for (const r of res) {
      acc = (acc << BigInt(bw)) | (BigInt(r) & mask);
      nbits += bw;
      while (nbits >= wordBits) {
        nbits -= wordBits;
        words.push(Number((acc >> BigInt(nbits)) & wordMask));
      }
    }
    if (nbits > 0) words.push(Number((acc << BigInt(wordBits - nbits)) & wordMask));
    return words;
  };

  for (const b of blocks) {
    pushWord(blockHeaderWord(b));
    const counts = perChannelCounts(b.sampleCnt, nCh);
    const coeff = PREDICTOR_COEFF[b.order];

    if (opts.wordInterleaved) {
      // Codec 4: each channel its own word-aligned bitstream, words interleaved.
      const chWords: number[][] = [];
      for (let ch = 0; ch < nCh; ch++) {
        const res: number[] = [];
        for (let j = 0; j < counts[ch]; j++) {
          const s = channels[ch][st[ch].idx + j];
          res.push(s - predict(coeff, b.order, st[ch].ring, st[ch].head));
          st[ch].ring[st[ch].head] = s;
          st[ch].head = (st[ch].head + 1) & (HISTORY_SIZE - 1);
        }
        st[ch].idx += counts[ch];
        chWords.push(packChannelWords(res, b.bw));
      }
      const wpc = chWords[0].length;
      for (let w = 0; w < wpc; w++) for (let ch = 0; ch < nCh; ch++) pushWord(chWords[ch][w]);
    } else {
      // Codec 1/3: single sample-interleaved bitstream (sample i → channel i%nCh).
      let acc = 0n;
      let nbits = 0;
      const mask = (1n << BigInt(b.bw)) - 1n;
      for (let i = 0; i < b.sampleCnt; i++) {
        const ch = i % nCh;
        const s = channels[ch][st[ch].idx];
        const r = s - predict(coeff, b.order, st[ch].ring, st[ch].head);
        acc = (acc << BigInt(b.bw)) | (BigInt(r) & mask);
        nbits += b.bw;
        while (nbits >= wordBits) {
          nbits -= wordBits;
          pushWord(Number((acc >> BigInt(nbits)) & wordMask));
        }
        st[ch].ring[st[ch].head] = s;
        st[ch].head = (st[ch].head + 1) & (HISTORY_SIZE - 1);
        st[ch].idx++;
      }
      if (nbits > 0) pushWord(Number((acc << BigInt(wordBits - nbits)) & wordMask));
    }
  }

  // Stop block: linMode, bw=1, order=0, sampleCnt = blockSize (interleaved). 4 bytes.
  pushWord(blockHeaderWord({ order: 0, bw: 1, sampleCnt: BLOCK_PER_CH * nCh, linMode: true, flag2: false }));
  return Uint8Array.from(out);
}
