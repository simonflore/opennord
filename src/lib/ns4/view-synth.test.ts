import { describe, it, expect } from 'vitest';
import type { NS4Layer } from './types';
import { synthCard, synthStats, layerFxChain, layerFxChips } from './view';

/** A synth layer as the decoder prints it — hand-built, so these run without any fixture. */
const layer = (over: Partial<NS4Layer> = {}): NS4Layer => ({
  id: 'A', kind: 'synth', source: 'analog', oscType: '1 (ANALOG)', oscWave: '1 (Sub Square Saw)',
  filter: { on: true, type: 'LP24', freq: { value: '440 Hz', wheel: '4.2 kHz' }, resonance: { value: '2.5' } },
  lfo: { shape: 'triangle', target: 'FILTER', rate: { value: '0.60 Hz' }, amount: { value: '2.8' } },
  ...over,
});

describe('synthCard — filter', () => {
  it('points the knobs at their position and sweeps the morphed one', () => {
    const c = synthCard(layer());
    expect(c.cutoffFill).toBe(47);          // 440 Hz is step 60 of 127
    expect(c.cutoffMorphFill).toEqual([78]); // 4.2 kHz is step 99
    expect(c.resFill).toBe(25);
    expect(c.resCaption).toBeUndefined();
    expect(c.filter).toEqual({ type: 'LP24', cutoffHz: 440, res: 0.25, morphHz: [4200] });
  });

  it('reads the second knob as the high-pass corner in LP+HP', () => {
    const c = synthCard(layer({ filter: { on: true, type: 'LPHP', freq: { value: '4.2 kHz' }, resonance: { value: '440 Hz' } } }));
    expect(c.resCaption).toBe('HP freq');
    expect(c.resFill).toBe(47);
    expect(c.filter).toMatchObject({ type: 'LPHP', hpHz: 440 });
    expect(c.filter).not.toHaveProperty('res');
  });

  it('draws no curve for a filter that is off, but still places the knobs', () => {
    const c = synthCard(layer({ filter: { on: false, type: 'LP24', freq: { value: '440 Hz' }, resonance: { value: '0.0' } } }));
    expect(c.filter).toBeUndefined();
    expect(c.cutoffFill).toBe(47);
  });
});

describe('synthCard — oscillator, LFO, arpeggiator', () => {
  it('names the wave shape of an analog oscillator only', () => {
    expect(synthCard(layer()).wave).toEqual({ shape: 'saw' });
    expect(synthCard(layer({ oscType: '2 (FM-H)', oscWave: '5' })).wave).toBeUndefined();
    expect(synthCard(layer({ source: 'samples' })).wave).toBeUndefined();
  });

  it('shows an LFO that moves something, and hides one that does not', () => {
    expect(synthCard(layer()).lfo).toMatchObject({ shape: 'triangle', target: 'FILTER', rate: '0.60 Hz', amount: '2.8' });
    const lfo = layer().lfo!;
    expect(synthCard(layer({ lfo: { ...lfo, target: 'nothing' } })).lfo).toBeUndefined();
    expect(synthCard(layer({ lfo: { ...lfo, amount: { value: '0.0' } } })).lfo).toBeUndefined();
    expect(synthCard(layer({ lfo: { ...lfo, target: 'PITCH', amount: { value: '0 cent' } } })).lfo).toBeUndefined();
  });

  it('carries both LFO morphs when rate and amount are each assigned', () => {
    const lfo = layer().lfo!;
    const c = synthCard(layer({ lfo: { ...lfo, rate: { value: '0.60 Hz', pedal: '4.1 Hz' }, amount: { value: '2.8', wheel: '6.0' } } }));
    expect(c.lfo?.morph).toEqual({ wheel: '6.0', at: undefined, pedal: '4.1 Hz' });
  });

  it('shows a running arpeggiator, with its steps only when the pattern is on', () => {
    const arp = { run: true, mode: 'Arp', direction: 'UP', rate: { value: '1/8' }, range: { value: '2.5' },
      patternLength: 6, accent: '>..> .... .... ....', pan: 'CLCR CCCC CCCC CCCC' };
    expect(synthCard(layer()).arp).toBeUndefined();
    expect(synthCard(layer({ arp })).arp).toMatchObject({ mode: 'Arp', rate: '1/8', steps: undefined });
    const steps = synthCard(layer({ arp: { ...arp, pattern: true } })).arp!.steps!;
    expect(steps).toHaveLength(6);
    expect(steps.map((s) => s.accent)).toEqual([true, false, false, true, false, false]);
    expect(steps.map((s) => s.pan).join('')).toBe('CLCRCC');
  });

  it('drops the placeholder rate of a mode that has none', () => {
    expect(synthCard(layer({ arp: { run: true, mode: 'Gate', rate: { value: 'N.A.' } } })).arp?.rate).toBeUndefined();
  });

  it('leaves LFO and arpeggiator out of the stats grid (they have their own rows)', () => {
    const labels = synthStats(layer({ arp: { run: true } })).map((s) => s.label);
    expect(labels).not.toContain('LFO');
    expect(labels).not.toContain('arp');
  });
});

describe('layerFxChain', () => {
  const fx = layer({
    ampSimEq: { on: true, mode: 'off', bass: '-5.0 dB', mid: '+0.0 dB', treb: '+3.0 dB', freq: { value: '999 Hz' }, drive: { value: '0.0' } },
    reverb: { on: true, type: 'HALL', amount: { value: '4.7' } },
  });

  it('lists every slot in signal order, on or off', () => {
    expect(layerFxChain(fx).map((s) => [s.label, s.on])).toEqual([
      ['Mod 1', false], ['Mod 2', false], ['Amp/EQ', true], ['Comp', false], ['Delay', false], ['Reverb', true],
    ]);
  });

  it('says "EQ only" for a lit Amp/EQ whose amp model is off, and carries its EQ', () => {
    const amp = layerFxChain(fx)[2];
    expect(amp.detail).toBe('EQ only');
    expect(amp.eq).toEqual({ bassDb: -5, midDb: 0, trebDb: 3, midHz: 999 });
  });

  it('chips are the slots that are on, prefixed with the engine when asked', () => {
    expect(layerFxChips(fx).map((c) => c.label)).toEqual(['Amp/EQ', 'Reverb']);
    expect(layerFxChips(fx, 'Synth').map((c) => c.label)).toEqual(['Synth Amp/EQ', 'Synth Reverb']);
  });
});
