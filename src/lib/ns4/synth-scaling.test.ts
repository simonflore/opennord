import { describe, expect, it } from 'vitest';
import { GENERATED_VALUES } from './values.generated';
import { DEP_TABLES } from './deps.generated';
import { parseHz, parseSeconds } from './synth-preview';
import {
  attackSeconds,
  cutoffHz,
  decaySeconds,
  decayTimeConstant,
  depthCurveSemitones,
  FM_HARMONIC_RATIOS,
  fmInharmonicRatio,
  keyTrackFactor,
  lfoRateHz,
  cutoffRaw,
  oscTuneSemitones,
  resonanceDamping,
} from './synth-scaling';

/** Every displayed value of a parameter, parsed with `parse`, keyed by raw value. */
function displayed(pid: string, parse: (s: string) => number | undefined): [number, number][] {
  return Object.entries(GENERATED_VALUES[pid])
    .map(([raw, s]) => [Number(raw), parse(s)] as const)
    .filter((e): e is readonly [number, number] => e[1] !== undefined && Number.isFinite(e[1]))
    .map(([r, v]) => [r, v]);
}

/** The display strings are rounded to 2–3 digits, so compare within a ratio. */
function expectRatio(actual: number, expected: number, tol: number): void {
  expect(Math.abs(Math.log(actual / expected))).toBeLessThan(Math.log(1 + tol));
}

describe('filter cutoff', () => {
  it('matches every displayed cutoff (587-6) except the fully-open 127', () => {
    for (const [raw, hz] of displayed('587-6', parseHz)) {
      if (raw === 127) continue;
      expectRatio(cutoffHz(raw), hz, 0.05);
    }
  });
  it('is 440·2^((v−60)/12) in the semitone-per-step range', () => {
    expect(cutoffHz(60)).toBeCloseTo(440, 1);
    expect(cutoffHz(72)).toBeCloseTo(880, 1);
    expect(cutoffHz(127)).toBeGreaterThan(100_000);
  });
  it('has the firmware key-tracking factors', () => {
    expect([0, 1, 2, 3].map(keyTrackFactor)).toEqual([0, 1 / 3, 2 / 3, 1]);
  });
});

describe('envelope times', () => {
  it('matches the displayed attack times (584-4)', () => {
    for (const [raw, s] of displayed('584-4', parseSeconds)) expectRatio(attackSeconds(raw), s, 0.06);
  });
  it('matches the displayed decay and release times (585-3, 586-2)', () => {
    for (const [raw, s] of displayed('585-3', parseSeconds)) {
      if (s === Infinity) expect(decaySeconds(raw)).toBe(Infinity);
      else expectRatio(decaySeconds(raw), s, 0.05);
    }
    for (const [raw, s] of displayed('586-2', parseSeconds)) expectRatio(decaySeconds(raw, false), s, 0.05);
  });
  it('defines decay time as a 40 dB drop', () => {
    expect(decayTimeConstant(64) * Math.log(100)).toBeCloseTo(decaySeconds(64));
  });
});

describe('resonance, LFO, depth curve, tuning', () => {
  it('uses k = 2·(1 − r/128)²', () => {
    expect(resonanceDamping(0)).toBe(2);
    expect(resonanceDamping(64)).toBeCloseTo(0.5);
    expect(resonanceDamping(127)).toBeCloseTo(2 / 128 ** 2);
  });
  it('spans the displayed LFO range', () => {
    expect(lfoRateHz(0)).toBeCloseTo(0.0285, 3);
    expectRatio(lfoRateHz(64), 4.1, 0.03);
    expectRatio(lfoRateHz(127), 523, 0.02);
  });
  it('matches every displayed free LFO rate (576-6) within its rounding plus 4.5%', () => {
    // The display rounds to 2–3 digits ("0.06 Hz", "4.1 Hz", "523 Hz"). Beyond that the
    // exponential is up to ~4% off: the display table steps 0.38 → 0.44 Hz between 34
    // and 35 (+15%, against +8% for its neighbours), and the exponential through the
    // firmware table's end points runs between the two halves.
    const t = DEP_TABLES['576-6'];
    for (let raw = 0; raw <= 127; raw++) {
      const s = /^(\d+(?:\.(\d+))?) Hz$/.exec(t[`0:${raw}`])!;
      const shown = Number(s[1]);
      const half = 0.5 * 10 ** -(s[2]?.length ?? 0);
      expect(Math.abs(lfoRateHz(raw) - shown), `raw ${raw}: ${t[`0:${raw}`]}`).toBeLessThanOrEqual(half + 0.045 * shown);
    }
  });
  it('hits the depth-curve landmarks', () => {
    expect(depthCurveSemitones(0)).toBe(0);
    expect(depthCurveSemitones(20)).toBeCloseTo(0.5);
    expect(depthCurveSemitones(64)).toBeCloseTo(8.7, 9);
    expect(depthCurveSemitones(116)).toBe(38); // the old fit was 0.67 st sharp here
    expect(depthCurveSemitones(127)).toBe(48);
  });
  it('matches every displayed LFO→pitch depth (580-5) within its rounding', () => {
    // Displayed in whole cents below 1 semi, in tenths to 12 semi, in half semitones
    // above. The smooth part below raw 20 is allowed 3 cents more.
    const t = DEP_TABLES['580-5'];
    for (let raw = 0; raw <= 127; raw++) {
      const [n, unit] = t[`2:${raw}`].split(' ');
      const shown = unit === 'cent' ? Number(n) / 100 : Number(n);
      const tol = unit === 'cent' ? 0.005 + (raw < 20 ? 0.03 : 0) : shown < 12.5 ? 0.05 : 0.25;
      expect(Math.abs(depthCurveSemitones(raw) - shown), `raw ${raw}: ${t[`2:${raw}`]}`).toBeLessThanOrEqual(tol + 1e-9);
    }
  });
  it('tunes in semitones and cents, and lists the FM ratios', () => {
    expect(oscTuneSemitones(-12, 50)).toBeCloseTo(-11.5);
    expect(FM_HARMONIC_RATIOS).toHaveLength(25);
    expect(FM_HARMONIC_RATIOS[0]).toBe(0.5);
    expect(FM_HARMONIC_RATIOS[24]).toBe(24);
    expect(fmInharmonicRatio(12)).toBe(1);
    expect(fmInharmonicRatio(24)).toBe(2);
  });
});

describe('cutoffRaw', () => {
  it('inverts cutoffHz across the whole knob, including the steeper top', () => {
    for (const raw of [0, 30, 60, 99, 117, 120, 123, 126]) {
      expect(cutoffRaw(cutoffHz(raw)), `raw ${raw}`).toBeCloseTo(raw, 5);
    }
  });
  it('clamps outside the range', () => {
    expect(cutoffRaw(1)).toBe(0);
    expect(cutoffRaw(1e6)).toBe(127);
  });
});
