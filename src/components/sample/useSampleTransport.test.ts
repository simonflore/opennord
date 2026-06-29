// @vitest-environment jsdom
// src/components/sample/useSampleTransport.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { playheadFraction, useSampleTransport } from './useSampleTransport';
import { SAMPLE_RATE } from './audioPlayer';
import type { Sampler, Voice } from './sampleEngine';
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
    // 3.5s elapsed: past loopEnd(2s) → (3.5-1) % 1 + 1 = 1.5s → 1.5/4 = 0.375
    expect(playheadFraction(voice(0), s, 3.5, 1)).toBeCloseTo(0.375, 3);
  });
});

describe('useSampleTransport identity', () => {
  // The MIDI sink effect (SampleInspector) depends on `refresh`. If it isn't
  // stable across re-renders, the effect re-runs mid-note → setSink →
  // gate.allNotesOff() → the held MIDI note is released after ~1 frame.
  const fakeSampler = () => ({ sounding: () => new Map(), voiceAt: () => undefined } as unknown as Sampler);
  it('keeps refresh stable across re-renders for the same sampler', () => {
    const sampler = fakeSampler();
    const { result, rerender } = renderHook(() => useSampleTransport(sampler));
    const first = result.current.refresh;
    rerender();
    rerender();
    expect(result.current.refresh).toBe(first);
  });
});
