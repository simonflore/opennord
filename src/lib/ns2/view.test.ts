import { describe, it, expect } from 'vitest';
import type { Ns2Slot } from './decode';
import { ns2EngineCards, ns2FxPanel, ns2HeaderView, ns2SampleKey } from './view';

function env() { return { attackMidi: 0, attack: '0.5 ms', decayMidi: 0, decay: '120 ms', releaseMidi: 0, release: '200 ms', velocity: false }; }

/** Synthetic Slot A: B3 organ + grand piano + synth, no FX. */
function slot(over: Partial<Ns2Slot> = {}): Ns2Slot {
  return {
    id: 'A', active: true,
    organ: {
      on: true, type: 'B3', volume: '-2.0 dB', volumeMidi: 100, octaveShift: 0,
      kbZone: '', pitchStick: false, sustainPedal: false, latchPedal: false, kbGate: false, output: 'A',
      preset2: false, drawbars: [8, 0, 8, 0, 0, 0, 0, 0, 3], drawbars2: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      vibChorus: { on: true, mode: 'C1' },
      percussion: { on: true, third: true, fast: true, soft: false },
    },
    piano: {
      on: true, type: 'Grand', volume: '0.0 dB', volumeMidi: 110, octaveShift: 0,
      kbZone: '', pitchStick: false, sustainPedal: false, latchPedal: false, kbGate: false, output: 'A',
      sampleId: 123, clavVariation: 0, slotDetune: '0', dynamics: 'Soft', longRelease: false,
      stringResonance: true, pedalNoise: false, clavinetModel: '', clavinetEq: '', clavinetEqHi: '',
    },
    synth: {
      on: true, osc: 'Saw', volume: '1.4 dB', volumeMidi: 105, octaveShift: 0,
      kbZone: '', pitchStick: false, sustainPedal: false, latchPedal: false, kbGate: false, kbHold: false, output: 'A',
      sampleId: 0, voice: 'Poly', glide: 0, unison: 'Off', vibrato: 'Off',
      arpEnabled: false, arpRateMidi: 0, arpRate: '120', arpMasterClock: false, arpRange: '1 Oct', arpPattern: 'Up',
      filter: { type: 'LP24', freqMidi: 90, freq: '6.3 kHz', resonanceMidi: 25, mod1Midi: 0, mod2Midi: 0, kbTrack: false },
      modEnv: env(), ampEnv: env(), lfoWave: 'Triangle', lfoRateMidi: 40, lfoRate: '1.0 Hz', lfoMasterClock: false,
    },
    fx: [],
    ...over,
  };
}

describe('ns2EngineCards', () => {
  it('emits one card per active engine, organ/piano/synth order', () => {
    expect(ns2EngineCards(slot()).map((c) => c.kind)).toEqual(['organ', 'piano', 'synth']);
  });

  it('B3 organ has footage-coloured drawbars, no preset/sustain/rotary', () => {
    const card = ns2EngineCards(slot())[0];
    if (card.kind !== 'organ') throw new Error('organ');
    expect(card.organ.isB3).toBe(true);
    expect(card.organ.drawbars[0]).toMatchObject({ level: 8, footage: '16′', color: 'brown' });
    expect(card.organ.preset).toBeUndefined();
    expect(card.organ.rotary).toBeUndefined();
  });

  it('uses the active preset drawbars when preset2 is set', () => {
    const s = slot();
    s.organ.preset2 = true;
    s.organ.drawbars2 = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    const card = ns2EngineCards(s)[0];
    if (card.kind !== 'organ') throw new Error('organ');
    expect(card.organ.drawbars[0]).toMatchObject({ level: 1 });
  });

  it('Farfisa organ has no drawbar ladder', () => {
    const s = slot();
    s.organ.type = 'Farfisa';
    const card = ns2EngineCards(s)[0];
    if (card.kind !== 'organ') throw new Error('organ');
    expect(card.organ.isB3).toBe(false);
    expect(card.organ.drawbars).toEqual([]);
    expect(card.organ.percussion.applicable).toBe(false);
  });

  it('piano card has no timbre/touch knobs; details go to stats', () => {
    const card = ns2EngineCards(slot())[1];
    if (card.kind !== 'piano') throw new Error('piano');
    expect(card.piano.timbre).toBeUndefined();
    expect(card.piano.touch).toBeUndefined();
    expect(card.piano.model).toBe('Grand');
    expect(card.stats.some((st) => st.label === 'string res')).toBe(true);
  });

  it('synth card: two env glyphs, formatted resonance, no osc detail', () => {
    const card = ns2EngineCards(slot())[2];
    if (card.kind !== 'synth') throw new Error('synth');
    expect(card.synth.osc).toBe('Saw');
    expect(card.synth.oscDetail).toBe('');
    expect(card.synth.filterType).toBe('LP24');
    expect(card.synth.cutoff).toBe('6.3 kHz');
    expect(card.synth.res).toBe('2.0'); // 25/12.7 → 1.96 → "2.0"
    expect(card.env).not.toBeNull();
    expect(card.modEnv).not.toBeUndefined();
  });

  it('uses a resolved sample name for a SAMPLE-osc synth', () => {
    const s = slot();
    s.synth.osc = 'SAMPLE';
    s.synth.sampleId = 999;
    const card = ns2EngineCards(s, { [ns2SampleKey('A', 'Synth')]: 'Mellotron' })[2];
    if (card.kind !== 'synth') throw new Error('synth');
    expect(card.synth.osc).toBe('Mellotron');
  });
});

describe('ns2FxPanel', () => {
  const four = ['Effect 1', 'Effect 2', 'Delay', 'Amp/EQ'].map((name) => ({ name, on: name === 'Delay', settings: [] }));
  const global = ['Rotary', 'Comp', 'Reverb'].map((name) => ({ name, on: name === 'Reverb', settings: [] }));

  it('gives each slot a row of its four blocks, then one Global row', () => {
    const view = ns2FxPanel([slot({ id: 'A', fx: four }), slot({ id: 'B', fx: four })], global);
    expect(view.groups.map((g) => [g.label, g.units.map((u) => u.label)])).toEqual([
      ['Slot A', ['Effect 1', 'Effect 2', 'Delay', 'Amp/EQ']],
      ['Slot B', ['Effect 1', 'Effect 2', 'Delay', 'Amp/EQ']],
      ['Global', ['Rotary', 'Comp', 'Reverb']],
    ]);
  });

  it('a program with one slot has that slot\'s row and the Global row', () => {
    expect(ns2FxPanel([slot({ id: 'B', fx: four })], global).groups.map((g) => g.label)).toEqual(['Slot B', 'Global']);
  });

  it('keys slot units by slot and global units apart from both', () => {
    const keys = ns2FxPanel([slot({ id: 'A', fx: four }), slot({ id: 'B', fx: four })], global).groups.flatMap((g) => g.units.map((u) => u.key));
    expect(new Set(keys).size).toBe(11);
    expect(keys).toContain('A-Delay');
    expect(keys).toContain('g-Reverb');
  });

  it('keeps off blocks, dimmed, and lights the ones that are on', () => {
    const view = ns2FxPanel([slot({ id: 'A', fx: four })], global);
    expect(view.groups[0].units.filter((u) => u.on).map((u) => u.label)).toEqual(['Delay']);
    expect(view.groups[1].units.filter((u) => u.on).map((u) => u.label)).toEqual(['Reverb']);
  });

  it('has no Global row when the program reports no global effects', () => {
    expect(ns2FxPanel([slot({ id: 'A', fx: four })], []).groups.map((g) => g.label)).toEqual(['Slot A']);
  });
});

describe('ns2HeaderView', () => {
  it('summarises active engines per slot', () => {
    const a = slot();
    const b = slot({ id: 'B' });
    b.organ.on = false; b.synth.on = false;
    const h = ns2HeaderView(new Uint8Array(64), [a, b]);
    expect(h.engines).toEqual({
      axis: 'container', term: 'Slot',
      groups: [{ id: 'A', engines: ['organ', 'piano', 'synth'] }, { id: 'B', engines: ['piano'] }],
    });
    expect(h.sizeBytes).toBe(64);
  });
});
