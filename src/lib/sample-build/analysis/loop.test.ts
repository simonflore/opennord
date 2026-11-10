import { describe, expect, it } from 'vitest';
import { findLoop, loopJoinMatch } from './loop';
import type { ClipAudio } from '../render';

const SR = 44100;

/** A deterministic noise source, so the tests don't depend on Math.random. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 - 0.5; };
}

/** Attack, a steady stretch, a release tail; `body(i)` is the sound. */
function shaped(seconds: number, body: (i: number) => number, releaseAt = 0.8): Float32Array {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.02);
    const release = i / n < releaseAt ? 1 : Math.exp(-((i / n - releaseAt) * seconds) / 0.15);
    out[i] = 0.5 * attack * release * body(i);
  }
  return out;
}

describe('findLoop', () => {
  it('finds a near-perfect loop in a steady tone, a whole number of cycles long, inside the steady part', () => {
    const f = 220;
    const ch = shaped(2, (i) => Math.sin((2 * Math.PI * f * i) / SR) + 0.3 * Math.sin((2 * Math.PI * 3 * f * i) / SR));
    const audio: ClipAudio = { sampleRate: SR, channels: [ch] };
    const loop = findLoop(audio, { start: 0, end: ch.length })!;
    expect(loop).not.toBeNull();
    expect(loop.match).toBeGreaterThan(0.99);
    const cycles = ((loop.end - loop.start) * f) / SR;
    expect(Math.abs(cycles - Math.round(cycles))).toBeLessThan(0.02);
    expect(loop.start).toBeGreaterThan(0.02 * SR); // after the attack
    expect(loop.end).toBeLessThanOrEqual(0.8 * ch.length + 0.15 * SR); // before the tail is gone
    expect(loop.end - loop.start).toBeGreaterThan(0.5 * SR); // it prefers a long loop
  });

  it('finds the repeat in a sound that repeats every 300 ms (no simple pitch)', () => {
    const period = Math.round(0.3 * SR);
    const r = rng(7);
    const cycle = Float32Array.from({ length: period }, () => r());
    // Low-pass it a little so it has upward zero crossings that aren't on every sample.
    for (let i = 1; i < period; i++) cycle[i] = 0.7 * cycle[i - 1] + 0.3 * cycle[i];
    const ch = shaped(3, (i) => cycle[i % period] * 4, 0.85);
    const loop = findLoop({ sampleRate: SR, channels: [ch, ch] }, { start: 0, end: ch.length })!;
    expect(loop.match).toBeGreaterThan(0.98);
    expect((loop.end - loop.start) % period).toBe(0);
  });

  it('works on a trimmed take, giving frames of the clip', () => {
    const ch = shaped(2, (i) => Math.sin((2 * Math.PI * 330 * i) / SR));
    const take = { start: 4410, end: ch.length - 2000 };
    const loop = findLoop({ sampleRate: SR, channels: [ch] }, take)!;
    expect(loop.start).toBeGreaterThan(take.start);
    expect(loop.end).toBeLessThanOrEqual(take.end);
  });

  it('says nothing for silence or a take too short to loop', () => {
    expect(findLoop({ sampleRate: SR, channels: [new Float32Array(SR)] }, { start: 0, end: SR })).toBeNull();
    const ch = shaped(0.1, (i) => Math.sin((2 * Math.PI * 440 * i) / SR));
    expect(findLoop({ sampleRate: SR, channels: [ch] }, { start: 0, end: ch.length })).toBeNull();
  });

  it('respects the shortest loop asked for', () => {
    const ch = shaped(3, (i) => Math.sin((2 * Math.PI * 200 * i) / SR));
    const loop = findLoop({ sampleRate: SR, channels: [ch] }, { start: 0, end: ch.length }, { minLoopSeconds: 1 })!;
    expect(loop.end - loop.start).toBeGreaterThanOrEqual(SR);
  });

  it('a noisy sound still gets a loop, with an honest, lower match', () => {
    const r = rng(3);
    const ch = shaped(2, () => r() * 2);
    const loop = findLoop({ sampleRate: SR, channels: [ch] }, { start: 0, end: ch.length })!;
    expect(loop).not.toBeNull();
    expect(loop.match).toBeLessThan(0.9);
  });

  it('measures the join of any loop: the found one scores as found, a careless one low', () => {
    const ch = shaped(2, (i) => Math.sin((2 * Math.PI * 220 * i) / SR));
    const audio: ClipAudio = { sampleRate: SR, channels: [ch] };
    const l = findLoop(audio, { start: 0, end: ch.length })!;
    expect(loopJoinMatch(audio, l.start, l.end)).toBeCloseTo(l.match, 5);
    expect(loopJoinMatch(audio, l.start + 50, l.end)!).toBeLessThan(0.5);
    expect(loopJoinMatch(audio, 10, 20)).toBeNull();
    // A crossfade over the compared stretch smooths the careless join, as the sample plays it.
    expect(loopJoinMatch(audio, l.start + 50, l.end, Math.round(0.05 * SR))!).toBeGreaterThan(0.9); // no longer marked
  });
});
