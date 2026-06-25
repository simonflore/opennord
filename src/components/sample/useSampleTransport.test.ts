// src/components/sample/useSampleTransport.test.ts
import { describe, it, expect } from 'vitest';
import { playheadFraction } from './useSampleTransport';
import { SAMPLE_RATE } from './audioPlayer';
import type { Voice } from './sampleEngine';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';

const voice = (startedAt: number): Voice => ({ midi: 60, globalID: 1, startedAt, rate: 1 });
const stroke = (len: number, loop?: { loopStart: number; loopEnd: number }): DecodedStrokeResult =>
  ({ channels: [new Int32Array(len)], loop: loop ? { ...loop, loops: true } : null } as DecodedStrokeResult);

describe('playheadFraction', () => {
  it('advances linearly through a one-shot at playback rate', () => {
    const s = stroke(SAMPLE_RATE * 2); // 2 s
    expect(playheadFraction(voice(0), s, 0.5, 1)).toBeCloseTo(0.25, 3); // 0.5s of 2s
    expect(playheadFraction(voice(0), s, 4, 1)).toBe(1);               // past end → clamps
  });
  it('wraps within the loop region once past loop end', () => {
    const s = stroke(SAMPLE_RATE * 4, { loopStart: SAMPLE_RATE * 1, loopEnd: SAMPLE_RATE * 2 }); // loop 1..2s of 4s
    // at 3.5s elapsed: 2.5s into a [1,2]s loop → (3.5-1) % 1 + 1 = 2.5 → wait, compute: pos wraps to 1.5s → 0.375
    expect(playheadFraction(voice(0), s, 3.5, 1)).toBeCloseTo(0.375, 3);
  });
});
