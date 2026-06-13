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
}

/** Parse a block header from one big-endian u32 (`NW1::CBlockHdr::Read`). */
export function readBlockHeader(word: number): BlockHeader {
  const sampleCnt = word & 0x3fff; // bits 0–13
  const filterOrder = (word >>> 14) & 0xf; // bits 14–17
  const bitWidth = ((word >>> 19) & 0xf) + 1; // bits 19–22, stored minus one
  const isStop = filterOrder === 0 && bitWidth === 1;
  return { sampleCnt, filterOrder, bitWidth, isStop };
}

export interface DecodedStroke {
  /** Reconstructed PCM, one Int32Array per channel (raw, pre-normalization). */
  channels: Int32Array[];
  /** Byte offset just past the stop block. */
  endOffset: number;
}

/**
 * Decode one stroke's block stream starting at `byteOffset`, de-interleaving
 * `channelCount` channels. Returns raw reconstructed integer PCM per channel
 * (apply the stroke's normalization gain / bit-depth scaling separately).
 */
export function decodeStroke(bytes: Uint8Array, byteOffset: number, channelCount: number): DecodedStroke {
  const u32be = (o: number) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;

  const history: Int32Array[] = [];
  const head: number[] = [];
  const out: number[][] = [];
  for (let c = 0; c < channelCount; c++) {
    history.push(new Int32Array(HISTORY_SIZE));
    head.push(0);
    out.push([]);
  }

  let o = byteOffset;
  let index = 0; // running sample index across channels
  while (o + 4 <= bytes.length) {
    const hdr = readBlockHeader(u32be(o));
    o += 4;
    if (hdr.isStop) break;
    if (hdr.filterOrder > 7 || hdr.sampleCnt === 0) {
      throw new Error(`nsmp: invalid block header at 0x${(o - 4).toString(16)}`);
    }
    const nWords = Math.ceil((hdr.sampleCnt * hdr.bitWidth) / 32);
    if (o + nWords * 4 > bytes.length) {
      throw new Error(`nsmp: block overruns buffer at 0x${(o - 4).toString(16)}`);
    }

    // MSB-first signed residuals via a 64-bit accumulator (BigInt), refilled
    // from the top with whole 32-bit words.
    let acc = 0n;
    let nbits = 0;
    let produced = 0;
    const bw = hdr.bitWidth;
    const coeff = PREDICTOR_COEFF[hdr.filterOrder];
    const order = hdr.filterOrder;
    for (let w = 0; w < nWords; w++) {
      acc = (acc | (BigInt(u32be(o)) << BigInt(32 - nbits))) & 0xffffffffffffffffn;
      o += 4;
      nbits += 32;
      while (nbits >= bw && produced < hdr.sampleCnt) {
        let residual = Number((acc >> BigInt(64 - bw)) & ((1n << BigInt(bw)) - 1n));
        if (residual >= 1 << (bw - 1)) residual -= 1 << bw; // sign-extend
        const ch = index % channelCount;
        const ring = history[ch];
        const h = head[ch];
        let pred = 0;
        for (let k = 0; k < order; k++) pred += coeff[k] * ring[(h - 1 - k) & (HISTORY_SIZE - 1)];
        const sample = residual + pred;
        ring[h] = sample;
        head[ch] = (h + 1) & (HISTORY_SIZE - 1);
        out[ch].push(sample);
        produced++;
        index++;
        acc = (acc << BigInt(bw)) & 0xffffffffffffffffn;
        nbits -= bw;
      }
    }
  }

  return { channels: out.map((a) => Int32Array.from(a)), endOffset: o };
}
