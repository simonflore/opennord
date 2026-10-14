import { describe, it, expect } from 'vitest';
import { splitOnSilence } from './split';

const RATE = 44100;
/** Notes as [startSeconds, lengthSeconds, sustain?]; silence elsewhere. `sustain` drops the decay. */
function clip(notes: [number, number, boolean?][], seconds: number) {
  const ch = new Float32Array(Math.round(seconds * RATE));
  for (const [s, len, sustain] of notes) {
    for (let i = 0; i < len * RATE; i++) {
      const n = Math.round(s * RATE) + i;
      if (n < ch.length) ch[n] = (sustain ? 0.5 : 0.5 * Math.exp(-i / (0.4 * RATE))) * Math.sin((2 * Math.PI * 220 * i) / RATE);
    }
  }
  return { sampleRate: RATE, channels: [ch] };
}
const opts = { thresholdDb: -50, minPauseMs: 300 };
const secs = (r: { start: number; end: number }[]) => r.map((x) => [+(x.start / RATE).toFixed(2), +(x.end / RATE).toFixed(2)]);
const floor = 10 ** (opts.thresholdDb / 20);
/** Seconds after onset at which a decaying note (tau 0.4 s, amplitude 0.5) falls to the floor in RMS. */
const decayCrossing = 0.4 * Math.log(0.5 / (floor * Math.SQRT2));

describe('splitOnSilence', () => {
  it('finds each note with a little pre-roll', () => {
    const r = splitOnSilence(clip([[0.5, 1], [2, 1], [3.5, 1]], 5), opts);
    expect(r).toHaveLength(3);
    expect(secs(r).map(([s]) => s)).toEqual([0.49, 1.99, 3.49]);
    // each 1 s note is hard-cut at its length while still above the floor, so it ends at its own end
    expect(secs(r).map(([, e]) => e)).toEqual([1.5, 3.0, 4.5]);
  });

  it('handles sound from the very first frame and a note running to the end', () => {
    const r = splitOnSilence(clip([[0, 1], [2, 3, true]], 5), opts);
    expect(r[0].start).toBe(0);
    expect(r.at(-1)!.end).toBe(5 * RATE);
  });

  it('keeps a short dip inside one note', () => {
    const c = clip([[0.5, 2]], 3);
    c.channels[0].fill(0, Math.round(1 * RATE), Math.round(1.1 * RATE)); // 100 ms gap < 300 ms
    expect(splitOnSilence(c, opts)).toHaveLength(1);
  });

  it('keeps a short dip inside a sustained note and runs the region to the note end', () => {
    const c = clip([[0.5, 2, true]], 3);
    c.channels[0].fill(0, Math.round(1 * RATE), Math.round(1.1 * RATE));
    const r = splitOnSilence(c, opts);
    expect(r).toHaveLength(1);
    expect(Math.abs(r[0].end / RATE - 2.5)).toBeLessThanOrEqual(0.01);
  });

  it('ends a decaying note where it falls below the threshold', () => {
    const r = splitOnSilence(clip([[0.5, 3]], 4), opts);
    expect(r).toHaveLength(1);
    expect(Math.abs(r[0].end / RATE - (0.5 + decayCrossing))).toBeLessThan(0.02);
  });

  it('merges notes whose gap is under minPauseMs', () => {
    const r = splitOnSilence(clip([[0.5, 1, true], [1.79, 1, true]], 3), opts); // gap 290 ms
    expect(secs(r)).toEqual([[0.49, 2.79]]);
  });

  it('keeps notes apart when the gap is over minPauseMs', () => {
    const r = splitOnSilence(clip([[0.5, 1, true], [1.81, 1, true]], 3), opts); // gap 310 ms
    expect(secs(r)).toEqual([[0.49, 1.5], [1.8, 2.81]]);
  });

  it('gives one region when there is no silence at all', () => {
    const c = { sampleRate: RATE, channels: [Float32Array.from({ length: RATE * 2 }, (_, i) => 0.3 * Math.sin(i / 7))] };
    expect(secs(splitOnSilence(c, opts))).toEqual([[0, 2]]);
  });

  it('gives nothing for silence, and drops clicks shorter than a note', () => {
    expect(splitOnSilence(clip([], 2), opts)).toEqual([]);
    expect(splitOnSilence(clip([[1, 0.01]], 2), { ...opts, minNoteMs: 50 })).toEqual([]);
  });
});

describe('splitOnSilence on stereo', () => {
  it('finds a note that sounds only on the right channel', () => {
    const right = clip([[0.5, 1]], 3).channels[0];
    const r = splitOnSilence({ sampleRate: RATE, channels: [new Float32Array(right.length), right] }, opts);
    expect(secs(r)).toEqual([[0.49, 1.5]]);
  });

  it('finds notes on both channels', () => {
    const left = clip([[0.5, 1]], 3).channels[0];
    const right = clip([[2, 1]], 3).channels[0];
    expect(secs(splitOnSilence({ sampleRate: RATE, channels: [left, right] }, opts))).toEqual([[0.49, 1.5], [1.99, 3.0]]);
  });
});

describe('splitOnSilence: notes near the start', () => {
  it('measures a note from its onset, so a short click 10 ms in is still dropped', () => {
    expect(splitOnSilence(clip([[0.01, 0.035]], 2), { ...opts, minNoteMs: 50 })).toEqual([]); // 4 frames from onset; 5 with the pre-roll
  });
});
