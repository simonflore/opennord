import { describe, expect, it } from 'vitest';
import { createRecorder } from './record';

const SR = 1000;
const block = (value: number, n = 100) => [new Float32Array(n).fill(value)];

describe('createRecorder', () => {
  it('waits for the threshold, keeps a pre-roll, and stops after silence, dropping most of it', () => {
    const r = createRecorder({ sampleRate: SR, channels: 1, startDb: -40, stopAfterSilenceS: 0.5, preRollS: 0.05 });
    for (let k = 0; k < 5; k++) expect(r.push(block(0.001))).toBe('armed'); // −60 dB: below
    expect(r.push(block(0.5))).toBe('recording');
    for (let k = 0; k < 3; k++) r.push(block(0.5));
    let state = r.state;
    for (let k = 0; k < 10 && state !== 'done'; k++) state = r.push(block(0));
    expect(state).toBe('done');
    const a = r.finish()!;
    expect(a.sampleRate).toBe(SR);
    // 50 pre-roll + 400 loud + 200 of tail kept.
    expect(a.channels[0].length).toBe(650);
    expect(a.channels[0][0]).toBeCloseTo(0.001);
    expect(a.channels[0][50]).toBeCloseTo(0.5);
  });

  it('starts at once with no threshold, and keeps going with no silence stop until finished', () => {
    const r = createRecorder({ sampleRate: SR, channels: 1, startDb: null, stopAfterSilenceS: null });
    expect(r.state).toBe('recording');
    for (let k = 0; k < 20; k++) r.push(block(0));
    expect(r.state).toBe('recording');
    expect(r.seconds).toBe(2);
    expect(r.finish()!.channels[0].length).toBe(2000);
  });

  it('doubles a mono input for a stereo recording and mixes stereo for mono; meters per channel', () => {
    const s = createRecorder({ sampleRate: SR, channels: 2, startDb: null, stopAfterSilenceS: null });
    s.push([new Float32Array(10).fill(0.5)]);
    expect(s.finish()!.channels.map((c) => c[0])).toEqual([0.5, 0.5]);
    const m = createRecorder({ sampleRate: SR, channels: 1, startDb: null, stopAfterSilenceS: null });
    m.push([new Float32Array(10).fill(1), new Float32Array(10).fill(0)]);
    expect(m.levelsDb[0]).toBeCloseTo(20 * Math.log10(0.5));
    expect(m.finish()!.channels[0][0]).toBeCloseTo(0.5);
  });

  it('gives nothing when nothing crossed the threshold, and stops at the longest length', () => {
    const r = createRecorder({ sampleRate: SR, channels: 1, startDb: -20, stopAfterSilenceS: 1 });
    r.push(block(0.01));
    expect(r.finish()).toBeNull();
    const long = createRecorder({ sampleRate: SR, channels: 1, startDb: null, stopAfterSilenceS: null, maxSeconds: 0.25 });
    for (let k = 0; k < 5; k++) long.push(block(0.5));
    expect(long.state).toBe('done');
  });
});
