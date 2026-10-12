/**
 * Stage 4 synth parameter scaling: raw program values (0..127 unless noted) to
 * audible quantities, as recovered from the Stage 4 OS v1.66 firmware.
 *
 * These are formulas written from our own analysis of how the firmware scales
 * each knob,
 * not copies of its tables. Where the firmware uses a table, the function
 * reproduces the table's shape with a fitted closed form; the doc gives the
 * fit error. Every function is pure and side-effect free.
 */

/** Semitones of the filter cutoff above 277.18 Hz (C#4) for a raw cutoff value. */
export function cutoffSemitones(raw: number): number {
  const v = Math.min(127, Math.max(0, raw));
  if (v >= 127) return 106; // fully open: far above audio range
  if (v > 117) return 65 + 1.7 * (v - 117);
  return v - 52;
}

/** Filter cutoff in Hz: 440·2^((v−60)/12) up to v = 117, steeper above, open at 127. */
export function cutoffHz(raw: number): number {
  return 277.1826 * Math.pow(2, cutoffSemitones(raw) / 12);
}

/** Inverse of {@link cutoffHz}: the raw cutoff step (0–127, fractional) a frequency sits at. */
export function cutoffRaw(hz: number): number {
  const semis = 12 * Math.log2(hz / 277.1826);
  const v = semis > 65 ? 117 + (semis - 65) / 1.7 : semis + 52;
  return Math.min(127, Math.max(0, v));
}

/** Keyboard tracking factor for the 2-bit "filter track" value (off, 1/3, 2/3, 3/3). */
export function keyTrackFactor(raw: number): number {
  return [0, 1 / 3, 2 / 3, 1][Math.min(3, Math.max(0, raw | 0))];
}

/**
 * State-variable-filter damping k (= 1/Q) for a raw resonance value. The LP12
 * kernel's table is exactly this quadratic; k = 2 is no resonance.
 */
export function resonanceDamping(raw: number): number {
  const v = Math.min(127, Math.max(0, Math.round(raw)));
  const x = 1 - v / 128;
  return 2 * x * x;
}

/** Attack time in seconds (linear rise from 0 to full level). 0.5 ms … 45 s. */
export function attackSeconds(raw: number): number {
  const v = Math.min(127, Math.max(0, raw));
  return 0.0005 * Math.pow(1 + v / 40.2, 8);
}

/**
 * Decay or release time in seconds, defined as the time to fall 40 dB
 * (the segment is a pure exponential towards zero). 3 ms … 45 s.
 * Returns `Infinity` for a decay of 127 ("inf" = hold until release); pass
 * `isDecay = false` for release, whose 127 is a finite 45 s.
 */
export function decaySeconds(raw: number, isDecay = true): number {
  const v = Math.min(127, Math.max(0, raw));
  if (isDecay && v >= 127) return Infinity;
  return 0.003 * Math.pow(1 + v / 54.1, 7.958);
}

/**
 * Level ratio a decay or release segment covers in its displayed time: the
 * firmware's decay/release coefficient table and the displayed times agree on a
 * 40 dB drop.
 */
export const ENV_DISPLAY_DROP = 100;

/** Exponential time constant (seconds) of a decay/release segment. */
export function decayTimeConstant(raw: number, isDecay = true): number {
  return decaySeconds(raw, isDecay) / Math.log(ENV_DISPLAY_DROP);
}

/** Free-running LFO rate in Hz: about 0.03 Hz … 523 Hz, one octave per ~9 steps. */
export function lfoRateHz(raw: number): number {
  const v = Math.min(127, Math.max(0, raw));
  return 0.02846 * Math.pow(2, v / 8.966);
}

/**
 * The firmware's shared modulation-depth curve, in semitones, for a raw amount
 * 0..127: a smooth curve to 0.5 st at 20, then near-linear runs through these
 * landmarks (the curve the LFO→pitch amount and the FM-mode OSC CTRL use).
 * The landmarks are points of the displayed curve, chosen so that straight runs
 * between them stay within the display's rounding at every raw value from 20 up
 * (±0.05 st below 12.5 st, ±0.25 st above, where it shows half semitones); below
 * 20 the smooth part is within 3 cents of the displayed cents
 * (synth-scaling.test.ts checks the whole table).
 */
const DEPTH_LANDMARKS: ReadonlyArray<readonly [number, number]> = [
  [20, 0.5],
  [21, 0.53],
  [23, 0.66],
  [25, 0.82],
  [29, 1.2],
  [36, 2],
  [40, 2.7],
  [42, 3],
  [48, 4.2],
  [50, 4.8],
  [52, 5.2],
  [54, 5.8],
  [56, 6.2],
  [60, 7.3],
  [64, 8.7],
  [68, 10],
  [69, 10.6],
  [73, 12],
  [83, 16.5],
  [95, 23],
  [99, 26],
  [107, 31],
  [109, 33],
  [111, 34],
  [114, 37],
  [116, 38],
  [120, 42],
  [122, 43],
  [127, 48],
];

export function depthCurveSemitones(raw: number): number {
  const v = Math.min(127, Math.max(0, raw));
  if (v <= 20) return 0.5 * Math.pow(v / 20, 2.5);
  for (let i = 1; i < DEPTH_LANDMARKS.length; i++) {
    const [x1, y1] = DEPTH_LANDMARKS[i];
    if (v <= x1) {
      const [x0, y0] = DEPTH_LANDMARKS[i - 1];
      return y0 + ((y1 - y0) * (v - x0)) / (x1 - x0);
    }
  }
  return 48;
}

/** Oscillator pitch offset in semitones from coarse (−24..24 semitones) and fine (−50..50 cents). */
export function oscTuneSemitones(coarse: number, fineCents: number): number {
  return coarse + fineCents / 100;
}

/** FM-H modulator ratios, indexed by the FM-H wave value (25 steps). */
export const FM_HARMONIC_RATIOS: readonly number[] = [0.5, ...Array.from({ length: 24 }, (_, i) => i + 1)];

/** FM-I modulator ratio for a wave value 0..60 (semitone offsets −12..+48). */
export function fmInharmonicRatio(raw: number): number {
  return Math.pow(2, (Math.min(60, Math.max(0, raw)) - 12) / 12);
}
