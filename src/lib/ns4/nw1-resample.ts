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

/** One sample to the symmetric 16-bit range the Nord codecs store. */
export const clamp16 = (v: number): number => Math.max(-32767, Math.min(32767, v));

/**
 * Clamp resampled channels to the symmetric 16-bit range the Nord codecs store (±32767). The
 * sinc filter overshoots on hot audio (a full-scale square reaches about 40,000); the writers
 * would encode such values wrongly and the file would read back without audio.
 */
export function clampPcm16(channels: ArrayLike<number>[]): ArrayLike<number>[] {
  return channels.map((ch) => {
    let i = 0;
    while (i < ch.length && ch[i] >= -32767 && ch[i] <= 32767) i++;
    if (i === ch.length) return ch; // already in range: no copy
    const out = Int32Array.from(ch);
    for (; i < out.length; i++) out[i] = clamp16(out[i]);
    return out;
  });
}
