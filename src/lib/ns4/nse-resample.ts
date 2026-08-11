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
 * A Kaiser-windowed sinc, built once per export as a polyphase table (transcend-
 * entals precomputed, so the hot loop is a plain multiply-accumulate): linear-
 * phase, ~−90 dB stopband, and each output sample is normalised by its tap sum so
 * the passband gain is exactly unity (also handling the zero-padded edges cleanly).
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
  /**
   * Fractional-delay resolution (sub-phases) of the precomputed polyphase table.
   * Default 1024 — the per-output delay is quantised to 1/1024 sample, inaudible
   * (finer than the import kernel's 512) and it keeps the hot loop a pure
   * multiply-accumulate.
   */
  phases?: number;
}

/**
 * A ratio-aware Kaiser-windowed-sinc resampling kernel, precomputed once as a
 * polyphase table so the per-sample hot loop carries no transcendentals — the
 * naive form recomputed a Bessel/sinc per tap per output frame, which froze the
 * export for seconds on a long stroke.
 */
interface PolyKernel {
  /** `taps × phases` coefficients, row-major by phase: `coeff[phase*taps + t]`. */
  readonly coeff: Float64Array;
  /** Per-phase sum of all taps — the interior (all-taps-valid) normaliser. */
  readonly norm: Float64Array;
  readonly taps: number;
  readonly halfWidth: number;
  readonly phases: number;
}

/** Build the polyphase table for cutoff `fc` (cycles per input sample, ≤ 0.5). */
function buildKernel(halfWidth: number, beta: number, fc: number, phases: number): PolyKernel {
  const taps = 2 * halfWidth;            // tap t → k = t - halfWidth + 1, i.e. k ∈ [-halfWidth+1, halfWidth]
  const i0Beta = besselI0(beta);
  const coeff = new Float64Array(taps * phases);
  const norm = new Float64Array(phases);
  for (let p = 0; p < phases; p++) {
    const frac = p / phases;             // fractional delay this phase represents
    let sum = 0;
    for (let t = 0; t < taps; t++) {
      const k = t - halfWidth + 1;
      const tau = k - frac;              // tap distance from the (fractional) resample point
      const r = tau / halfWidth;         // Kaiser window over (-1, 1); zero outside
      let w = 0;
      if (r > -1 && r < 1) {
        const win = besselI0(beta * Math.sqrt(1 - r * r)) / i0Beta;
        w = 2 * fc * sinc(2 * fc * tau) * win;
      }
      coeff[p * taps + t] = w;
      sum += w;
    }
    norm[p] = sum;
  }
  return { coeff, norm, taps, halfWidth, phases };
}

/**
 * Resample one channel through a prebuilt polyphase kernel. Output stays
 * **floating point** — rounding to integers here would quantise a quiet stroke to
 * a coarse staircase that the downstream peak auto-gain (`normalizeChannels`) then
 * amplifies to full scale. The single quantisation to int16 happens once, in the
 * WAV encoder, after normalisation.
 */
function resampleChannel(input: ArrayLike<number>, ratio: number, outLength: number, k: PolyKernel): Float64Array {
  const n = input.length;
  const { coeff, norm, taps, halfWidth, phases } = k;
  const out = new Float64Array(outLength);
  for (let o = 0; o < outLength; o++) {
    const pos = o * ratio;
    const center = Math.floor(pos);
    let phase = ((pos - center) * phases) | 0;
    if (phase >= phases) phase = phases - 1;
    const base = phase * taps;
    const first = center - halfWidth + 1;   // input index of tap 0
    let acc = 0;
    if (first >= 0 && first + taps <= n) {
      // Interior: every tap is in range → use the precomputed per-phase norm.
      for (let t = 0; t < taps; t++) acc += input[first + t] * coeff[base + t];
      out[o] = acc / norm[phase];
    } else {
      // Edge: renormalise over the in-range taps only (keeps DC/unity gain).
      let wsum = 0;
      for (let t = 0; t < taps; t++) {
        const idx = first + t;
        if (idx < 0 || idx >= n) continue;
        const w = coeff[base + t];
        acc += input[idx] * w;
        wsum += w;
      }
      out[o] = wsum !== 0 ? acc / wsum : 0;
    }
  }
  return out;
}

/**
 * Resample every channel from `srcRate` to `dstRate` with a linear-phase
 * Kaiser-windowed sinc. Returns floating-point PCM (unrounded — see
 * {@link resampleChannel}); the kernel is built once and shared across channels.
 *
 * **Cutoff is ratio-aware.** Upsampling has no aliasing constraint below the
 * source Nyquist, so the cutoff sits right at (just under) it — preserving the
 * whole source band. Downsampling must reach its stopband before the *new, lower*
 * Nyquist, so there the cutoff backs off by `cutoffScale` to leave a transition
 * band and prevent aliasing.
 */
export function resampleForExport(
  channels: ArrayLike<number>[],
  srcRate: number,
  dstRate: number,
  opts: SincResampleOptions = {},
): Float64Array[] {
  const halfWidth = opts.halfWidth ?? 32;
  const beta = opts.beta ?? 12;
  const cutoffScale = opts.cutoffScale ?? 0.90;
  const phases = opts.phases ?? 1024;
  const ratio = srcRate / dstRate;
  // Cutoff in cycles per input sample (≤ 0.5). Upsample → cut at ~source Nyquist
  // (a hair under 0.5, so the top bin isn't in the −6 dB half-band roll); downsample
  // → cut at the new Nyquist minus the transition margin so it anti-aliases.
  const fc = dstRate >= srcRate
    ? 0.5 * 0.985
    : 0.5 * (dstRate / srcRate) * cutoffScale;
  const kernel = buildKernel(halfWidth, beta, fc, phases);
  const inLen = channels[0]?.length ?? 0;
  const outLength = Math.round(inLen / ratio);
  return channels.map((ch) => resampleChannel(ch, ratio, outLength, kernel));
}
