/**
 * Tiny synthetic test pianos for the first hardware load of a home-made `.npno`
 * (the maintainers’ notes, group B; the maintainers’ notes, "Hardware test recipe").
 *
 * Every tone is generated here from sines: no Nord audio is involved, so the files may be
 * shared freely. They are still written to the gitignored `hardware-test/` folder, next to
 * the user's recordings, and are never committed.
 *
 * Each recording sounds at **A4 = 440 Hz** (T3 adds an A3 = 220 Hz zone) and every zone's
 * highest key is its recorded note, as in the factory pianos' top zones: the instrument only
 * plays a stroke at or below its recorded pitch, so the keys
 * below it test transposition and key A4 tests the recorded pitch itself.
 */
import { NSP_SAMPLE_RATE } from '../ns4/nsp-audio';
import { NPNO_PEAK, NPNO_PIANO_TYPE, type NpnoInput } from '../ns4/nsp-write';
/** The recorded note of the main zone: A4. */
export const TEST_PIANO_NOTE = 69;
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
  const zoneA4 = { rootNote: TEST_PIANO_NOTE, lowNote: TEST_PIANO_LOW, highNote: TEST_PIANO_NOTE };
  const base = { minor: 0, pianoType: NPNO_PIANO_TYPE.grand, channels: 2 as const };
  return [
    {
      id: 'T0',
      purpose: 'Container check: one zone (A3–A4), one layer, 2 s, no loop. Plays A4 = 440 Hz on key A4.',
      input: { ...base, name: 'OpenNord Test 0', variant: 'A440 no loop', zones: [
        { ...zoneA4, layers: [{ ...stereo(testTone({ hz: 440, seconds: 2, harmonics: WARM })), floorDb: 0 }] },
      ] },
    },
    {
      id: 'T1',
      purpose: 'Loop check: as T0, with a 0.5 s sustain loop after 1 s. A held key keeps sounding.',
      input: { ...base, name: 'OpenNord Test 1', variant: 'A440 loop', zones: [
        { ...zoneA4, layers: [{ ...stereo(testTone({ hz: 440, seconds: 1.5, harmonics: WARM, loopSeconds: 0.5 })), floorDb: 0 }] },
      ] },
    },
    {
      id: 'T2',
      purpose: 'Touch check: one zone, two layers. Hard = bright and buzzy, soft = a pure sine; same pitch and peak level.',
      input: { ...base, name: 'OpenNord Test 2', variant: 'A440 2 layers', zones: [
        { ...zoneA4, layers: [
          { ...stereo(testTone({ hz: 440, seconds: 1.5, harmonics: BRIGHT, loopSeconds: 0.5 })), floorDb: 0 },
          { ...stereo(testTone({ hz: 440, seconds: 1.5, harmonics: PURE, loopSeconds: 0.5 })), floorDb: 20 },
        ] },
      ] },
    },
    {
      id: 'T3',
      purpose: 'Zone check (optional): A2–A3 plays a 220 Hz recording, A#3–A4 a 440 Hz one; both looped.',
      input: { ...base, name: 'OpenNord Test 3', variant: 'A220+A440', zones: [
        { rootNote: 57, lowNote: 45, highNote: 57, layers: [
          { ...stereo(testTone({ hz: 220, seconds: 1.5, harmonics: WARM, loopSeconds: 0.5 })), floorDb: 0 },
        ] },
        { rootNote: TEST_PIANO_NOTE, lowNote: 58, highNote: TEST_PIANO_NOTE, layers: [
          { ...stereo(testTone({ hz: 440, seconds: 1.5, harmonics: WARM, loopSeconds: 0.5 })), floorDb: 0 },
        ] },
      ] },
    },
  ];
}
