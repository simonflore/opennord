import { describe, expect, it } from 'vitest';
import type { NS4Layer } from './types';
import {
  nyquistFade,
  parseHz,
  parseSeconds,
  previewParamsFromLayer,
  renderSynthPreview,
  type SynthPreviewParams,
} from './synth-preview';

const FS = 48000;

function rms(x: Float32Array, from = 0, to = x.length): number {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
}

/** Rising zero crossings per second over [from, to). */
function crossingsPerSecond(x: Float32Array, from: number, to: number): number {
  let c = 0;
  for (let i = from + 1; i < to; i++) if (x[i - 1] < 0 && x[i] >= 0) c++;
  return (c * FS) / (to - from);
}

const sustain = { attack: 0.0005, decay: Infinity, release: 0.003 };

function params(over: Partial<SynthPreviewParams>): SynthPreviewParams {
  return { wave: 'saw', ampEnv: sustain, filter: null, ...over };
}

describe('display-string parsing', () => {
  it('reads envelope times', () => {
    expect(parseSeconds('0.5 ms')).toBeCloseTo(0.0005);
    expect(parseSeconds('1.82 s')).toBeCloseTo(1.82);
    expect(parseSeconds('inf')).toBe(Infinity);
    expect(parseSeconds('none')).toBeUndefined();
  });
  it('reads frequencies', () => {
    expect(parseHz('466 Hz')).toBe(466);
    expect(parseHz('3.7 kHz')).toBeCloseTo(3700);
    expect(parseHz('6.7')).toBeUndefined();
  });
});

describe('previewParamsFromLayer', () => {
  const base: NS4Layer = {
    id: 'A',
    kind: 'synth',
    source: 'analog',
    oscType: '1 (ANALOG)',
    oscCategory: '1 (PURE)',
    oscWave: '3 (Pure Saw)',
    ampEnv: { attack: '0.5 ms', decay: 'inf', release: '244 ms' },
    filter: {
      on: true,
      type: 'LP24',
      freq: { value: '3.7 kHz' },
      resonance: { value: '6.7' },
      track: '2/3',
      envAmount: { value: '1.8' },
      env: { attack: '24 ms', decay: '1.82 s', release: '100 ms' },
    },
  };

  it('maps a Pure Saw layer with an LP24 filter', () => {
    const p = previewParamsFromLayer(base);
    expect(p?.wave).toBe('saw');
    expect(p?.ampEnv.decay).toBe(Infinity);
    expect(p?.ampEnv.release).toBeCloseTo(0.244);
    expect(p?.filter?.type).toBe('LP24');
    expect(p?.filter?.cutoffHz).toBeCloseTo(3700);
    expect(p?.filter?.resonance).toBeCloseTo(0.67);
    expect(p?.filter?.track).toBeCloseTo(2 / 3);
    expect(p?.filter?.envOctaves).toBeCloseTo(1.8);
  });

  it('reads the LPHP high-pass corner from the resonance knob', () => {
    const p = previewParamsFromLayer({
      ...base,
      filter: { ...base.filter, type: 'LPHP', resonance: { value: '1.1 kHz' } },
    });
    expect(p?.filter?.hpHz).toBeCloseTo(1100);
    expect(p?.filter?.resonance).toBe(0);
  });

  it('drops the filter when it is switched off', () => {
    expect(previewParamsFromLayer({ ...base, filter: { ...base.filter, on: false } })?.filter).toBeNull();
  });

  it('declines layers it cannot render', () => {
    expect(previewParamsFromLayer({ ...base, source: 'samples' })).toBeNull();
    expect(previewParamsFromLayer({ ...base, oscType: '2 (FM-H)', oscWave: '0.5' })).toBeNull();
    expect(previewParamsFromLayer({ ...base, oscWave: '2 (Shape Saw)' })).toBeNull();
    expect(previewParamsFromLayer({ ...base, kind: 'piano' })).toBeNull();
  });
});

describe('renderSynthPreview', () => {
  it('renders the requested pitch', () => {
    for (const wave of ['sine', 'saw', 'square', 'pulse10'] as const) {
      const out = renderSynthPreview(params({ wave }), { note: 69, sampleRate: FS, holdSeconds: 1 });
      expect(crossingsPerSecond(out, 4800, 43200)).toBeCloseTo(440, -1);
    }
  });

  it('stays in range and stops after the release', () => {
    const out = renderSynthPreview(params({ ampEnv: { attack: 0.001, decay: Infinity, release: 0.05 } }), {
      note: 48,
      sampleRate: FS,
      holdSeconds: 0.5,
      maxSeconds: 4,
    });
    expect(out.length).toBeGreaterThan(0.5 * FS);
    expect(out.length).toBeLessThan(0.9 * FS);
    for (const v of out) expect(Math.abs(v)).toBeLessThanOrEqual(1);
    expect(rms(out, 0.1 * FS, 0.4 * FS)).toBeGreaterThan(0.2);
  });

  it('decays toward silence when decay is finite', () => {
    const out = renderSynthPreview(params({ ampEnv: { attack: 0.001, decay: 0.2, release: 0.05 } }), {
      note: 60,
      sampleRate: FS,
      holdSeconds: 2,
    });
    expect(rms(out, 0, 0.05 * FS)).toBeGreaterThan(10 * rms(out, 0.5 * FS, 0.6 * FS));
  });

  it('LP24 removes more of a bright saw than LP12 at the same cutoff', () => {
    const filt = (type: 'LP12' | 'LP24') =>
      renderSynthPreview(
        params({
          filter: { type, cutoffHz: 300, resonance: 0, envOctaves: 0, env: sustain, track: 0 },
        }),
        { note: 81, sampleRate: FS, holdSeconds: 0.5 },
      );
    const lp12 = rms(filt('LP12'), 4800, 19200);
    const lp24 = rms(filt('LP24'), 4800, 19200);
    expect(lp24).toBeLessThan(lp12 * 0.6);
  });

  it('keeps the self-oscillating ladder bounded', () => {
    const out = renderSynthPreview(
      params({ filter: { type: 'LPM', cutoffHz: 1000, resonance: 1, envOctaves: 0, env: sustain, track: 0 } }),
      { note: 36, sampleRate: FS, holdSeconds: 0.5 },
    );
    for (const v of out) expect(Number.isFinite(v) && Math.abs(v) <= 1).toBe(true);
    expect(rms(out, 4800, 19200)).toBeGreaterThan(0.01);
  });

  it('opens the filter with the envelope', () => {
    const run = (envOctaves: number) =>
      renderSynthPreview(
        params({
          filter: { type: 'LP24', cutoffHz: 100, resonance: 0, envOctaves, env: sustain, track: 0 },
        }),
        { note: 60, sampleRate: FS, holdSeconds: 0.5 },
      );
    expect(rms(run(5), 4800, 19200)).toBeGreaterThan(2 * rms(run(0), 4800, 19200));
  });

  it('fades oscillators out near Nyquist', () => {
    expect(nyquistFade(0.01)).toBe(1);
    expect(nyquistFade(0.3)).toBe(0);
    expect(nyquistFade(0.1875)).toBeCloseTo(0.5);
  });
});
