/**
 * Faithful NW1 sample-rate converter — the front half of WAV import, porting the
 * Nord Sample Editor's resampler (`NAudio::CResampler::GetNextResampledBuffer`,
 * @1000a5e84). It convolves the source with the editor's own extracted polyphase
 * windowed-sinc ({@link loadFirCoeffs}, 15 taps × 512 sub-phases) to convert a
 * user's audio to the Nord's internal storage rate before encoding.
 *
 * ⚠️ FAITHFUL, not byte-exact. The editor accumulates in float32 (likely fused
 * multiply-add); reproducing the stored integers bit-for-bit isn't practical and
 * isn't needed — the output is perceptually identical (sub-LSB) and the keyboard
 * cares about container/codec correctness, which the writers reproduce exactly.
 * See `docs/NSMP-CODEC.md`. (Byte-exact codec/header/container live elsewhere; only
 * this resample stage is approximate.)
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own audio only.
 */

import { loadFirCoeffs, FIR_PHASES, FIR_TAPS } from './nw1-fir.generated';

let COEFFS: Float32Array | null = null;
const coeffs = () => (COEFFS ??= loadFirCoeffs());

export interface ResampleOptions {
  /** Input samples advanced per output sample = srcRate / dstRate. */
  ratio: number;
  /** Output length per channel. Default `round(inputLen / ratio)`. */
  outLength?: number;
  /**
   * Initial input position for output[0] (fractional). Default 0 — output aligned
   * to the input start; the symmetric kernel zero-pads past the edges. The editor
   * uses a small negative latency (a brief kernel ramp-in); set this to match.
   */
  startPos?: number;
}

/**
 * Resample one channel of integer PCM with the editor's polyphase windowed-sinc.
 * Accumulates in float64 (higher precision than the editor's float32 — perceptually
 * identical, may differ sub-LSB) and rounds to integers.
 */
function resampleChannel(input: ArrayLike<number>, g: Float32Array, ratio: number, outLength: number, startPos: number): Int32Array {
  const n = input.length;
  const at = (j: number) => (j >= 0 && j < n ? input[j] : 0);
  const out = new Int32Array(outLength);
  for (let o = 0; o < outLength; o++) {
    const pos = startPos + o * ratio;
    const i = Math.floor(pos);
    let phase = Math.floor((pos - i) * FIR_PHASES);
    if (phase >= FIR_PHASES) phase = FIR_PHASES - 1;
    let acc = 0;
    // backward taps: sample (i-k), coeff g[k*512 + phase]
    for (let k = 0; k < FIR_TAPS; k++) acc += at(i - k) * g[k * FIR_PHASES + phase];
    // forward taps: sample (i+1+k), coeff g[(k+1)*512 - phase]
    for (let k = 0; k < FIR_TAPS; k++) {
      const idx = (k + 1) * FIR_PHASES - phase;
      if (idx >= 0 && idx < g.length) acc += at(i + 1 + k) * g[idx];
    }
    out[o] = Math.round(acc);
  }
  return out;
}

/** Resample every channel; `ratio = srcRate / dstRate`. */
export function resampleNW1(channels: ArrayLike<number>[], opts: ResampleOptions): Int32Array[] {
  const g = coeffs();
  const inLen = channels[0]?.length ?? 0;
  const outLength = opts.outLength ?? Math.round(inLen / opts.ratio);
  const startPos = opts.startPos ?? 0;
  return channels.map((ch) => resampleChannel(ch, g, opts.ratio, outLength, startPos));
}

/** Convenience: resample from a source sample rate to a destination rate. */
export function resampleToRate(channels: ArrayLike<number>[], srcRate: number, dstRate: number): Int32Array[] {
  return resampleNW1(channels, { ratio: srcRate / dstRate });
}
