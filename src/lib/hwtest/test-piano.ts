/**
 * Tiny synthetic test pianos for the first hardware load of a home-made `.npno`
 * (the maintainers’ notes, group B; the maintainers’ notes, "Hardware test recipe").
 *
 * Every tone is generated here from sines: no Nord audio is involved, so the files may be
 * shared freely. They are still written to the gitignored `hardware-test/` folder, next to
 * the user's recordings, and are never committed.
 *
 * Key **A4 plays 440 Hz** (T3 adds a zone whose top key A3 plays 220 Hz). A zone's top key is
 * one above the root the file stores, as in the factory pianos, and the instrument plays a
 * recording 3 semitones below its 44.1 kHz pitch there (`NPNO_RECORDING_ABOVE_TOP_KEY`,
 * the maintainers’ notes). So the tones are generated 3 semitones up, at C5 (and C4), and the
 * keys below the top key test transposition.
 */
import { NSP_SAMPLE_RATE } from '../ns4/nsp-audio';
import { NPNO_PEAK, NPNO_PIANO_TYPE, NPNO_RECORDING_ABOVE_TOP_KEY, type NpnoInput } from '../ns4/nsp-write';
/** The top key of the main zone: A4, which plays 440 Hz. */
export const TEST_PIANO_NOTE = 69;
/** The note the main zone's recording sounds at when played at 44.1 kHz: C5. */
export const TEST_PIANO_RECORDED_NOTE = TEST_PIANO_NOTE + NPNO_RECORDING_ABOVE_TOP_KEY;
/**
 * Loop length of every looped test tone, in frames (about 0.5 s). It holds 262 cycles of the
 * C5 tone and 131 of the C4 one, which puts them 0.04 cents below equal temperament.
 */
export const TEST_LOOP_FRAMES = 22082;
/** The frequency with `cycles` whole cycles in {@link TEST_LOOP_FRAMES}. */
const loopHz = (cycles: number) => (cycles * NSP_SAMPLE_RATE) / TEST_LOOP_FRAMES;
/** C5 (523.24 Hz): key A4 plays it at 440 Hz. */
export const TEST_TONE_HZ = loopHz(262);
/** C4 (261.62 Hz): key A3 plays it at 220 Hz. */
const LOW_TONE_HZ = loopHz(131);
const LOOP_SECONDS = TEST_LOOP_FRAMES / NSP_SAMPLE_RATE;
/** Lowest key of the main zone: A3, an octave below the recording. */
export const TEST_PIANO_LOW = 57;

export interface TestToneOptions {
  hz: number;
  seconds: number;
  /** Relative amplitude of harmonics 1, 2, 3, … */
  harmonics: readonly number[];
  /**
   * Sustain loop over the last `loopSeconds`. The loop must hold whole cycles of `hz`
   * (0.5 s holds 220 cycles of 440 Hz), so the seam is sample-exact.
   */
  loopSeconds?: number;
}

export interface TestTone {
  /** int16-range PCM, peak exactly {@link NPNO_PEAK} (the factory stroke peak). */
  pcm: Int16Array;
  loop?: { start: number; length: number };
}

const ATTACK_S = 0.004;

/**
 * A piano-like test tone: a 4 ms rise, then a smooth decay. With a loop the level settles at
 * half the peak (−6 dB) 64 frames before the loop starts and stays there, so the loop is a
 * steady, exactly periodic stretch (the instrument adds its own loop decay). Without a loop
 * it decays to about −30 dB and fades out over the last 20 ms.
 */
export function testTone(o: TestToneOptions): TestTone {
  const sr = NSP_SAMPLE_RATE;
  const n = Math.round(o.seconds * sr);
  const loopLen = o.loopSeconds ? Math.round(o.loopSeconds * sr) : 0;
  if (loopLen) {
    const cycles = (o.hz * loopLen) / sr;
    if (Math.abs(cycles - Math.round(cycles)) > 1e-9) throw new Error(`A ${o.loopSeconds} s loop doesn't hold whole cycles of ${o.hz} Hz.`);
  }
  const loopStart = n - loopLen;
  const attack = Math.round(ATTACK_S * sr);
  const settle = loopLen ? loopStart - 64 : n;
  const fadeOut = loopLen ? 0 : Math.round(0.02 * sr);
  const raw = new Float64Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    // Phase index: inside a loop, i and i + loopLen give the identical sample.
    const k = loopLen ? i % loopLen : i;
    let w = 0;
    o.harmonics.forEach((a, h) => { w += a * Math.sin((2 * Math.PI * (h + 1) * o.hz * k) / sr); });
    let env: number;
    if (i < attack) env = 0.5 - 0.5 * Math.cos((Math.PI * i) / attack);
    else if (loopLen) env = i >= settle ? 0.5 : 0.5 * 2 ** (1 - (i - attack) / (settle - attack));
    else env = 10 ** ((-30 * (i - attack)) / (n - attack) / 20);
    if (fadeOut && i >= n - fadeOut) env *= (n - i) / fadeOut;
    raw[i] = w * env;
    peak = Math.max(peak, Math.abs(raw[i]));
  }
  const g = NPNO_PEAK / peak;
  const pcm = Int16Array.from(raw, (v) => Math.round(v * g) + 0); // + 0: no -0
  return { pcm, loop: loopLen ? { start: loopStart, length: loopLen } : undefined };
}

/** A warm "sine plus harmonics" tone: clearly pitched, easy to tune against. */
const WARM = [1, 0.4, 0.2, 0.1] as const;
/** A bright, buzzy tone (sawtooth-like, 16 harmonics). */
const BRIGHT = Array.from({ length: 16 }, (_, h) => 1 / (h + 1));
/** A nearly pure sine. */
const PURE = [1, 0.03] as const;

export type TestPianoId = 'T0' | 'T1' | 'T2' | 'T3';

export interface TestPianoSpec {
  id: TestPianoId;
  /** What loading this file checks, in plain words. */
  purpose: string;
  input: NpnoInput;
}

const stereo = (t: TestTone) => ({ pcm: [t.pcm, t.pcm], loop: t.loop });

/** The four test pianos (T3 is optional in the plan); build each with `buildNpno(spec.input)`. */
export function testPianoSpecs(): TestPianoSpec[] {
  const zoneA4 = { rootNote: TEST_PIANO_RECORDED_NOTE, lowNote: TEST_PIANO_LOW, highNote: TEST_PIANO_NOTE };
  const base = { minor: 0, pianoType: NPNO_PIANO_TYPE.grand, channels: 2 as const };
  return [
    {
      id: 'T0',
      purpose: 'Container check: one zone (A3–A4), one layer, 2 s, no loop. Plays A4 = 440 Hz on key A4.',
      input: { ...base, name: 'OpenNord Test 0', variant: 'A440 no loop', zones: [
        { ...zoneA4, layers: [{ ...stereo(testTone({ hz: TEST_TONE_HZ, seconds: 2, harmonics: WARM })), floorDb: 0 }] },
      ] },
    },
    {
      id: 'T1',
      purpose: 'Loop check: as T0, with a 0.5 s sustain loop after 1 s. A held key keeps sounding.',
      input: { ...base, name: 'OpenNord Test 1', variant: 'A440 loop', zones: [
        { ...zoneA4, layers: [{ ...stereo(testTone({ hz: TEST_TONE_HZ, seconds: 1.5, harmonics: WARM, loopSeconds: LOOP_SECONDS })), floorDb: 0 }] },
      ] },
    },
    {
      id: 'T2',
      purpose: 'Touch check: one zone, two layers. Hard = bright and buzzy, soft = a pure sine; same pitch and peak level.',
      input: { ...base, name: 'OpenNord Test 2', variant: 'A440 2 layers', zones: [
        { ...zoneA4, layers: [
          { ...stereo(testTone({ hz: TEST_TONE_HZ, seconds: 1.5, harmonics: BRIGHT, loopSeconds: LOOP_SECONDS })), floorDb: 0 },
          { ...stereo(testTone({ hz: TEST_TONE_HZ, seconds: 1.5, harmonics: PURE, loopSeconds: LOOP_SECONDS })), floorDb: 20 },
        ] },
      ] },
    },
    {
      id: 'T3',
      purpose: 'Zone check (optional): two zones, A2–A3 (220 Hz on key A3) and A#3–A4 (440 Hz on key A4); both looped.',
      input: { ...base, name: 'OpenNord Test 3', variant: 'A220+A440', zones: [
        { rootNote: 57 + NPNO_RECORDING_ABOVE_TOP_KEY, lowNote: 45, highNote: 57, layers: [
          { ...stereo(testTone({ hz: LOW_TONE_HZ, seconds: 1.5, harmonics: WARM, loopSeconds: LOOP_SECONDS })), floorDb: 0 },
        ] },
        { rootNote: TEST_PIANO_RECORDED_NOTE, lowNote: 58, highNote: TEST_PIANO_NOTE, layers: [
          { ...stereo(testTone({ hz: TEST_TONE_HZ, seconds: 1.5, harmonics: WARM, loopSeconds: LOOP_SECONDS })), floorDb: 0 },
        ] },
      ] },
    },
  ];
}
