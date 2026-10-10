import { describe, it, expect } from 'vitest';
import {
  LEVEL_MAKEUP, OrganCore, PERC_FAST, PERC_LEVEL_SLOW, PERC_LEVEL_SOFT, PERC_NORMAL_MANUAL_DROP, PERC_SLOW, renderOffline,
  softClip,
} from './core';
import { DEFAULT_ORGAN_PARAMS, ORGAN_ENGINE_MODELS, type OrganParams } from './types';
import { drawbarGain, tonewheelFrequency, wheelFor } from './tonewheel';
import { voicingFor } from './voicing';

const SR = 48000;
const params = (o: Partial<OrganParams> = {}): OrganParams => ({
  ...DEFAULT_ORGAN_PARAMS,
  keyClick: 0,
  ...o,
  percussion: { ...DEFAULT_ORGAN_PARAMS.percussion, ...o.percussion },
  vibrato: { ...DEFAULT_ORGAN_PARAMS.vibrato, ...o.vibrato },
});
const only8 = [0, 0, 8, 0, 0, 0, 0, 0, 0];
/** B3 output level: one full drawbar on one key peaks about here. */
const B3_LEVEL = voicingFor('B3').level;

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

  it('scales each wheel by its drawbar step level', () => {
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

  it('drains while keys are held: legato notes get no new hit (single trigger)', () => {
    const core = new OrganCore({ sampleRate: SR, params: percParams() });
    const buf = new Float32Array(SR / 10);
    expect(core.percussionEnvelope()).toBe(1); // charged
    core.noteOn(60);
    core.render(buf);
    const decayed = core.percussionEnvelope();
    expect(decayed).toBeLessThan(0.5);
    core.noteOn(64); // legato: no retrigger, keeps draining
    core.render(buf);
    expect(core.percussionEnvelope()).toBeLessThan(decayed);
    core.noteOff(60);
    core.noteOn(67); // 64 still held: still draining
    core.render(buf);
    expect(core.percussionEnvelope()).toBe(0);
  });

  it('recharges in ~26 ms once the keyboard is clear; quick re-strikes hit softer', () => {
    const core = new OrganCore({ sampleRate: SR, params: percParams() });
    core.noteOn(60);
    core.render(new Float32Array(SR / 2)); // fully drained
    core.noteOff(60);
    core.render(new Float32Array(Math.round(0.01 * SR))); // 10 ms gap: partial recharge
    const partial = core.percussionEnvelope();
    expect(partial).toBeGreaterThan(0.05);
    expect(partial).toBeLessThan(0.5);
    core.render(new Float32Array(Math.round(0.2 * SR))); // long gap: full charge
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

  it('decays with the instrument\'s fast or slow timing (−20 dB at ~0.13 s / ~0.4 s, silent by ~0.22 s / ~0.68 s)', () => {
    const at = (fast: boolean, seconds: number) => {
      const core = new OrganCore({ sampleRate: SR, params: percParams({ decayFast: fast }) });
      core.noteOn(60);
      core.render(new Float32Array(Math.round(seconds * SR)));
      return core.percussionEnvelope();
    };
    expect(at(true, 0.12)).toBeGreaterThan(0.1);
    expect(at(true, 0.14)).toBeLessThan(0.1);
    expect(at(true, 0.23)).toBe(0);
    expect(at(false, 0.38)).toBeGreaterThan(0.1);
    expect(at(false, 0.42)).toBeLessThan(0.1);
    expect(at(false, 0.7)).toBe(0);
    expect(PERC_FAST.tau).toBeLessThan(PERC_SLOW.tau);
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

  it('slow decay peaks lower than fast', () => {
    const peak = (decayFast: boolean) => {
      const out = renderOffline(params({ drawbars: [0, 0, 0, 0, 0, 0, 0, 0, 0], percussion: { on: true, harm3rd: false, decayFast, volSoft: false } }), [[0, 'on', 60]], 0.02);
      return rms(out, 0, 96);
    };
    expect(peak(false) / peak(true)).toBeCloseTo(PERC_LEVEL_SLOW, 1);
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
    expect(tone(seg, 440)).toBeGreaterThan(0.45 * B3_LEVEL);
    expect(tone(seg, 440)).toBeGreaterThan(50 * tone(seg, 880));
  });

  it('is silent with every drawbar in', () => {
    const out = renderOffline(params({ drawbars: [0, 0, 0, 0, 0, 0, 0, 0, 0] }), [[0, 'on', 60]], 0.05);
    expect(rms(out)).toBe(0);
  });

  it('is silent (never Infinity or NaN) at "volume off", below it, or with a non-finite volume', () => {
    for (const volumeDb of [-120, -200, -Infinity, Infinity, NaN]) {
      const out = renderOffline(params({ volumeDb }), [[0, 'on', 60]], 0.05);
      expect(out.every((s) => s === 0), String(volumeDb)).toBe(true);
    }
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
    expect(tail(true)).toBeGreaterThan(0.09 * B3_LEVEL);
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

  it('a ten-note chord on every drawbar peaks below the soft-clip knee before the clip, on every model', () => {
    const chords = [
      [36, 48, 55, 60, 64, 67, 72, 76, 79, 84],
      [24, 36, 48, 60, 72, 84, 96, 43, 55, 67], // octave stack: the most shared wheels
    ];
    for (const model of ORGAN_ENGINE_MODELS) {
      for (const chord of chords) {
        // Chorus on and default key click: the loudest stock setting.
        const core = new OrganCore({
          sampleRate: SR, seed: 3, clip: false,
          params: params({ model, drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8], keyClick: 0.5, vibrato: { on: true, type: 'C3' } }),
        });
        for (const n of chord) core.noteOn(n);
        const out = new Float32Array(SR);
        core.render(out);
        let peak = 0;
        for (const s of out) peak = Math.max(peak, Math.abs(s));
        expect(peak, `${model} ${chord.join(',')}`).toBeLessThan(0.6);
        expect(peak, `${model} ${chord.join(',')}`).toBeGreaterThan(0.1);
      }
    }
  });

  it('fadeOut ramps to silence and stays silent', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8] }) });
    for (const n of [48, 60, 64, 67]) core.noteOn(n);
    core.render(new Float32Array(SR / 10));
    expect(core.faded()).toBe(false);
    core.fadeOut(10);
    const fade = new Float32Array(Math.round(0.011 * SR));
    core.render(fade);
    expect(core.faded()).toBe(true);
    expect(rms(fade, 0, 48)).toBeGreaterThan(10 * rms(fade, fade.length - 48));
    const after = new Float32Array(1024);
    core.render(after);
    expect(rms(after)).toBe(0);
  });

  it('pipe ranks fold pitches outside MIDI 0..127 back by octaves (no NaN, right pitch)', () => {
    const peakOf = (x: Float32Array) => x.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
    // PIPE1, −2 octaves, drawbars 7–9 out, A0: the shifted pitch is MIDI −3.
    const low = params({ model: 'PIPE1', octaveShift: -2, drawbars: [0, 0, 0, 0, 0, 0, 8, 8, 8] });
    const lowCore = new OrganCore({ sampleRate: SR, params: low });
    lowCore.noteOn(21);
    for (const id of lowCore.settledTargets().keys()) {
      const f = lowCore.generatorFrequency(id);
      expect(f).toBeGreaterThan(30);
      expect(f).toBeLessThan(200);
    }
    const lowOut = renderOffline(low, [[0, 'on', 21]], 0.3);
    expect(lowOut.some(Number.isNaN)).toBe(false);
    expect(peakOf(lowOut)).toBeGreaterThan(0);
    // A0 −3 octaves = 13.75 Hz; the 1⅗′ (×5), 1⅓′ (×6) and 1′ (×8) ranks sound 68.75, 82.5 and 110 Hz.
    const seg = lowOut.subarray(SR / 5);
    expect(tone(seg, 110)).toBeGreaterThan(0.001);

    // PIPE2, +2 octaves, 16′ out, G#7: the shifted pitch is MIDI 128.
    const high = params({ model: 'PIPE2', octaveShift: 2, drawbars: [8, 0, 0, 0, 0, 0, 0, 0, 0] });
    const highCore = new OrganCore({ sampleRate: SR, params: high });
    highCore.noteOn(104);
    const ids = [...highCore.settledTargets().keys()];
    expect(ids).toHaveLength(1);
    const f = highCore.generatorFrequency(ids[0]);
    expect(f).toBeCloseTo(440 * 2 ** ((116 - 69) / 12) * 0.5, 3); // MIDI 116 at the 16′ ratio, ~3.3 kHz
    const highOut = renderOffline(high, [[0, 'on', 104]], 0.3);
    expect(highOut.some(Number.isNaN)).toBe(false);
    expect(tone(highOut.subarray(SR / 5), f)).toBeGreaterThan(0.001);
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

  it('a held key closes every bus of the new model (Vox, 4 buses → B3, 9 buses)', () => {
    const full = [8, 8, 8, 8, 8, 8, 8, 8, 8];
    const core = new OrganCore({ sampleRate: SR, params: params({ model: 'VOX', drawbars: full }) });
    core.noteOn(60);
    core.render(new Float32Array(1024)); // all four Vox contacts closed
    core.setParams(params({ model: 'B3', drawbars: full }));
    const t = core.settledTargets();
    expect(t.size).toBe(9);
    for (let bus = 0; bus < 9; bus++) expect(t.get(wheelFor(60, bus))).toBe(1);
    core.noteOff(60);
    core.render(new Float32Array(SR / 10));
    expect(core.heldNotes()).toEqual([]);
    expect(core.activeGenerators()).toBe(0);
  });

  it('a model change ramps the old generators out instead of cutting them', () => {
    const core = new OrganCore({ sampleRate: SR, params: params({ drawbars: only8 }) });
    core.noteOn(60);
    const before = new Float32Array(SR / 10);
    core.render(before);
    core.setParams(params({ model: 'PIPE1', drawbars: only8 })); // pipes speak slowly (35 ms)
    const after = new Float32Array(Math.round(0.002 * SR));
    core.render(after);
    // The tonewheel is still fading (20 ms): no gap, and no step at the switch.
    expect(rms(after)).toBeGreaterThan(0.5 * rms(before, before.length - 4800));
    let slope = 0; // the waveform's own largest sample-to-sample move
    for (let i = 1; i < before.length; i++) slope = Math.max(slope, Math.abs(before[i] - before[i - 1]));
    expect(Math.abs(after[0] - before[before.length - 1])).toBeLessThan(1.5 * slope);
    core.render(new Float32Array(Math.round(0.03 * SR)));
    expect(core.activeGenerators()).toBe(1); // only the pipe is left
  });
});

describe('output leveller', () => {
  const raw = (o: Partial<OrganParams>, ev: Parameters<typeof renderOffline>[1], seconds: number, level: boolean) => {
    const core = new OrganCore({ sampleRate: SR, params: params(o), seed: 5, level });
    const out = new Float32Array(Math.round(seconds * SR));
    let pos = 0;
    for (const [t, kind, note] of ev) {
      const at = Math.round(t * SR);
      if (at > pos) { core.render(out, pos, at - pos); pos = at; }
      if (kind === 'on') core.noteOn(note); else core.noteOff(note);
    }
    core.render(out, pos, out.length - pos);
    return out;
  };

  it('lifts a single key by the full makeup (+12 dB: one B3 key on 888000000 peaks about −23 dBFS, was −35)', () => {
    const p = { drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0] };
    const on = raw(p, [[0, 'on', 60]], 0.3, true);
    const off = raw(p, [[0, 'on', 60]], 0.3, false);
    expect(rms(on, SR / 10) / rms(off, SR / 10)).toBeCloseTo(LEVEL_MAKEUP, 3);
    const peak = on.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
    expect(20 * Math.log10(peak)).toBeGreaterThan(-24);
  });

  it('compresses big chords instead (the chord-peak test above pins the ceiling)', () => {
    const p = { drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8] };
    const chord = [36, 48, 55, 60, 64, 67, 72, 76, 79, 84].map((n) => [0, 'on', n] as const);
    const gain = rms(raw(p, chord, 0.3, true), SR / 10) / rms(raw(p, chord, 0.3, false), SR / 10);
    expect(gain).toBeLessThan(LEVEL_MAKEUP / 3);
  });

  it('eases a held note back up when the others are released (no jump)', () => {
    const p = { drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8] };
    const others = [48, 55, 64, 67, 72, 76, 79, 84];
    const ev = [
      [0, 'on', 60], ...others.map((n) => [0, 'on', n] as const), ...others.map((n) => [0.2, 'off', n] as const),
    ] as const;
    const on = raw(p, ev, 0.8, true);
    const off = raw(p, ev, 0.8, false);
    // The gain envelope is the ratio of the levelled to the raw render, per 5 ms window.
    const win = SR / 200;
    const g: number[] = [];
    for (let a = Math.round(0.2 * SR) + win; a + win <= on.length; a += win) g.push(rms(on, a, a + win) / rms(off, a, a + win));
    for (let i = 1; i < g.length; i++) {
      expect(g[i]).toBeGreaterThanOrEqual(g[i - 1] * 0.999); // only rises
      expect(20 * Math.log10(g[i] / g[i - 1])).toBeLessThan(1); // < 1 dB per 5 ms
    }
    expect(g[g.length - 1]).toBeGreaterThan(1.5 * g[0]);
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
