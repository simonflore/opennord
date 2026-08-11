/**
 * Band-preserving sample-rate converter for the **WAV export** path.
 *
 * The import resampler (`nw1-resample.ts`) deliberately reuses the Nord Sample
 * Editor's own fixed windowed-sinc, so audio imported *into* a Nord matches what
 * the instrument would store. That kernel's cutoff sits at the internal Nyquist of
 * the editor's import *downsample* (≈0.367 cycles/input-sample) — correct there,
 * wrong for going the other way. Reusing it to *upsample* a decoded ~35 kHz stroke
 * for export bandlimits to that same 0.367, discarding real source content between
 * ~13 kHz and the stroke's ~17.5 kHz Nyquist (measured: −3.4 dB @14 kHz, −10 dB
 * @15 kHz, −23 dB @16 kHz).
 *
 * Export is an interop/audit path (audition, re-use in a DAW, re-import into NSE),
 * **not** a write-back-to-instrument path, so it wants a *ratio-aware* filter: the
 * cutoff tracks the lower of the source/destination Nyquists, so an upsample keeps
 * the entire source band and a (rare, fine-tuned) downsample still anti-aliases.
 *
 * A Kaiser-windowed sinc, computed per call (no static table): linear-phase,
 * ~−90 dB stopband, and each output sample is normalised by its own tap sum so the
 * passband gain is exactly unity (also handling the zero-padded edges cleanly).
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own decoded audio only.
 */

/** Modified Bessel function of the first kind, order 0 — for the Kaiser window. */
function besselI0(x: number): number {
  // Series Σ ((x/2)^k / k!)^2; converges quickly for the β range used here.
  let sum = 1;
  let term = 1;
  const halfXSq = (x * x) / 4;
  for (let k = 1; k < 64; k++) {
    term *= halfXSq / (k * k);
    sum += term;
    if (term < sum * 1e-12) break;
  }
  return sum;
}

/** `sin(πx)/(πx)`, with the removable singularity at 0. */
function sinc(x: number): number {
  if (x === 0) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

export interface SincResampleOptions {
  /** Half-width of the kernel in input samples (taps each side). Default 32. */
  halfWidth?: number;
  /** Kaiser β (stopband/transition trade-off). Default 12 (~−105 dB stopband). */
  beta?: number;
  /**
   * Passband edge as a fraction of the lower Nyquist. Default 0.90 — leaves a
   * transition band below Nyquist so the passband stays flat (no droop) right up
   * to ~0.45·min(src,dst). Lower = flatter passband, wider transition.
   */
  cutoffScale?: number;
}

/** Resample one channel of integer PCM with a ratio-aware Kaiser-windowed sinc. */
function resampleChannelSinc(
  input: ArrayLike<number>,
  ratio: number,        // input samples advanced per output sample = srcRate / dstRate
  outLength: number,
  halfWidth: number,
  beta: number,
  fc: number,           // cutoff in cycles per *input* sample (≤ 0.5)
): Int32Array {
  const n = input.length;
  const i0Beta = besselI0(beta);
  const out = new Int32Array(outLength);
  for (let o = 0; o < outLength; o++) {
    const pos = o * ratio;
    const center = Math.floor(pos);
    let acc = 0;
    let wsum = 0;
    for (let k = -halfWidth + 1; k <= halfWidth; k++) {
      const idx = center + k;
      if (idx < 0 || idx >= n) continue;     // edge: renormalise over in-range taps only
      const tau = idx - pos;                 // distance from the resample point, in input samples
      // Kaiser window over [-halfWidth, halfWidth]; zero outside.
      const r = tau / halfWidth;
      if (r <= -1 || r >= 1) continue;
      const win = besselI0(beta * Math.sqrt(1 - r * r)) / i0Beta;
      const w = 2 * fc * sinc(2 * fc * tau) * win;
      acc += input[idx] * w;
      wsum += w;
    }
    out[o] = wsum !== 0 ? Math.round(acc / wsum) : 0;
  }
  return out;
}

/**
 * Resample every channel from `srcRate` to `dstRate` with a linear-phase
 * Kaiser-windowed sinc whose cutoff tracks the lower Nyquist — preserving the full
 * source band on upsample and anti-aliasing on downsample. Returns integer PCM
 * (rounded), matching the shape the WAV encoder consumes.
 */
export function resampleForExport(
  channels: ArrayLike<number>[],
  srcRate: number,
  dstRate: number,
  opts: SincResampleOptions = {},
): Int32Array[] {
  const halfWidth = opts.halfWidth ?? 32;
  const beta = opts.beta ?? 12;
  const cutoffScale = opts.cutoffScale ?? 0.90;
  const ratio = srcRate / dstRate;
  // Cutoff at the lower Nyquist, expressed in cycles per input sample (≤ 0.5).
  const fc = 0.5 * Math.min(1, dstRate / srcRate) * cutoffScale;
  const inLen = channels[0]?.length ?? 0;
  const outLength = Math.round(inLen / ratio);
  return channels.map((ch) => resampleChannelSinc(ch, ratio, outLength, halfWidth, beta, fc));
}
