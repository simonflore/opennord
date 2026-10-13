import { describe, it, expect } from 'vitest';
import { decodeNs3, TIMBRE_CLAV, TIMBRE_ELECTRIC, TIMBRE_GRAND, type Ns3Panel } from './decode';
import { ns3EngineCards, ns3FxPanel, ns3HeaderView, ns3SampleKey, ns3Zones, timbreKeysNs3 } from './view';
import { ns3ZeroFile } from './file.synth';
import { setting } from '../clavia/fx-block';

/** A synthetic Panel A: B3 organ + grand piano + a Wave synth, no FX. */
function panel(over: Partial<Ns3Panel> = {}): Ns3Panel {
  return {
    id: 'A',
    organ: {
      on: true, type: 'B3', kbZones: '1111', volume: '-2.0 dB', drawbars: [8, 0, 8, 0, 0, 0, 0, 0, 3],
      octaveShift: 0,
      vibChorus: { on: true, mode: 'C1' },
      percussion: { on: true, third: true, fast: true, soft: false },
    },
    piano: {
      on: true, type: 'Grand', kbZones: '1111', volume: '0.0 dB',
      sampleId: 123, sampleVariation: 0, timbre: 'Soft', octaveShift: 0,
    },
    synth: {
      on: true, kbZones: '1111', volume: '1.4 dB', voice: 'Poly', glide: '0.0', unison: 'Off', vibrato: 'Off',
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

  it('draws the timbre as the piano type\'s LED keys, the setting lit', () => {
    const keys = (type: string, timbre: string) => {
      const p = panel();
      p.piano.type = type;
      p.piano.timbre = timbre;
      const card = ns3EngineCards(p)[1];
      if (card.kind !== 'piano') throw new Error('expected piano');
      return card.piano.timbreKeys;
    };
    const lit = (k?: { label: string; on: boolean }[]) => k?.filter((x) => x.on).map((x) => x.label);
    expect(keys('Grand', 'Soft')?.map((k) => k.label)).toEqual(['Soft', 'Mid', 'Bright']);
    expect(lit(keys('Grand', 'Soft'))).toEqual(['Soft']);
    expect(lit(keys('Electric', 'Dyno2'))).toEqual(['Dyno 2']);
    expect(keys('Clav', 'None')?.map((k) => k.label)).toEqual(['Soft', 'Treble', 'Brilliant']);
    expect(lit(keys('Clav', 'None'))).toEqual([]);
    expect(lit(keys('Clav', 'Soft+Treb'))).toEqual(['Soft', 'Treble']);
    expect(lit(keys('Clav', 'Soft+Brill'))).toEqual(['Soft', 'Brilliant']);
    expect(lit(keys('Electric', 'Dyno1'))).toEqual(['Dyno 1']);
    expect(lit(keys('Clav', 'Soft+Trb+Brill'))).toEqual(['Soft', 'Treble', 'Brilliant']);
    expect(lit(keys('Clav', 'Treb+Brill'))).toEqual(['Treble', 'Brilliant']);
    expect(keys('Grand', '#9')).toBeUndefined(); // a value past the tables keeps the knob
    expect(keys('#6', 'Soft')).toBeUndefined(); // so does a piano type that isn't decoded
  });

  it('has keys for every label in the firmware timbre tables', () => {
    // A renamed label in decode.ts would otherwise bring the knob back silently.
    const tables: [string, readonly string[]][] = [['Grand', TIMBRE_GRAND], ['Clav', TIMBRE_CLAV], ['Electric', TIMBRE_ELECTRIC]];
    for (const [type, labels] of tables) {
      for (const label of labels) expect(timbreKeysNs3(type, label), `${type} ${label}`).toBeDefined();
    }
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

describe('ns3FxPanel', () => {
  const block = (name: string, on = false) => ({ name, on, settings: [] });
  const seven = ['Rotary', 'Effect 1', 'Effect 2', 'Delay', 'Amp/EQ', 'Comp', 'Reverb'];

  it('gives each panel a row with its seven blocks in panel order, on or off', () => {
    const fx = seven.map((n) => block(n, n === 'Reverb'));
    const view = ns3FxPanel([panel({ id: 'A', fx }), panel({ id: 'B', fx })]);
    expect(view.groups.map((g) => g.label)).toEqual(['Panel A', 'Panel B']);
    expect(view.groups[0].units.map((u) => [u.label, u.on])).toEqual([
      ['Rotary', false], ['Effect 1', false], ['Effect 2', false], ['Delay', false], ['Amp/EQ', false], ['Comp', false], ['Reverb', true],
    ]);
    expect(view.groups[0].kind).toBeUndefined();
  });

  it('keys units by panel so two panels never collide', () => {
    const fx = seven.map((n) => block(n));
    const keys = ns3FxPanel([panel({ id: 'A', fx }), panel({ id: 'B', fx })]).groups.flatMap((g) => g.units.map((u) => u.key));
    expect(new Set(keys).size).toBe(14);
    expect(keys[0]).toBe('A-Rotary');
  });

  it('does not merge two panels even when their effects match: each panel is its own sound', () => {
    const fx = seven.map((n) => block(n));
    expect(ns3FxPanel([panel({ id: 'A', fx }), panel({ id: 'B', fx })]).groups).toHaveLength(2);
  });

  it('carries a block\'s settings, switches and source through to its unit', () => {
    const delay = {
      name: 'Delay', on: true, source: 'Synth',
      settings: [setting('rate', '484 ms'), setting('mix', '5.0', 64, { wheel: '10.0' })],
      switches: { pingPong: true },
    };
    const u = ns3FxPanel([panel({ id: 'A', fx: [delay] })]).groups[0].units[0];
    expect(u.params).toEqual([{ label: 'Rate', value: '484 ms' }, { label: 'Mix', value: '5.0', fill: 50, morph: { wheel: '10.0' } }]);
    expect(u.switches).toEqual([{ label: 'Ping Pong', on: true }]);
    expect(u.source?.find((k) => k.on)?.label).toBe('Synth');
  });

  it('is empty for a program with no panels', () => {
    expect(ns3FxPanel([]).groups).toEqual([]);
  });

  it('reads a decoded Panel B: seven units, the program-wide rotary speed and the firmware amp label', () => {
    const b = ns3ZeroFile();    // NSM-era file, every field zero
    b[0x31] = 1 << 5;           // panel B only
    b[0x34] = 0x00; b[0x35] = 0x00; // MultiCommon rotary speed raw 0 → Stop
    b[0x10b + 263] = 0x80;      // panel B rotary on
    b[0x129 + 263] = 0x04;      // panel B amp on, type 0 → Clean
    const units = (bytes: Uint8Array) => ns3FxPanel(decodeNs3(bytes).panels).groups[0].units;
    expect(ns3FxPanel(decodeNs3(b).panels).groups.map((g) => g.label)).toEqual(['Panel B']);
    expect(units(b).map((u) => u.label)).toEqual(seven);
    expect(units(b).filter((u) => u.on).map((u) => u.label)).toEqual(['Rotary', 'Amp/EQ']);
    expect(units(b)[0].params.find((p) => p.label === 'Speed')?.value).toBe('Stop');
    expect(units(b)[4].type).toBe('Clean');
    b[0x34] = 0x01;             // raw 2 → Fast, read from the shared block for Panel B
    expect(units(b)[0].params.find((p) => p.label === 'Speed')?.value).toBe('Fast');
  });
});

describe('ns3HeaderView', () => {
  it('summarises active engines per panel', () => {
    const a = panel();
    const b = panel({ id: 'B' });
    b.organ.on = false; b.synth.on = false; // Panel B: piano only
    const h = ns3HeaderView(new Uint8Array(64), 'My Patch', [a, b]);
    expect(h.name).toBe('My Patch');
    expect(h.engines).toEqual({
      axis: 'container', term: 'Panel',
      groups: [{ id: 'A', engines: ['organ', 'piano', 'synth'] }, { id: 'B', engines: ['piano'] }],
    });
    expect(h.sizeBytes).toBe(64);
  });
});

describe('ns3Zones', () => {
  const point = (on: boolean, note: string, xfade = 'none') => ({ on, note, xfade });
  const kinds = (z: { layers: { kind: string; id: string }[] }) => z.layers.map((l) => `${l.kind}${l.id}`);
  const a = panel();
  a.piano.kbZones = '11oo';
  a.synth.kbZones = 'oo11';
  a.organ.on = false;

  it('puts each engine in the zones it plays, and marks the split points that are on', () => {
    const z = ns3Zones([a], { on: true, points: [point(false, 'C3'), point(true, 'C4', '+/- 6 semitones'), point(false, 'C6')] })!;
    expect(z.hasSplit).toBe(true);
    expect(z.zones.map(kinds)).toEqual([['pianoA'], ['pianoA'], ['synthA'], ['synthA']]);
    expect(z.boundaries).toEqual([null, 'C4', null]);
    expect(z.xfade).toEqual([null, '+/- 6 semitones', null]);
  });

  it('with the split off, every engine plays the whole keyboard whatever its zones say', () => {
    const z = ns3Zones([a], { on: false, points: [point(true, 'C3'), point(true, 'C4'), point(true, 'C6')] })!;
    expect(z.hasSplit).toBe(false);
    expect(z.zones.map(kinds)).toEqual(Array(4).fill(['pianoA', 'synthA']));
    expect(z.boundaries).toEqual([null, null, null]);
  });

  it('keeps the two panels apart', () => {
    const b = { ...panel(), id: 'B' as const };
    b.organ = { ...b.organ, on: true, kbZones: 'ooo1' };
    b.piano = { ...b.piano, on: false };
    b.synth = { ...b.synth, on: false };
    const z = ns3Zones([a, b], { on: true, points: [point(true, 'C3'), point(true, 'C4'), point(true, 'C6')] })!;
    expect(kinds(z.zones[3])).toEqual(['synthA', 'organB']);
  });

  it('is nothing for a file whose layout was not read', () => {
    expect(ns3Zones([], null)).toBeNull();
  });
});
