import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from './parse';
import type { NS4Layer, NS4Program } from './types';
import { unitsOn } from '../clavia/fx-view';
import { fxGroups, fxPanel, layerFxUnits, organFxUnits, rotaryUnit } from './fx-panel';

const layer = (over: Partial<NS4Layer> = {}): NS4Layer => ({ id: 'A', kind: 'synth', enabled: true, ...over });
const unit = (l: NS4Layer, label: string) => layerFxUnits(l).find((u) => u.label === label)!;

describe('layerFxUnits', () => {
  it('lists the six slots in signal order, dimmed, for a layer with no effect data', () => {
    expect(layerFxUnits(layer()).map((u) => [u.label, u.on])).toEqual([
      ['Mod 1', false], ['Mod 2', false], ['Amp/EQ', false], ['Comp', false], ['Delay', false], ['Reverb', false],
    ]);
  });

  it('keys each unit by layer so two layers never collide', () => {
    expect(layerFxUnits(layer({ id: 'B' }))[0].key).toBe('synthB-mod1');
  });

  it('Mod: type name, rate and amount as knobs, morphs carried, master clock as a switch', () => {
    const u = unit(layer({
      fxMod2: { on: true, mode: 'CHOR variation', rate: { value: '3.0', wheel: '6.0' }, amount: { value: '3.5' }, masterClock: false },
    }), 'Mod 2');
    expect(u.on).toBe(true);
    expect(u.type).toBe('Chorus, variation');
    expect(u.params).toEqual([
      { label: 'Rate', value: '3.0', fill: 30, morph: { wheel: '6.0', at: undefined, pedal: undefined } },
      { label: 'Amount', value: '3.5', fill: 35, morph: undefined },
    ]);
    expect(u.switches).toEqual([{ label: 'Mst Clk', on: false }]);
  });

  it('a synced rate is shown in words, with no knob position', () => {
    const u = unit(layer({ fxMod1: { on: true, mode: 'WAH', rate: { value: '1/8D' }, masterClock: true } }), 'Mod 1');
    expect(u.params[0]).toEqual({ label: 'Rate', value: '1/8 dotted', fill: undefined, morph: undefined });
    expect(u.switches).toEqual([{ label: 'Mst Clk', on: true }]);
  });

  it('Amp/EQ with the amp model off reads "EQ only", hides Drive, and carries the EQ', () => {
    const u = unit(layer({
      ampSimEq: { on: true, mode: 'off', bass: '-5.0 dB', mid: '+0.0 dB', treb: '+3.0 dB', freq: { value: '999 Hz' }, drive: { value: '0.0' } },
    }), 'Amp/EQ');
    expect(u.type).toBe('EQ only');
    expect(u.eq).toEqual({ bassDb: -5, midDb: 0, trebDb: 3, midHz: 999 });
    expect(u.params.map((p) => [p.label, p.value, p.fill])).toEqual([
      ['Bass', '-5.0 dB', undefined], ['Mid', '+0.0 dB', undefined], ['Mid Freq', '999 Hz', undefined], ['Treble', '+3.0 dB', undefined],
    ]);
  });

  it('Amp/EQ with an amp model shows the model and its drive first', () => {
    const u = unit(layer({ ampSimEq: { on: true, mode: 'JC', drive: { value: '2.0' } } }), 'Amp/EQ');
    expect(u.type).toBeTruthy();
    expect(u.type).not.toBe('EQ only');
    expect(u.params[0]).toEqual({ label: 'Drive', value: '2.0', fill: 20, morph: undefined });
    expect(u.eq).toBeUndefined();
  });

  it('Comp: amount and response', () => {
    const u = unit(layer({ comp: { on: true, amount: '3.8', response: 'normal' } }), 'Comp');
    expect(u.params).toEqual([
      { label: 'Amount', value: '3.8', fill: 38, morph: undefined },
      { label: 'Response', value: 'normal', fill: undefined, morph: undefined },
    ]);
  });

  it('Delay: tempo, mix, feedback, filter, and its three switches', () => {
    const u = unit(layer({
      delay: { on: true, tempo: { value: '484 ms (124 bpm)' }, mix: { value: '1.2' }, feedback: { value: '0.7' },
        pingPong: true, analog: false, masterClock: false, filterType: 'LP' },
    }), 'Delay');
    expect(u.params.map((p) => [p.label, p.value, p.fill])).toEqual([
      ['Tempo', '484 ms (124 bpm)', undefined], ['Mix', '1.2', 12], ['Feedback', '0.7', 7], ['Filter', 'LP', undefined],
    ]);
  });

  it('leaves out a setting that reads "none" or "off": the block shows what is set', () => {
    const u = unit(layer({ delay: { on: true, mix: { value: '5.0' }, filterType: 'none', effects: 'off' } }), 'Delay');
    expect(u.params.map((p) => p.label)).toEqual(['Mix']);
  });

  it('keeps the delay switches', () => {
    const u = unit(layer({ delay: { on: true, pingPong: true, analog: false, masterClock: false } }), 'Delay');
    expect(u.switches).toEqual([
      { label: 'Ping Pong', on: true }, { label: 'Analog', on: false }, { label: 'Mst Clk', on: false },
    ]);
  });

  it('Reverb: type, amount and tone', () => {
    const u = unit(layer({ reverb: { on: true, type: 'HALL', amount: { value: '4.7', pedal: '9.0' }, tone: 'bright' } }), 'Reverb');
    expect(u.type).toBeTruthy();
    expect(u.params).toEqual([
      { label: 'Amount', value: '4.7', fill: 47, morph: { wheel: undefined, at: undefined, pedal: '9.0' } },
      { label: 'Tone', value: 'bright', fill: undefined, morph: undefined },
    ]);
  });

  it('never prints NaN for any value shape', () => {
    const l = layer({
      fxMod1: { on: true, rate: { value: '' }, amount: { value: 'x' } },
      delay: { on: true, tempo: { value: '1/4T' }, mix: { value: '10.0' } },
    });
    expect(JSON.stringify(layerFxUnits(l))).not.toContain('NaN');
    expect(unit(l, 'Delay').params.find((p) => p.label === 'Mix')!.fill).toBe(100);
  });
});

describe('organFxUnits and rotaryUnit', () => {
  it('the organ chain is the same six slots as a layer', () => {
    expect(organFxUnits({}).map((u) => u.label)).toEqual(['Mod 1', 'Mod 2', 'Amp/EQ', 'Comp', 'Delay', 'Reverb']);
  });

  it('the rotary shows its speed as the type, with drive and stop position', () => {
    const rot = rotaryUnit({ on: true, fast: false, drive: '0.0', stopPosition: 'front' });
    expect(rot.label).toBe('Rotary');
    expect(rot.on).toBe(true);
    expect(rot.type).toBe('Slow');
    expect(rot.params.map((p) => [p.label, p.value])).toEqual([['Drive', '0.0'], ['Stop Pos', 'front']]);
  });

  it('reads the speed: Fast, and Slow or Stop by the stop mode', () => {
    const rot = (r: { fast?: boolean; stop?: boolean }) => rotaryUnit({ on: true, ...r });
    expect(rot({ fast: true }).type).toBe('Fast');
    expect(rot({ fast: false }).type).toBe('Slow');
    // Stop mode swaps the slow speed for a parked rotor; a fast rotor still spins.
    expect(rot({ fast: false, stop: true }).type).toBe('Stop');
    expect(rot({ fast: true, stop: true }).type).toBe('Fast');
    expect(rot({ fast: true, stop: true }).switches).toEqual([{ label: 'Stop Mode', on: true }]);
    expect(rot({ fast: true }).switches).toEqual([{ label: 'Stop Mode', on: false }]);
  });
});

const program = (layers: NS4Layer[], over: Partial<NS4Program> = {}): NS4Program =>
  ({ layers, ...over } as unknown as NS4Program);

describe('fxPanel', () => {
  const rev = { on: true, type: 'HALL', amount: { value: '3.3' } };

  it('merges layers of one engine with equal chains and keeps the others apart', () => {
    const p = program([
      layer({ kind: 'piano', id: 'A', reverb: rev }),
      layer({ kind: 'piano', id: 'B', reverb: rev }),
      layer({ kind: 'synth', id: 'A', reverb: rev }),
      layer({ kind: 'synth', id: 'B', reverb: { ...rev, amount: { value: '3.4' } } }),
    ]);
    expect(fxPanel(p).groups.map((g) => [g.label, g.kind])).toEqual([
      ['Piano A·B', 'piano'], ['Synth A', 'synth'], ['Synth B', 'synth'],
    ]);
  });

  it('leaves out layers that are not enabled', () => {
    const p = program([layer({ kind: 'piano', id: 'A' }), layer({ kind: 'synth', id: 'A', enabled: false })]);
    expect(fxPanel(p).groups.map((g) => g.label)).toEqual(['Piano A']);
  });

  it('adds the Organ row and the Rotary row when an organ layer plays, and neither when it does not', () => {
    const organFx = { rotary: { on: true, fast: true } };
    const withOrgan = fxPanel(program([layer({ kind: 'organ', id: 'A' }), layer({ kind: 'organ', id: 'B' })], { organFx }));
    // Every row but the rotary's has the same six columns, so the panel lines up.
    expect(withOrgan.groups.map((g) => [g.label, g.kind, g.units.length])).toEqual([['Organ', 'organ', 6], ['Rotary', 'organ', 1]]);
    const without = fxPanel(program([layer({ kind: 'synth', id: 'A' })], { organFx }));
    expect(without.groups.map((g) => g.label)).toEqual(['Synth A']);
  });

  it('shows the rotary on its own when no organ plays but a layer is sent into it', () => {
    const organFx = { rotary: { on: true, fast: true }, reverb: { on: true, type: 'HALL' } };
    const toRotary = layer({ kind: 'synth', id: 'A', ampSimEq: { on: true, mode: 'TO ROTARY' } });
    const view = fxPanel(program([toRotary], { organFx }));
    expect(view.groups.map((g) => [g.label, g.units.map((u) => u.label)])).toEqual([
      ['Synth A', ['Mod 1', 'Mod 2', 'Amp/EQ', 'Comp', 'Delay', 'Reverb']],
      ['Rotary', ['Rotary']],
    ]);
    // Not when that Amp/EQ is switched off.
    const ampOff = layer({ kind: 'synth', id: 'A', ampSimEq: { on: false, mode: 'TO ROTARY' } });
    expect(fxPanel(program([ampOff], { organFx })).groups.map((g) => g.label)).toEqual(['Synth A']);
  });

  it('fxGroups keeps one row per layer, so a count of effects does not depend on merging', () => {
    const p = program([layer({ kind: 'piano', id: 'A', reverb: rev }), layer({ kind: 'piano', id: 'B', reverb: rev })]);
    expect(fxPanel(p).groups).toHaveLength(1);
    expect(unitsOn(fxGroups(p))).toBe(2);
  });

  it('is empty for a program with no playing layers', () => {
    expect(fxPanel(program([])).groups).toEqual([]);
  });

  it('builds the regression fixture: an organ row and rows for its piano and synth layers', () => {
    const bytes = new Uint8Array(readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))));
    const view = fxPanel(parseNs4Program(bytes));
    expect(view.groups.length).toBeGreaterThan(0);
    expect(view.groups.every((g) => g.units.length === (g.label === 'Rotary' ? 1 : 6))).toBe(true);
    expect(view.groups.filter((g) => g.kind === 'organ').map((g) => g.label)).toEqual(['Organ', 'Rotary']);
    expect(view.groups.some((g) => g.kind === 'piano')).toBe(true);
    expect(view.groups.some((g) => g.kind === 'synth')).toBe(true);
    expect(JSON.stringify(view)).not.toContain('NaN');
  });

  // fixture: piano A reverb(1) + piano B mod1/mod2/delay(3) + synth B mod1/mod2/amp/comp(4)
  // + synth C delay/reverb(2) + organ mod1/amp/delay(3) = 13 switched on
  describe('the regression fixture', () => {
    const bytes = new Uint8Array(readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))));
    const view = fxPanel(parseNs4Program(bytes));
    const on = (label: string) => view.groups.find((g) => g.label === label)!.units.filter((u) => u.on).map((u) => u.label);

    it('gives the organ and its rotary their rows first, then a row per playing layer, none merged', () => {
      expect(view.groups.map((g) => g.label)).toEqual(['Organ', 'Rotary', 'Piano A', 'Piano B', 'Synth B', 'Synth C']);
    });

    it('lights the 13 effects that are on, each under its own engine', () => {
      expect(unitsOn(view.groups)).toBe(13);
      expect(on('Piano A')).toEqual(['Reverb']);
      expect(on('Piano B')).toEqual(['Mod 1', 'Mod 2', 'Delay']);
      expect(on('Synth B')).toEqual(['Mod 1', 'Mod 2', 'Amp/EQ', 'Comp']);
      expect(on('Synth C')).toEqual(['Delay', 'Reverb']);
      expect(on('Organ')).toEqual(['Mod 1', 'Amp/EQ', 'Delay']);
    });

    it('unit keys are unique across the panel', () => {
      const keys = view.groups.flatMap((g) => g.units.map((u) => u.key));
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});
