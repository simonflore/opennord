import { describe, it, expect } from 'vitest';
import { eqResponse, filterResponse, freqX, parseHz, wavePoints, waveShapeOf, FILTER_ZERO_Y } from './curves';

describe('parseHz', () => {
  it('reads the frequencies a Nord prints, and nothing else', () => {
    expect(parseHz('988 Hz')).toBe(988);
    expect(parseHz('4.2 kHz')).toBe(4200);
    expect(parseHz('0.0')).toBeUndefined();
    expect(parseHz(undefined)).toBeUndefined();
  });
});

describe('filterResponse', () => {
  const yAt = (pts: { x: number; y: number }[], hz: number) =>
    pts.reduce((best, p) => (Math.abs(p.x - freqX(hz)) < Math.abs(best.x - freqX(hz)) ? p : best)).y;

  it('a low-pass passes below the cutoff and cuts above it', () => {
    const pts = filterResponse({ type: 'LP24', cutoffHz: 1000, res: 0 });
    expect(yAt(pts, 50)).toBeCloseTo(FILTER_ZERO_Y, 1);
    expect(yAt(pts, 10000)).toBeGreaterThan(yAt(pts, 50));
  });

  it('a high-pass is the mirror image', () => {
    const pts = filterResponse({ type: 'HP', cutoffHz: 1000, res: 0 });
    expect(yAt(pts, 15000)).toBeCloseTo(FILTER_ZERO_Y, 1);
    expect(yAt(pts, 50)).toBeGreaterThan(yAt(pts, 15000));
  });

  it('resonance raises a peak at the cutoff', () => {
    const flat = filterResponse({ type: 'LP12', cutoffHz: 1000, res: 0 });
    const peaky = filterResponse({ type: 'LP12', cutoffHz: 1000, res: 0.9 });
    expect(yAt(peaky, 1000)).toBeLessThan(yAt(flat, 1000));
  });

  it('LP+HP keeps only the band between the two corners', () => {
    const pts = filterResponse({ type: 'LPHP', cutoffHz: 4000, hpHz: 300 });
    expect(yAt(pts, 1000)).toBeLessThan(yAt(pts, 30));
    expect(yAt(pts, 1000)).toBeLessThan(yAt(pts, 18000));
  });
});

describe('eqResponse', () => {
  it('is a flat line at 0 dB when nothing is boosted or cut', () => {
    expect(eqResponse({ bassDb: 0, midDb: 0, trebDb: 0, midHz: 1000 }).every((p) => p.y === 0.5)).toBe(true);
  });
  it('a bass cut pulls the low end down and leaves the top alone', () => {
    const pts = eqResponse({ bassDb: -10, midDb: 0, trebDb: 0, midHz: 1000 });
    expect(pts[0].y).toBeGreaterThan(0.7);
    expect(pts[pts.length - 1].y).toBeCloseTo(0.5, 2);
  });
});

describe('waveShapeOf', () => {
  it('takes the shape a wave name ends in', () => {
    expect(waveShapeOf('1 (Sub Square Saw)')).toEqual({ shape: 'saw' });
    expect(waveShapeOf('5 (Sync Pulse 33)')).toEqual({ shape: 'pulse', width: 0.33 });
    expect(waveShapeOf('1 (Pink Noise)')).toEqual({ shape: 'noise' });
  });
  it('is undefined for waves that are not a classic shape', () => {
    expect(waveShapeOf('7')).toBeUndefined();
    expect(waveShapeOf(undefined)).toBeUndefined();
  });
});

describe('wavePoints', () => {
  it('stays inside the unit box for every shape', () => {
    for (const shape of ['sine', 'triangle', 'saw', 'inv saw', 'square', 'pulse', 'noise', 'S/H'] as const) {
      expect(wavePoints(shape).every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1), shape).toBe(true);
    }
  });
});
