import { describe, expect, it } from 'vitest';
import { GENERATED_VALUES } from './values.generated';
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
  it('hits the depth-curve landmarks', () => {
    expect(depthCurveSemitones(0)).toBe(0);
    expect(depthCurveSemitones(20)).toBeCloseTo(0.5);
    expect(depthCurveSemitones(64)).toBeCloseTo(8.67, 0);
    expect(depthCurveSemitones(127)).toBe(48);
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
