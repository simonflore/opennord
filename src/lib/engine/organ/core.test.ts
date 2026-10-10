import { describe, it, expect } from 'vitest';
import {
  OrganCore, PERC_LEVEL_SOFT, PERC_NORMAL_MANUAL_DROP, PERC_TAU_FAST, PERC_TAU_SLOW, renderOffline, softClip,
} from './core';
import { DEFAULT_ORGAN_PARAMS, ORGAN_ENGINE_MODELS, type OrganParams } from './types';
import { drawbarGain, tonewheelFrequency, wheelFor } from './tonewheel';

const SR = 48000;
const params = (o: Partial<OrganParams> = {}): OrganParams => ({
  ...DEFAULT_ORGAN_PARAMS,
  keyClick: 0,
  ...o,
  percussion: { ...DEFAULT_ORGAN_PARAMS.percussion, ...o.percussion },
  vibrato: { ...DEFAULT_ORGAN_PARAMS.vibrato, ...o.vibrato },
});
const only8 = [0, 0, 8, 0, 0, 0, 0, 0, 0];

/** Goertzel magnitude of `f` Hz in `x`, normalized to a sine amplitude. */
function tone(x: Float32Array, f: number, sr = SR): number {
  const k = (2 * Math.cos((2 * Math.PI * f) / sr));
  let s1 = 0, s2 = 0;
  for (let i = 0; i < x.length; i++) { const s0 = x[i] + k * s1 - s2; s2 = s1; s1 = s0; }
  const p = s1 * s1 + s2 * s2 - k * s1 * s2;
  return (2 * Math.sqrt(Math.max(0, p))) / x.length;
}
const rms = (x: Float32Array, a = 0, b = x.length) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
};

describe('drawbar mixing (generator targets)', () => {
  it('one key on 888000000 drives three wheels at full level', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0] }) });
    core.noteOn(60);
    const t = core.settledTargets();
    expect(t).toEqual(new Map([[wheelFor(60, 0), 1], [wheelFor(60, 1), 1], [wheelFor(60, 2), 1]]));
  });

  it('scales each wheel by its drawbar (≈3 dB per step)', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: [0, 0, 8, 6, 0, 0, 0, 0, 0] }) });
    core.noteOn(60);
    const t = core.settledTargets();
    expect(t.get(wheelFor(60, 2))).toBe(1);
    expect(t.get(wheelFor(60, 3))).toBeCloseTo(drawbarGain(6), 12);
  });

  it('sums shared wheels: C3 4′ and C4 8′ are the same wheel', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: [0, 0, 8, 8, 0, 0, 0, 0, 0] }) });
    core.noteOn(48);
    core.noteOn(60);
    const t = core.settledTargets();
    expect(wheelFor(48, 3)).toBe(wheelFor(60, 2));
    expect(t.get(wheelFor(60, 2))).toBe(2);
    expect(t.size).toBe(3);
  });

  it('octave shift moves every wheel up an octave', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: only8, octaveShift: 1 }) });
    core.noteOn(60);
    expect([...core.settledTargets().keys()]).toEqual([wheelFor(72, 2)]);
  });

  it('releases to silence and drops the generators', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: only8 }) });
    core.noteOn(60);
    core.render(new Float32Array(1024));
    expect(core.activeGenerators()).toBe(1);
    core.noteOff(60);
    core.render(new Float32Array(1024));
    expect(core.activeGenerators()).toBe(0);
    expect(core.heldNotes()).toEqual([]);
  });

  it('is fully polyphonic at a flat cost: generators ≤ distinct wheels', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8] }) });
    for (let n = 36; n <= 96; n++) core.noteOn(n); // all 61 keys
    core.settledTargets();
    expect(core.heldNotes()).toHaveLength(61);
    expect(core.activeGenerators()).toBeLessThanOrEqual(79); // wheels 13..91
  });
});

describe('percussion', () => {
  const percParams = (o: Partial<OrganParams['percussion']> = {}) =>
    params({ drawbars: only8, percussion: { on: true, harm3rd: false, decayFast: true, volSoft: false, ...o } });

  it('triggers only from a fully released keyboard (single trigger)', () => {
    const core = new OrganCore({ sampleRate: SR, params: percParams() });
    const buf = new Float32Array(SR / 10);
    core.noteOn(60);
    expect(core.percussionEnvelope()).toBe(1);
    core.render(buf);
    const decayed = core.percussionEnvelope();
    expect(decayed).toBeLessThan(1);
    core.noteOn(64); // legato: no retrigger
    expect(core.percussionEnvelope()).toBe(decayed);
    core.noteOff(60);
    core.noteOn(67); // 64 still held: no retrigger
    expect(core.percussionEnvelope()).toBe(decayed);
    core.noteOff(64); core.noteOff(67);
    core.noteOn(72); // keyboard was clear: retrigger
    expect(core.percussionEnvelope()).toBe(1);
  });

  it('does nothing when off or on non-tonewheel models', () => {
    const off = new OrganCore({ sampleRate: SR, params: params({ drawbars: only8 }) });
    off.noteOn(60);
    expect(off.percussionEnvelope()).toBe(0);
    const vox = new OrganCore({ sampleRate: SR, params: { ...percParams(), model: 'VOX' } });
    vox.noteOn(60);
    expect(vox.percussionEnvelope()).toBe(0);
  });

  it('decays with the fast or slow time constant', () => {
    for (const [fast, tau] of [[true, PERC_TAU_FAST], [false, PERC_TAU_SLOW]] as const) {
      const core = new OrganCore({ sampleRate: SR, params: percParams({ decayFast: fast }) });
      core.noteOn(60);
      core.render(new Float32Array(Math.round(tau * SR)));
      expect(core.percussionEnvelope()).toBeCloseTo(Math.exp(-1), 3);
    }
  });

  it('sounds the 2nd (4′) or 3rd (2⅔′) harmonic wheel', () => {
    for (const [harm3rd, bar] of [[false, 3], [true, 4]] as const) {
      const out = renderOffline(percParams({ harm3rd }), [[0, 'on', 60]], 0.1);
      const f = tonewheelFrequency(wheelFor(60, bar));
      const other = tonewheelFrequency(wheelFor(60, harm3rd ? 3 : 4));
      expect(tone(out, f)).toBeGreaterThan(5 * tone(out, other));
    }
  });

  it('silences the 1′ drawbar and drops the drawbars ~3 dB at normal volume', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: [0, 0, 8, 0, 0, 0, 0, 0, 8], percussion: { on: true, harm3rd: false, decayFast: true, volSoft: false } }) });
    core.noteOn(60);
    expect([...core.settledTargets().keys()]).toEqual([wheelFor(60, 2)]);

    // Steady state (percussion long gone): normal vs soft volume.
    const level = (volSoft: boolean) => {
      const out = renderOffline(params({ drawbars: only8, percussion: { on: true, harm3rd: false, decayFast: true, volSoft } }), [[0, 'on', 60]], 2);
      return rms(out, SR, 2 * SR);
    };
    expect(level(false) / level(true)).toBeCloseTo(PERC_NORMAL_MANUAL_DROP, 2);
  });

  it('soft percussion peaks lower than normal', () => {
    const peak = (volSoft: boolean) => {
      const out = renderOffline(params({ drawbars: [0, 0, 0, 0, 0, 0, 0, 0, 0], percussion: { on: true, harm3rd: false, decayFast: true, volSoft } }), [[0, 'on', 60]], 0.05);
      return rms(out, 0, 480);
    };
    expect(peak(true) / peak(false)).toBeCloseTo(PERC_LEVEL_SOFT, 1);
  });
});

describe('offline rendering', () => {
  it('is deterministic for a given seed', () => {
    const p = params({ drawbars: [8, 8, 8, 4, 0, 0, 2, 0, 3], keyClick: 1, vibrato: { on: true, type: 'C3' } });
    const ev = [[0, 'on', 60], [0.01, 'on', 64], [0.1, 'off', 60], [0.15, 'off', 64]] as const;
    const a = renderOffline(p, ev, 0.25);
    const b = renderOffline(p, ev, 0.25);
    expect(a).toEqual(b);
    expect(renderOffline(p, ev, 0.25, SR, 2)).not.toEqual(a);
  });

  it('renders the same audio regardless of block size', () => {
    const p = params({ drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0], keyClick: 1 });
    const whole = new OrganCore({ sampleRate: SR, params: p, seed: 7 });
    const blocks = new OrganCore({ sampleRate: SR, params: p, seed: 7 });
    whole.noteOn(60); blocks.noteOn(60);
    const a = new Float32Array(4096), b = new Float32Array(4096);
    whole.render(a);
    for (let i = 0; i < 4096; i += 128) blocks.render(b, i, 128);
    expect(b).toEqual(a);
  });

  it('a single 8′ key sounds its tonewheel pitch (A4 = 440 Hz)', () => {
    const out = renderOffline(params({ drawbars: only8 }), [[0, 'on', 69]], 0.2);
    const seg = out.subarray(SR / 20);
    expect(tone(seg, 440)).toBeGreaterThan(0.05);
    expect(tone(seg, 440)).toBeGreaterThan(50 * tone(seg, 880));
  });

  it('is silent with every drawbar in', () => {
    const out = renderOffline(params({ drawbars: [0, 0, 0, 0, 0, 0, 0, 0, 0] }), [[0, 'on', 60]], 0.05);
    expect(rms(out)).toBe(0);
  });

  it('key click adds a transient only at the contacts', () => {
    const clean = renderOffline(params({ drawbars: only8, keyClick: 0 }), [[0, 'on', 60]], 0.1);
    const click = renderOffline(params({ drawbars: only8, keyClick: 1 }), [[0, 'on', 60]], 0.1);
    let onset = 0;
    for (let i = 0; i < 480; i++) onset += Math.abs(click[i] - clean[i]);
    expect(onset).toBeGreaterThan(0);
    for (let i = SR / 20; i < click.length; i++) expect(click[i]).toBe(clean[i]);
  });

  it('organ sustain lets notes fade instead of stopping', () => {
    const tail = (sustain: boolean) =>
      rms(renderOffline(params({ drawbars: only8, sustain }), [[0, 'on', 60], [0.1, 'off', 60]], 0.3), 0.11 * SR, 0.15 * SR);
    expect(tail(false)).toBe(0);
    expect(tail(true)).toBeGreaterThan(0.01);
  });

  it('vibrato moves the pitch, chorus keeps the dry signal', () => {
    const dry = renderOffline(params({ drawbars: only8 }), [[0, 'on', 69]], 0.5);
    const vib = renderOffline(params({ drawbars: only8, vibrato: { on: true, type: 'V3' } }), [[0, 'on', 69]], 0.5);
    const cho = renderOffline(params({ drawbars: only8, vibrato: { on: true, type: 'C3' } }), [[0, 'on', 69]], 0.5);
    const seg = (x: Float32Array) => x.subarray(SR / 10);
    expect(tone(seg(vib), 440)).toBeLessThan(0.9 * tone(seg(dry), 440));
    expect(rms(seg(vib))).toBeCloseTo(rms(seg(dry)), 2); // a delay keeps the level
    expect(cho).not.toEqual(dry);
  });

  it('every model renders sound and stays within ±1', () => {
    for (const model of ORGAN_ENGINE_MODELS) {
      const out = renderOffline(
        params({ model, drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8] }),
        [36, 48, 55, 60, 64, 67, 72, 76, 79, 84].map((n) => [0, 'on', n] as const),
        0.2,
      );
      expect(rms(out), model).toBeGreaterThan(0.01);
      for (const s of out) expect(Math.abs(s)).toBeLessThanOrEqual(1);
    }
  });

  it('changing the model while a key is held re-voices it', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: only8 }) });
    core.noteOn(60);
    core.render(new Float32Array(512));
    core.setParams(params({ model: 'PIPE1', drawbars: only8 }));
    const t = core.settledTargets();
    expect(t.size).toBe(1);
    expect(core.generatorFrequency([...t.keys()][0])).toBeCloseTo(261.626, 2);
  });
});

describe('softClip', () => {
  it('is transparent at normal levels and bounded', () => {
    expect(softClip(0.5)).toBe(0.5);
    expect(softClip(-0.6)).toBe(-0.6);
    expect(softClip(10)).toBeLessThanOrEqual(1);
    expect(softClip(0.7)).toBeLessThan(0.7);
  });
});
