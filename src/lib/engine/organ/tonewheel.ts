/**
 * Tonewheel generator facts: the 91-wheel bank, its gear-ratio tuning, the
 * nine drawbar footages and the manual foldback rule.
 *
 * Everything here is public, general knowledge about the classic Hammond
 * B-3/C-3 tone generator (Hammond service manuals; summarized in Electric
 * Druid, "Technical aspects of the Hammond organ"). None of it is taken from
 * Nord firmware or Nord data: it describes the instrument the Stage 4's B3
 * model emulates, not how Nord implements it.
 */

/** Main drive shaft speed of a 60 Hz synchronous-motor organ: 1200 rpm. */
export const MOTOR_RPS = 20;

/**
 * Driving / driven gear teeth for the twelve semitones, C..B. A tonewheel's
 * frequency is `MOTOR_RPS × teeth × driving / driven`; the gear sets the note,
 * the tooth count sets the octave. Only A lands exactly on equal temperament
 * (20 × 16 × 88/64 = 440 Hz).
 */
export const GEAR_TEETH: readonly (readonly [number, number])[] = [
  [85, 104], // C
  [71, 82],  // C#
  [67, 73],  // D
  [105, 108], // D#
  [103, 100], // E
  [84, 77],  // F
  [74, 64],  // F#
  [98, 80],  // G
  [96, 74],  // G#
  [88, 64],  // A
  [67, 46],  // A#
  [108, 70], // B
];

export const WHEEL_COUNT = 91;
/** Lowest wheel the manuals use; wheels 1–12 only serve the pedals. */
export const MANUAL_LOWEST_WHEEL = 13;
/** Wheels 1–12 are cut with a more complex profile (some 3rd and 5th harmonic). */
export const COMPLEX_WHEELS = 12;

/**
 * Frequency of tonewheel `wheel` (1..91) in Hz.
 *
 * Wheels 1–84 run seven octaves of 2, 4 … 128 teeth. The top seven (85–91,
 * C..F#) could not be cut with 256 teeth, so they use 192 teeth on the gears a
 * fourth higher (F..B) — which is why the top half octave sits up to ~2 cents
 * sharp.
 */
export function tonewheelFrequency(wheel: number): number {
  if (!Number.isInteger(wheel) || wheel < 1 || wheel > WHEEL_COUNT) {
    throw new RangeError(`tonewheel ${wheel} is outside 1..${WHEEL_COUNT}`);
  }
  const i = wheel - 1;
  if (wheel <= 84) {
    const teeth = 2 << Math.floor(i / 12);
    const [a, b] = GEAR_TEETH[i % 12];
    return (MOTOR_RPS * teeth * a) / b;
  }
  const [a, b] = GEAR_TEETH[(i % 12) + 5];
  return (MOTOR_RPS * 192 * a) / b;
}

/** Equal-tempered frequency of a MIDI note (A4 = 440 Hz). */
export function equalTempered(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Tonewheel 1 is C1 (MIDI 24); wheel n nominally plays MIDI note n + 23. */
export const WHEEL_MIDI_OFFSET = 23;

export interface Footage {
  /** Panel label, e.g. "5⅓′". */
  label: string;
  /** Semitones above (or below) the 8′ fundamental the drawbar's wheel sits. */
  semitones: number;
}

/** The nine drawbars, left to right, as on every B3-style organ. */
export const FOOTAGES: readonly Footage[] = [
  { label: '16′', semitones: -12 },  // sub-fundamental
  { label: '5⅓′', semitones: 7 },    // sub-third (a fifth above 8′)
  { label: '8′', semitones: 0 },     // fundamental
  { label: '4′', semitones: 12 },    // 2nd harmonic
  { label: '2⅔′', semitones: 19 },   // 3rd harmonic
  { label: '2′', semitones: 24 },    // 4th harmonic
  { label: '1⅗′', semitones: 28 },   // 5th harmonic (tempered third — ~14 cents sharp of 5:1)
  { label: '1⅓′', semitones: 31 },   // 6th harmonic
  { label: '1′', semitones: 36 },    // 8th harmonic
];

/** Drawbar index of the 1′ drawbar (silenced while percussion is on). */
export const DRAWBAR_1FT = 8;
/** Drawbar indices the percussion borrows its pitch from: 2nd = 4′, 3rd = 2⅔′. */
export const PERC_2ND = 3;
export const PERC_3RD = 4;

/**
 * Tonewheel for one drawbar of one key, with foldback.
 *
 * `midi` is the key being played. The manual's lowest C (MIDI 36) plays wheel
 * 13 on the 8′ drawbar. Harmonics that would run off the top of the 91-wheel
 * bank fold back an octave at a time; the 16′ on the lowest octave folds up
 * because the manuals never reach wheels 1–12 (the pedals do — pass
 * `lowestWheel = 1` for a true-bass voicing). Keys outside the 61-note manual
 * fold the same way, so every MIDI note maps to a real wheel.
 */
export function wheelFor(midi: number, drawbar: number, lowestWheel: number = MANUAL_LOWEST_WHEEL): number {
  const f = FOOTAGES[drawbar];
  if (!f) throw new RangeError(`drawbar ${drawbar} is outside 0..8`);
  let w = midi - WHEEL_MIDI_OFFSET + f.semitones;
  while (w > WHEEL_COUNT) w -= 12;
  while (w < lowestWheel) w += 12;
  return w;
}

/**
 * Drawbar position (0..8, fractional allowed while a morph moves it) → linear
 * gain. Each step is roughly 3 dB on a tonewheel organ's drawbar taps; 8 is
 * full level and 0 is silent.
 */
export function drawbarGain(level: number): number {
  if (!(level > 0)) return 0;
  const l = Math.min(8, level);
  return 10 ** ((-3 * (8 - l)) / 20);
}
