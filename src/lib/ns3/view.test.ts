import { describe, it, expect } from 'vitest';
import type { Ns3Panel } from './decode';
import { ns3EngineCards, ns3FxChips, ns3HeaderView, ns3SampleKey } from './view';

/** A synthetic Panel A: B3 organ + grand piano + a Wave synth, no FX. */
function panel(over: Partial<Ns3Panel> = {}): Ns3Panel {
  return {
    id: 'A',
    organ: {
      on: true, type: 'B3', volume: '-2.0 dB', drawbars: [8, 0, 8, 0, 0, 0, 0, 0, 3],
      octaveShift: 0,
      vibChorus: { on: true, mode: 'C1' },
      percussion: { on: true, third: true, fast: true, soft: false },
    },
    piano: {
      on: true, type: 'Grand', volume: '0.0 dB',
      sampleId: 123, sampleVariation: 0, timbre: 'Soft', octaveShift: 0,
    },
    synth: {
      on: true, volume: '1.4 dB', voice: 'Poly', glide: '0.0', unison: 'Off', vibrato: 'Off',
      oscillator: { type: 'Wave', waveform: 'Wave Bell', config: 'None', pitch: '0 semi' },
      filter: { type: 'LP24', cutoff: '6.3 kHz', resonance: '2.0', kbTrack: 'Off', drive: 'Off' },
      lfo: { wave: 'Triangle', rate: '1.0 Hz', masterClock: false },
      envMod: { attack: '0.5 ms', decay: '120 ms', release: '200 ms' },
      envAmp: { attack: '0.5 ms', decay: '120 ms', release: '200 ms', velocity: 'Off' },
      arp: { on: false, range: '1 Octave', pattern: 'Up', rate: '120', masterClock: false },
      sampleId: 0, osc: 'Wave', cutoff: '6.3 kHz', filter_type: 'LP24',
    },
    fx: [],
    ...over,
  };
}

describe('ns3EngineCards', () => {
  it('emits one card per active engine, in organ/piano/synth order', () => {
    const cards = ns3EngineCards(panel());
    expect(cards.map((c) => c.kind)).toEqual(['organ', 'piano', 'synth']);
  });

  it('skips engines that are off', () => {
    const p = panel();
    p.piano.on = false;
    expect(ns3EngineCards(p).map((c) => c.kind)).toEqual(['organ', 'synth']);
  });

  it('builds a B3 organ card with footage-coloured drawbars and no preset/sustain/rotary', () => {
    const card = ns3EngineCards(panel())[0];
    if (card.kind !== 'organ') throw new Error('expected organ');
    expect(card.organ.isB3).toBe(true);
    expect(card.organ.drawbars[0]).toMatchObject({ level: 8, footage: '16′', color: 'brown' });
    expect(card.organ.vibChorus).toEqual({ on: true, type: 'C1' });
    expect(card.organ.percussion).toMatchObject({ applicable: true, on: true, harm3rd: true, decayFast: true });
    expect(card.organ.preset).toBeUndefined();
    expect(card.organ.sustain).toBeUndefined();
    expect(card.organ.rotary).toBeUndefined();
    expect(card.volume).toMatchObject({ value: '-2.0 dB' });
  });

  it('dims percussion for non-B3 organ models', () => {
    const p = panel();
    p.organ.type = 'Vox';
    const card = ns3EngineCards(p)[0];
    if (card.kind !== 'organ') throw new Error('expected organ');
    expect(card.organ.isB3).toBe(false);
    expect(card.organ.percussion.applicable).toBe(false);
  });

  it('builds a piano card with timbre but no touch knob', () => {
    const card = ns3EngineCards(panel())[1];
    if (card.kind !== 'piano') throw new Error('expected piano');
    expect(card.piano.timbre).toBe('Soft');
    expect(card.piano.touch).toBeUndefined();
    expect(card.piano.model).toBe('Grand'); // falls back to type when no name resolved
  });

  it('uses a resolved sample name for the piano model when provided', () => {
    const card = ns3EngineCards(panel(), { [ns3SampleKey('A', 'Piano')]: 'Grand Piano 2.3' })[1];
    if (card.kind !== 'piano') throw new Error('expected piano');
    expect(card.piano.model).toBe('Grand Piano 2.3');
  });

  it('builds a synth card with two env glyphs and morph-free knobs', () => {
    const card = ns3EngineCards(panel())[2];
    if (card.kind !== 'synth') throw new Error('expected synth');
    expect(card.synth.osc).toBe('Wave Bell');
    expect(card.synth.filterType).toBe('LP24');
    expect(card.synth.cutoff).toBe('6.3 kHz');
    expect(card.synth.cutoffMorph).toBeUndefined();
    expect(card.env).not.toBeNull();
    expect(card.modEnv).not.toBeUndefined();
  });

  it('uses the resolved sample name as the synth LCD label for Sample oscillators', () => {
    const p = panel();
    p.synth.oscillator.type = 'Sample';
    p.synth.oscillator.waveform = '';
    p.synth.sampleId = 999;
    const card = ns3EngineCards(p, { [ns3SampleKey('A', 'Synth')]: 'Mellotron Choir' })[2];
    if (card.kind !== 'synth') throw new Error('expected synth');
    expect(card.synth.osc).toBe('Mellotron Choir');
  });
});

describe('ns3FxChips', () => {
  it('emits one chip per active FX with decoded params in the detail', () => {
    const p = panel({ fx: [
      { name: 'Reverb', type: 'Hall 1', params: { amount: '6.0' } },
      { name: 'Comp', params: { amount: '4.0' } },
    ] });
    const chips = ns3FxChips(p);
    expect(chips.map((c) => c.label)).toEqual(['Reverb', 'Comp']);
    expect(chips[0]).toMatchObject({ key: 'A-Reverb', label: 'Reverb', detail: 'Hall 1 · amt 6.0' });
    expect(chips[1].detail).toBe('amt 4.0');
  });

  it('returns an empty list when no FX are on', () => {
    expect(ns3FxChips(panel())).toEqual([]);
  });
});

describe('ns3HeaderView', () => {
  it('summarises active engines per panel', () => {
    const a = panel();
    const b = panel({ id: 'B' });
    b.organ.on = false; b.synth.on = false; // Panel B: piano only
    const h = ns3HeaderView(new Uint8Array(64), 'My Patch', [a, b]);
    expect(h.name).toBe('My Patch');
    expect(h.summary).toBe('Panel A: organ + piano + synth · Panel B: piano');
    expect(h.sizeBytes).toBe(64);
  });
});
