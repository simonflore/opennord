import { describe, it, expect } from 'vitest';
import { centsBetween, measure, noteToHz } from './analysis';
import {
  analyzeSweep, CLOCK_43K, compareRows, formatRows, formatSweep, measureReference, organParamsFromFlags, organReference,
  pianoReference, referenceMono, synthReference,
} from './compare';
import { buildNpno, defaultDecayCoefficient } from '../ns4/nsp-write';
import { testPianoSpecs } from './test-piano';

const SR = 48000;
const t2 = buildNpno(testPianoSpecs()[2].input).bytes;
const t1 = buildNpno(testPianoSpecs()[1].input).bytes;

describe('organ reference', () => {
  it('reads drawbar, percussion and vibrato flags', () => {
    const p = organParamsFromFlags({ drawbars: '888000000', perc: '3rd,slow,soft', vib: 'C3', click: 0 });
    expect(p.drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(p.percussion).toEqual({ on: true, harm3rd: true, decayFast: false, volSoft: true });
    expect(p.vibrato).toEqual({ on: true, type: 'C3' });
    expect(organParamsFromFlags({}).percussion.on).toBe(false);
    expect(() => organParamsFromFlags({ drawbars: '889' })).toThrow();
    expect(() => organParamsFromFlags({ vib: 'X9' })).toThrow();
  });

  it('renders A4 at 440 Hz, and a render compared with itself shows no deltas', () => {
    const r = organReference(organParamsFromFlags({ drawbars: '008000000', click: 0 }), 69, 1, 1.3, SR);
    const m = measureReference(r, {});
    expect(Math.abs(centsBetween(m.f0!.hz, 440))).toBeLessThan(2);
    const rows = compareRows(m, m, 440);
    expect(rows.find((x) => x.label === 'Pitch (f0)')!.delta).toBe('+0.0 cents');
    expect(rows.find((x) => x.label === 'Peak level')!.delta).toBe('+0.0 dB');
    expect(formatRows(rows)).toMatch(/Pitch \(f0\)\s+440\.\d\d Hz\s+440\.\d\d Hz\s+\+0\.0 cents/);
  });

  it('times a fast percussion decay', () => {
    const r = organReference(organParamsFromFlags({ drawbars: '000000000', perc: '2nd,fast,normal', click: 0 }), 69, 1, 1, SR);
    const m = measureReference(r, {});
    // the maintainers’ notes: fast decay falls 20 dB in about 0.13 s.
    expect(m.env.decay20Ms!).toBeGreaterThan(100);
    expect(m.env.decay20Ms!).toBeLessThan(160);
  });
});

describe('piano reference', () => {
  it('picks the layer by velocity, with the +20 selection offset', () => {
    expect(pianoReference(t2, { key: 69, velocity: 127, holdS: 0.5, totalS: 0.6, sampleRate: SR }).stroke.layer).toBe(0);
    expect(pianoReference(t2, { key: 69, velocity: 100, holdS: 0.5, totalS: 0.6, sampleRate: SR }).stroke.layer).toBe(0);
    expect(pianoReference(t2, { key: 69, velocity: 60, holdS: 0.5, totalS: 0.6, sampleRate: SR }).stroke.layer).toBe(1);
    // velocity 80 → 8 dB (40 steps): with +20 it reaches the soft layer's switch point (50), without it doesn't
    expect(pianoReference(t2, { key: 69, velocity: 80, holdS: 0.5, totalS: 0.6, sampleRate: SR }).stroke.layer).toBe(1);
    expect(pianoReference(t2, { key: 69, velocity: 80, selectOffset: 0, holdS: 0.5, totalS: 0.6, sampleRate: SR }).stroke.layer).toBe(0);
    expect(pianoReference(t2, { key: 69, layer: 1, holdS: 0.5, totalS: 0.6, sampleRate: SR }).stroke.layer).toBe(1);
    // the maintainers’ notes B4: the sweep switches between 95 and 87 (+20), or 79 and 71 (no offset)
    const layerAt = (velocity: number, selectOffset?: number) =>
      pianoReference(t2, { key: 69, velocity, selectOffset, holdS: 0.1, totalS: 0.1, sampleRate: SR }).stroke.layer;
    expect([95, 87].map((v) => layerAt(v))).toEqual([0, 1]);
    expect([79, 71].map((v) => layerAt(v, 0))).toEqual([0, 1]);
    expect(() => pianoReference(t2, { key: 70, holdS: 0.5, totalS: 0.6, sampleRate: SR })).toThrow(/plays nothing/);
  });

  it('predicts the three pitch hypotheses on key A4 (the recorded note) and G#4', () => {
    const at = (key: number) => Object.fromEntries(
      pianoReference(t1, { key, holdS: 0.5, totalS: 0.6, sampleRate: SR }).pitch.map((h) => [h.id, h.hz]),
    );
    const a4 = at(69);
    expect(a4.A).toBeCloseTo(440, 1);
    expect(a4.B).toBeCloseTo(440, 1); // +27 c is clamped: a stroke never plays above its recording
    expect(a4.C).toBeCloseTo((440 * CLOCK_43K) / 44100, 1); // ≈ 433.0 Hz
    const gs4 = at(68);
    expect(centsBetween(gs4.A, noteToHz(68))).toBeCloseTo(0, 1);
    expect(centsBetween(gs4.B, noteToHz(68))).toBeCloseTo(27, 1);
    expect(centsBetween(gs4.C, noteToHz(68))).toBeCloseTo(27 - 1200 * Math.log2(44100 / CLOCK_43K), 1);
  });

  it('renders the transposed stroke at the predicted pitch, level and loop decay', () => {
    const r = pianoReference(t1, { key: 57, velocity: 127, holdS: 2, totalS: 2.2, sampleRate: SR });
    const m = measureReference(r, {});
    expect(Math.abs(centsBetween(m.f0!.hz, 220))).toBeLessThan(0.5);
    // level word 125, attenuation 0, +0x40C trim 40 (0.1 dB): lvl 145 → −14.6 dB
    expect(r.stroke.levelWord).toBe(125);
    expect(r.stroke.predictedGainDb).toBeCloseTo(-14.55, 1);
    expect(r.stroke.loopDecayDbPerS).toBeCloseTo(20 * Math.log10(defaultDecayCoefficient(65) / 2 ** 23) * 22050, 6);
    expect(r.stroke.damperIndex).toBe(13);
    expect(r.notes.join('\n')).toMatch(/zone 1, layer 1 of 1/);
  });

  it('finds the layer change in a velocity sweep', () => {
    const vels = [127, 100, 60, 20];
    const gap = new Float32Array(Math.round(0.8 * SR));
    const parts = vels.flatMap((v) => [gap, referenceMono(pianoReference(t2, { key: 69, velocity: v, holdS: 1, totalS: 1.2, sampleRate: SR }))]);
    const x = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
    let o = 0;
    for (const p of parts) { x.set(p, o); o += p.length; }
    const notes = analyzeSweep(x, SR, vels);
    expect(notes).toHaveLength(4);
    expect(notes.map((n) => n.layerChange)).toEqual([false, false, true, false]);
    // OpenNord's approximate Touch law: 40·log10(v/127) dB
    expect(notes[0].peakDb - notes[1].peakDb).toBeCloseTo(40 * Math.log10(127 / 100), 0);
    expect(formatSweep(notes)).toMatch(/brightness jump/);
  });
});

describe('synth reference', () => {
  it('renders a held saw at the note pitch', () => {
    const r = synthReference(
      { wave: 'saw', ampEnv: { attack: 0.001, decay: Infinity, release: 0.1 }, filter: null }, 57, 1, 1.5, SR,
    );
    expect(r.channels[0].length).toBe(1.5 * SR);
    const m = measure(r.channels[0], SR);
    expect(Math.abs(centsBetween(m.f0!.hz, 220))).toBeLessThan(1);
  });
});
