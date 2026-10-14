import { describe, it, expect } from 'vitest';
import { renderTake } from './render';
import type { Take } from './model';

const t = (over: Partial<Take> = {}): Take => ({ id: 't', clipId: 'c', start: 0, end: 4, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0, ...over });

describe('renderTake', () => {
  it('cuts the take out of its clip and scales to 16-bit', () => {
    const r = renderTake(t({ start: 1, end: 3 }), { sampleRate: 44100, channels: [Float32Array.from([0, 0.25, -0.25, 1])] });
    expect(Array.from(r.channels[0])).toEqual([8192, -8192]);
    expect(r.sampleRate).toBe(44100);
  });

  it('applies gain and clamps hot audio instead of wrapping', () => {
    const r = renderTake(t({ gainDb: 6 }), { sampleRate: 44100, channels: [Float32Array.from([1, -1, 0.7, -0.7])] });
    expect(Array.from(r.channels[0])).toEqual([32767, -32767, 32767, -32767]);
  });

  it('gives the loop start in frames of the cut', () => {
    const r = renderTake(t({ start: 1, end: 4, loop: { start: 3 } }), { sampleRate: 44100, channels: [new Float32Array(4)] });
    expect(r.loopStart).toBe(2);
  });
});
