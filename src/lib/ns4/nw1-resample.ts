/**
 * Sample-rate converter for WAV import: converts a user's audio to the Nord's
 * internal storage rate before encoding, with OpenNord's own ratio-aware
 * Kaiser-windowed sinc ({@link resampleSinc}, shared with WAV export).
 *
 * It keeps pitch and level; it is not sample-identical to what the official
 * editor would store, which isn't needed: the keyboard cares about container and
 * codec correctness, which the writers reproduce exactly. See the maintainers’ notes.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own audio only.
 */

import { resampleSinc } from './nse-resample';

export interface ResampleOptions {
  /** Input samples advanced per output sample = srcRate / dstRate. */
  ratio: number;
  /** Output length per channel. Default `round(inputLen / ratio)`. */
  outLength?: number;
  /**
   * Initial input position for output[0] (fractional). Default 0 — output aligned
   * to the input start; the kernel renormalises over the taps inside the input at
   * the edges.
   */
  startPos?: number;
}

/** Resample every channel to integer PCM; `ratio = srcRate / dstRate`. */
export function resampleNW1(channels: ArrayLike<number>[], opts: ResampleOptions): Int32Array[] {
  return resampleSinc(channels, opts.ratio, { outLength: opts.outLength, startPos: opts.startPos })
    .map((ch) => Int32Array.from(ch, (v) => Math.round(v)));
}

/** Convenience: resample from a source sample rate to a destination rate. */
export function resampleToRate(channels: ArrayLike<number>[], srcRate: number, dstRate: number): Int32Array[] {
  return resampleNW1(channels, { ratio: srcRate / dstRate });
}
