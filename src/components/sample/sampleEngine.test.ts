import { describe, it, expect } from 'vitest';
import { resolveZone, playbackRate, velocityGain, loopSeconds } from './sampleEngine';
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';

const pz = (globalID: number, keyLow: number, keyHigh: number, velLow = 0, velTop = 127): PlayableZone =>
  ({ globalID, rootKey: 60, keyLow, keyHigh, velLow, velTop });

describe('resolveZone', () => {
  const zones = [pz(1, 21, 59), pz(2, 60, 108)];
  it('returns the single zone covering a key (velocity ignored when unambiguous)', () => {
    expect(resolveZone(zones, 40, 1)?.globalID).toBe(1);
    expect(resolveZone(zones, 72, 127)?.globalID).toBe(2);
  });
  it('returns null when no zone covers the key', () => {
    expect(resolveZone([pz(1, 60, 72)], 40, 100)).toBeNull();
  });
  it('disambiguates overlapping zones by velocity, else falls back to the first', () => {
    const layered = [pz(1, 60, 72, 0, 63), pz(2, 60, 72, 64, 127)];
    expect(resolveZone(layered, 65, 100)?.globalID).toBe(2);
    expect(resolveZone(layered, 65, 30)?.globalID).toBe(1);
  });
});

describe('playbackRate', () => {
  it('is 1 at the root, doubles an octave up, halves an octave down', () => {
    expect(playbackRate(60, 60)).toBe(1);
    expect(playbackRate(60, 72)).toBeCloseTo(2, 6);
    expect(playbackRate(60, 48)).toBeCloseTo(0.5, 6);
  });
});

describe('velocityGain', () => {
  it('normalizes 0..127 into 0..1, clamped', () => {
    expect(velocityGain(127)).toBeCloseTo(1, 6);
    expect(velocityGain(0)).toBe(0);
    expect(velocityGain(200)).toBe(1);
  });
});

describe('loopSeconds', () => {
  it('converts a looping stroke region to seconds', () => {
    const s = { loop: { loopStart: 44100, loopEnd: 88200, loops: true } } as DecodedStrokeResult;
    expect(loopSeconds(s)).toEqual({ loop: true, start: 1, end: 2 });
  });
  it('reports no loop when the region is absent or non-looping', () => {
    expect(loopSeconds({ loop: null } as DecodedStrokeResult).loop).toBe(false);
    expect(loopSeconds({ loop: { loopStart: 0, loopEnd: 1, loops: false } } as DecodedStrokeResult).loop).toBe(false);
  });
});
