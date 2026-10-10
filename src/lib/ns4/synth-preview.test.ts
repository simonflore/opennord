import { describe, expect, it } from 'vitest';
import type { NS4Layer } from './types';
import {
  END_FADE_SECONDS,
  ENV_DISPLAY_DROP,
  nyquistFade,
  parseHz,
  parseSeconds,
  previewParamsFromLayer,
  renderSynthPreview,
  softLimit,
  svfDamping,
  type PreviewFilter,
  type PreviewFilterType,
  type SynthPreviewParams,
} from './synth-preview';
import * as scaling from './synth-scaling';

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

/** A static filter (no resonance, envelope sweep or tracking) unless overridden. */
function filter(over: Pick<PreviewFilter, 'type' | 'cutoffHz'> & Partial<PreviewFilter>): PreviewFilter {
  return { resonance: 0, envOctaves: 0, env: sustain, track: 0, ...over };
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

  it('reads the layer pitch: octave shift, coarse and fine', () => {
    expect(previewParamsFromLayer(base)?.pitchSemitones).toBe(0);
    const p = previewParamsFromLayer({ ...base, octaveShift: -1, pitchCoarse: '- 3 semi', pitchFine: '+50 cent' });
    expect(p?.pitchSemitones).toBeCloseTo(-12 - 3 + 0.5, 9);
    expect(previewParamsFromLayer({ ...base, pitchCoarse: '+12 semi', pitchFine: '- 8 cent' })?.pitchSemitones).toBeCloseTo(11.92, 9);
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

  it('decays toward silence when decay is finite, and ends there (no denormal tail)', () => {
    const out = renderSynthPreview(params({ ampEnv: { attack: 0.001, decay: 0.2, release: 0.05 } }), {
      note: 60,
      sampleRate: FS,
      holdSeconds: 2,
    });
    expect(rms(out, 0, 0.05 * FS)).toBeGreaterThan(10 * rms(out, 0.3 * FS, 0.35 * FS));
    // 40 dB per 0.2 s reaches the −80 dB floor at ~0.4 s, long before the 2 s hold ends.
    expect(out.length / FS).toBeGreaterThan(0.38);
    expect(out.length / FS).toBeLessThan(0.42);
    // The filter envelope ends the same way and keeps rendering finite.
    const filtered = renderSynthPreview(
      params({ filter: filter({ type: 'LP24', cutoffHz: 500, envOctaves: 3, env: { attack: 0.001, decay: 0.1, release: 0.05 } }) }),
      { note: 60, sampleRate: FS, holdSeconds: 1 },
    );
    expect(filtered.length).toBeGreaterThan(FS); // the amp sustains through the hold, then its 3 ms release
    expect(filtered.length).toBeLessThan(1.01 * FS);
    expect(filtered.every(Number.isFinite)).toBe(true);
  });

  it('LP24 removes more of a bright saw than LP12 at the same cutoff', () => {
    const filt = (type: 'LP12' | 'LP24') =>
      renderSynthPreview(
        params({ filter: filter({ type, cutoffHz: 300 }) }),
        { note: 81, sampleRate: FS, holdSeconds: 0.5 },
      );
    const lp12 = rms(filt('LP12'), 4800, 19200);
    const lp24 = rms(filt('LP24'), 4800, 19200);
    expect(lp24).toBeLessThan(lp12 * 0.6);
  });

  it('keeps the self-oscillating ladder bounded', () => {
    const out = renderSynthPreview(
      params({ filter: filter({ type: 'LPM', cutoffHz: 1000, resonance: 1 }) }),
      { note: 36, sampleRate: FS, holdSeconds: 0.5 },
    );
    for (const v of out) expect(Number.isFinite(v) && Math.abs(v) <= 1).toBe(true);
    expect(rms(out, 4800, 19200)).toBeGreaterThan(0.01);
  });

  it('opens the filter with the envelope', () => {
    const run = (envOctaves: number) =>
      renderSynthPreview(
        params({ filter: filter({ type: 'LP24', cutoffHz: 100, envOctaves }) }),
        { note: 60, sampleRate: FS, holdSeconds: 0.5 },
      );
    expect(rms(run(5), 4800, 19200)).toBeGreaterThan(2 * rms(run(0), 4800, 19200));
  });

  it('rises linearly during the attack', () => {
    const out = renderSynthPreview(params({ wave: 'sine', ampEnv: { attack: 0.2, decay: Infinity, release: 0.05 } }), {
      note: 69,
      sampleRate: FS,
      holdSeconds: 1,
    });
    const win = 480;
    const quarter = rms(out, 0.05 * FS - win, 0.05 * FS + win);
    const half = rms(out, 0.1 * FS - win, 0.1 * FS + win);
    expect(half / quarter).toBeCloseTo(2, 1);
  });

  it('falls 40 dB over the displayed decay time', () => {
    const out = renderSynthPreview(params({ wave: 'sine', ampEnv: { attack: 0, decay: 0.5, release: 0.05 } }), {
      note: 69,
      sampleRate: FS,
      holdSeconds: 1,
    });
    const win = 480;
    const start = rms(out, 0, 2 * win);
    const atDecay = rms(out, 0.5 * FS - win, 0.5 * FS + win);
    expect(20 * Math.log10(start / atDecay)).toBeCloseTo(40, -1);
  });

  it('maps resonance with the firmware damping law (shared with synth-scaling)', () => {
    expect(svfDamping(0)).toBe(2);
    expect(svfDamping(64 / 127)).toBeCloseTo(0.5);
    for (let raw = 0; raw <= 127; raw++) expect(svfDamping(raw / 127)).toBe(scaling.resonanceDamping(raw));
    expect(ENV_DISPLAY_DROP).toBe(scaling.ENV_DISPLAY_DROP);
  });

  it('plays the layer pitch: a −12 semi bass sounds an octave down', () => {
    const out = renderSynthPreview(params({ wave: 'sine', pitchSemitones: -12 }), { note: 69, sampleRate: FS, holdSeconds: 1 });
    expect(crossingsPerSecond(out, 4800, 43200)).toBeCloseTo(220, -1);
    const fine = renderSynthPreview(params({ wave: 'sine', pitchSemitones: 7 }), { note: 69, sampleRate: FS, holdSeconds: 1 });
    expect(crossingsPerSecond(fine, 4800, 43200)).toBeCloseTo(440 * 2 ** (7 / 12), -1);
  });

  it('does not clip at high resonance (7.0–10.0), on any filter type', () => {
    const types: PreviewFilterType[] = ['LP12', 'LP24', 'LPM', 'BP', 'HP'];
    for (const type of types) {
      for (const resonance of [0.7, 0.8, 0.9, 1]) {
        for (const [wave, note, cutoffHz] of [['saw', 60, 1000], ['square', 60, 250], ['saw', 36, 4000], ['square', 48, 1000]] as const) {
          const out = renderSynthPreview(
            params({ wave, filter: filter({ type, cutoffHz, resonance }) }),
            { note, sampleRate: FS, holdSeconds: 0.4, maxSeconds: 0.5 },
          );
          let clipped = 0, peak = 0;
          for (const v of out) { const a = Math.abs(v); if (a >= 0.99) clipped++; peak = Math.max(peak, a); }
          const what = `${type} res ${resonance * 10} ${wave} ${note} @ ${cutoffHz} Hz`;
          expect(clipped / out.length, what).toBeLessThan(0.001);
          expect(peak, what).toBeLessThan(0.9);
          expect(rms(out, 4800, 19200), what).toBeGreaterThan(0.004); // still audible
        }
      }
    }
  });

  it('keeps LP24 at resonance 7 (Pure Saw, 1 kHz) well under full scale', () => {
    // The #24 review case: two full-Q stages clipped 30% of the samples here.
    const out = renderSynthPreview(params({ filter: filter({ type: 'LP24', cutoffHz: 1000, resonance: 0.7 }) }), { note: 48, sampleRate: FS });
    expect(out.reduce((m, v) => Math.max(m, Math.abs(v)), 0)).toBeLessThan(0.6);
  });

  it('limits softly instead of clamping', () => {
    expect(softLimit(0.3)).toBe(0.3);
    expect(softLimit(-0.5)).toBe(-0.5);
    expect(softLimit(0.8)).toBeLessThan(0.8);
    expect(softLimit(0.8)).toBeGreaterThan(0.6);
    expect(softLimit(100)).toBeLessThanOrEqual(1);
    expect(softLimit(-100)).toBeGreaterThanOrEqual(-1);
  });

  it('fades out at maxSeconds when the note is still sounding (no click)', () => {
    const maxSeconds = 0.5;
    // A long release: without the fade the note would still be sounding at the cap.
    const out = renderSynthPreview(params({ wave: 'sine', ampEnv: { attack: 0.0005, decay: Infinity, release: 1 } }), {
      note: 60, sampleRate: FS, holdSeconds: 2, maxSeconds,
    });
    expect(out.length).toBe(maxSeconds * FS);
    expect(Math.abs(out[out.length - 1])).toBe(0);
    const fade = Math.round(END_FADE_SECONDS * FS);
    expect(fade).toBeGreaterThanOrEqual(0.005 * FS);
    expect(fade).toBeLessThanOrEqual(0.01 * FS);
    // Gated off (release begins) one fade before the end; the last samples ramp down.
    expect(rms(out, out.length - fade, out.length)).toBeLessThan(0.7 * rms(out, out.length - 4 * fade, out.length - 2 * fade));
    let jump = 0;
    for (let i = out.length - fade; i < out.length; i++) jump = Math.max(jump, Math.abs(out[i] - out[i - 1]));
    expect(jump).toBeLessThan(0.1);
  });

  it('fades oscillators out near Nyquist', () => {
    expect(nyquistFade(0.01)).toBe(1);
    expect(nyquistFade(0.3)).toBe(0);
    expect(nyquistFade(0.1875)).toBeCloseTo(0.5);
  });
});
