import { describe, it, expect } from 'vitest';
import { resolveZone, playbackRate, velocityGain, loopSeconds, loopXfadeLen, crossfadeLoop, envGainAt, type AmpEnvelope } from './sampleEngine';
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

describe('loopXfadeLen', () => {
  it('caps at ~40ms, a quarter of the loop window, and the pre-loop headroom', () => {
    // long loop, plenty of pre-loop headroom → 40ms cap wins
    expect(loopXfadeLen(44100, 44100 + 44100)).toBe(Math.floor(0.04 * 44100));
    // narrow loop window → quarter-window wins
    expect(loopXfadeLen(44100, 44100 + 400)).toBe(100);
    // little pre-loop audio → headroom (loopStart) wins
    expect(loopXfadeLen(50, 50 + 44100)).toBe(50);
  });
});

describe('crossfadeLoop', () => {
  it('blends the loop tail toward the pre-loop audio (equal-power), seamless at the wrap', () => {
    const ch = new Float32Array(100);
    const loopStart = 40, loopEnd = 80, xf = 10;
    ch.fill(1, loopStart - xf, loopStart); // pre-loop region [30,40) = 1.0
    ch.fill(2, loopEnd - xf, loopEnd);     // loop tail     [70,80) = 2.0
    crossfadeLoop(ch, loopStart, loopEnd, xf);
    expect(ch[loopEnd - xf]).toBeCloseTo(2, 5); // window start: untouched tail
    expect(ch[loopEnd - 1]).toBeCloseTo(1, 5);  // window end: equals pre-loop → smooth jump to loopStart
    // equal-power blend: the seam (end) lands on the pre-loop value, not the tail value
    expect(Math.abs(ch[loopEnd - 1] - 1)).toBeLessThan(Math.abs(ch[loopEnd - xf] - 1));
    // pre-loop region itself is left intact (only the tail is rewritten)
    expect(ch[loopStart - 1]).toBe(1);
  });
  it('is a no-op when there is not enough headroom or window', () => {
    const ch = new Float32Array([0, 1, 2, 3, 4, 5]);
    const copy = Float32Array.from(ch);
    crossfadeLoop(ch, 1, 5, 10); // xf > window and > loopStart
    expect(ch).toEqual(copy);
  });
});

describe('envGainAt', () => {
  const env: AmpEnvelope = { attack: 1, decay: 1, sustain: 0.5, release: 2 };
  it('ramps up over attack, decays to sustain, then holds (key held)', () => {
    expect(envGainAt(env, 1, 0, null)).toBeCloseTo(0, 5);    // note-on
    expect(envGainAt(env, 1, 0.5, null)).toBeCloseTo(0.5, 5); // mid-attack
    expect(envGainAt(env, 1, 1, null)).toBeCloseTo(1, 5);     // peak
    expect(envGainAt(env, 1, 1.5, null)).toBeCloseTo(0.75, 5); // mid-decay (1 → 0.5)
    expect(envGainAt(env, 1, 2, null)).toBeCloseTo(0.5, 5);   // at sustain
    expect(envGainAt(env, 1, 9, null)).toBeCloseTo(0.5, 5);   // holds at sustain
  });
  it('releases linearly from the level at key-up to zero', () => {
    expect(envGainAt(env, 1, 3, 2)).toBeCloseTo(0.25, 5); // released at 2 (lvl .5), 1s into 2s release
    expect(envGainAt(env, 1, 4, 2)).toBeCloseTo(0, 5);    // release complete
    expect(envGainAt(env, 1, 9, 2)).toBeCloseTo(0, 5);    // stays silent
  });
  it('scales the whole envelope by the velocity peak', () => {
    expect(envGainAt(env, 0.5, 1, null)).toBeCloseTo(0.5, 5);  // peak·1
    expect(envGainAt(env, 0.5, 2, null)).toBeCloseTo(0.25, 5); // peak·sustain
  });
  it('handles instant attack and zero decay without dividing by zero', () => {
    const instant: AmpEnvelope = { attack: 0, decay: 0, sustain: 0.8, release: 0.1 };
    expect(envGainAt(instant, 1, 0, null)).toBeCloseTo(0.8, 5); // jumps straight to sustain
  });
});
