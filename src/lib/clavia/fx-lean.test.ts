import { describe, it, expect } from 'vitest';
import { layerChainGroups, layerChainUnits, rackUnits, type ChainTables, type RackTables } from './fx-lean';
import { fxGroupsSection, fxKnobs } from './fw-present';

const T: RackTables = {
  fx1: ['Tremolo 1', 'Tremolo 2'], fx2: ['Phaser 1', 'Phaser 2'], speaker: ['Small', 'JC'], reverb: ['Room', 'Stage', 'Hall'],
  sources: ['Organ', 'Piano', 'Synth'],
};
const rack = (v: Record<string, number>, t: RackTables = T) => rackUnits((k) => v[k], t);
const E = (v: Record<string, number>) => Object.fromEntries(Object.entries(v).map(([k, n]) => [`effects.${k}`, n]));

describe('fw-present helpers', () => {
  it('fxKnobs drops the settings a file does not have', () => {
    expect(fxKnobs({ label: 'Rate', value: '1' }, undefined, { label: 'Mix', value: '2' }).map((p) => p.label)).toEqual(['Rate', 'Mix']);
  });

  it('fxGroupsSection carries several rows as one effects card', () => {
    const s = fxGroupsSection([{ key: 'a', label: 'Piano', units: [] }, { key: 'b', label: 'Synth', units: [] }]);
    expect(s).toEqual({ id: 'FX', label: 'EFFECTS', engines: [], fx: { groups: [{ key: 'a', label: 'Piano', units: [] }, { key: 'b', label: 'Synth', units: [] }] } });
  });
});

describe('rackUnits', () => {
  it('lists the six blocks in panel order, off when the file says nothing', () => {
    expect(rack({}).map((u) => [u.key, u.label, u.on])).toEqual([
      ['fx1', 'Effect 1', false], ['fx2', 'Effect 2', false], ['dly', 'Delay', false],
      ['spk', 'Speaker/Comp', false], ['eql', 'EQ', false], ['rvb', 'Reverb', false],
    ]);
  });

  it('Effect 1 and 2: type, rate at its position, and their switch', () => {
    const [fx1, fx2] = rack(E({ fx1Enable: 1, fx1Type: 1, fx1Rate: 127, fx1PedCtrl: 1, fx2Enable: 1, fx2Type: 0, fx2Rate: 0, fx2Deep: 0 }));
    expect(fx1).toMatchObject({ on: true, type: 'Tremolo 2', params: [{ label: 'Rate', value: '127', fill: 100 }], switches: [{ label: 'Ped Ctrl', on: true }] });
    expect(fx2).toMatchObject({ on: true, type: 'Phaser 1', params: [{ label: 'Rate', value: '0', fill: 0 }], switches: [{ label: 'Deep', on: false }] });
  });

  it('Delay: rate over 0–16383, mix over 0–127, feedback over 0–3, ping pong', () => {
    const dly = rack(E({ dlyEnable: 1, dlyRate: 16383, dlyMix: 64, dlyFeedback: 3, dlyPingPong: 1 }))[2];
    expect(dly.params).toEqual([
      { label: 'Rate', value: '16383', fill: 100 }, { label: 'Mix', value: '64', fill: 50 }, { label: 'Feedback', value: '3', fill: 100 },
    ]);
    expect(dly.switches).toEqual([{ label: 'Ping Pong', on: true }]);
  });

  it('EQ: signed bands keep their sign and sit at centre for 0', () => {
    const eq = rack(E({ eqlEnable: 1, eqlBass: -60, eqlMid: 0, eqlTreble: 60, eqlMidFreq: 64 }))[4];
    expect(eq.params).toEqual([
      { label: 'Bass', value: '-60', fill: 0 }, { label: 'Mid', value: '0', fill: 50 },
      { label: 'Mid Freq', value: '64', fill: 50 }, { label: 'Treble', value: '60', fill: 100 },
    ]);
    expect(eq.eq).toBeUndefined();
  });

  it('EQ reads the mid band under either of its two field names', () => {
    expect(rack(E({ eqlMidGain: 30 }))[4].params.find((p) => p.label === 'Mid')).toEqual({ label: 'Mid', value: '30', fill: 75 });
  });

  it('Speaker/Comp and Reverb: type and amount; a type the table does not cover shows as its number', () => {
    const units = rack(E({ spkEnable: 1, spkType: 1, spkAmt: 127, rvbEnable: 1, rvbType: 7, rvbAmt: 32 }));
    expect(units[3]).toMatchObject({ type: 'JC', params: [{ label: 'Amount', value: '127', fill: 100 }] });
    expect(units[5]).toMatchObject({ type: '7', params: [{ label: 'Amount', value: '32', fill: 25 }] });
  });

  it('Reverb shows Bright when the file has that switch, and nothing else', () => {
    expect(rack(E({ rvbBright: 1 }))[5].switches).toEqual([{ label: 'Bright', on: true }]);
    expect(rack({})[5].switches).toBeUndefined();
  });

  it('Reverb shows its colour and Chorale when the file has those instead', () => {
    const rvb = rack(E({ rvbAmt: 0, rvbColor: 1, rvbChorale: 1 }), { ...T, reverbColor: ['Normal', 'Dark', 'Bright'] })[5];
    expect(rvb.params).toEqual([{ label: 'Amount', value: '0', fill: 0 }, { label: 'Color', value: 'Dark' }]);
    expect(rvb.switches).toEqual([{ label: 'Chorale', on: true }]);
  });

  it('a named source is a row of LEDs on the five blocks that have a selector', () => {
    const units = rack(E({ fx1Src: 0, fx2Src: 1, dlySrc: 2, spkSrc: 1, eqlSrc: 1 }));
    expect(units[0].source).toEqual([{ label: 'Organ', on: true }, { label: 'Piano', on: false }, { label: 'Synth', on: false }]);
    expect(units.slice(0, 5).map((u) => u.source?.find((k) => k.on)?.label)).toEqual(['Organ', 'Piano', 'Synth', 'Piano', 'Piano']);
    expect(units[5].source).toBeUndefined();
  });

  it('a source table with a gap draws only the named engines', () => {
    const t = { ...T, sources: [undefined, 'Piano', 'Synth'] };
    expect(rack(E({ fx1Src: 2 }), t)[0].source).toEqual([{ label: 'Piano', on: false }, { label: 'Synth', on: true }]);
    // A stored 0 is below the field's range: no LED lit.
    expect(rack(E({ fx1Src: 0 }), t)[0].source).toEqual([{ label: 'Piano', on: false }, { label: 'Synth', on: false }]);
  });

  it('an unnamed source is shown as its stored number, last', () => {
    const fx1 = rack(E({ fx1Src: 4, fx1Rate: 10 }), { ...T, sources: undefined })[0];
    expect(fx1.source).toBeUndefined();
    expect(fx1.params.map((p) => [p.label, p.value, p.fill])).toEqual([['Rate', '10', 8], ['Source', '4', undefined]]);
  });

  it('a file with no source field has neither LEDs nor a Source readout', () => {
    expect(rack({}, { ...T, sources: undefined })[0].params).toEqual([]);
    expect(rack({})[0].source).toBeUndefined();
  });
});

const C: ChainTables = {
  fx1: ['Tremolo', 'Pan 1 Soft'], fx2: ['Phaser 1', 'Phaser 2'], amp: ['Clean', 'Twin'], delayFilter: ['Bypass', 'LP', 'HP', 'BP'],
  reverb: ['Spring', 'Booth', 'Room'], reverbColor: ['Normal', 'Dark', 'Bright'],
};
const chain = (v: Record<string, number>) => layerChainUnits((k) => v[k], 'pianoFxA', C);
const P = (v: Record<string, number>) => Object.fromEntries(Object.entries(v).map(([k, n]) => [`pianoFxA.${k}`, n]));

describe('layerChainUnits', () => {
  it('lists the seven blocks of a layer in panel order', () => {
    expect(chain({}).map((u) => [u.key, u.label, u.on])).toEqual([
      ['pianoFxA-fx1', 'Effect 1', false], ['pianoFxA-fx2', 'Effect 2', false], ['pianoFxA-dly', 'Delay', false],
      ['pianoFxA-amp', 'Amp', false], ['pianoFxA-cmp', 'Comp', false], ['pianoFxA-eq', 'EQ', false], ['pianoFxA-rvb', 'Reverb', false],
    ]);
  });

  it('Effect 1 and 2: type, rate and amount, and their switch', () => {
    const [fx1, fx2] = chain(P({ fx1Enable: 1, fx1Type: 1, fx1Rate: 64, fx1Amt: 127, fx1PedalEnable: 1, fx2Enable: 1, fx2Type: 9, fx2Rate: 0, fx2Amt: 0, fx2Mono: 1 }));
    expect(fx1).toMatchObject({
      on: true, type: 'Pan 1 Soft',
      params: [{ label: 'Rate', value: '64', fill: 50 }, { label: 'Amount', value: '127', fill: 100 }],
      switches: [{ label: 'Pedal', on: true }],
    });
    expect(fx2).toMatchObject({ type: '9', switches: [{ label: 'Mono', on: true }] });
  });

  it('Delay: rate, mix, feedback over 0–127, its filter by name, ping pong as stored, and Flam', () => {
    const dly = chain(P({ dlyEnable: 1, dlyRate: 0, dlyMix: 127, dlyFeedback: 64, dlyFltType: 2, dlyPingPong: 2, dlyFlam: 1 }))[2];
    expect(dly.params).toEqual([
      { label: 'Rate', value: '0', fill: 0 }, { label: 'Mix', value: '127', fill: 100 }, { label: 'Feedback', value: '64', fill: 50 },
      { label: 'Filter', value: 'HP' }, { label: 'Ping Pong', value: '2' },
    ]);
    expect(dly.switches).toEqual([{ label: 'Flam', on: true }]);
  });

  it('Amp, Comp and EQ', () => {
    const u = chain(P({ ampEnable: 1, ampType: 1, ampDrive: 127, ampAltTone: 0, cmpEnable: 1, cmpAmt: 64, eqEnable: 1, eqBass: -60, eqMid: 0, eqMidFreq: 127, eqTreble: 60 }));
    expect(u[3]).toMatchObject({ on: true, type: 'Twin', params: [{ label: 'Drive', value: '127', fill: 100 }], switches: [{ label: 'Alt Tone', on: false }] });
    expect(u[4]).toMatchObject({ on: true, params: [{ label: 'Amount', value: '64', fill: 50 }] });
    expect(u[5].params).toEqual([
      { label: 'Bass', value: '-60', fill: 0 }, { label: 'Mid', value: '0', fill: 50 },
      { label: 'Mid Freq', value: '127', fill: 100 }, { label: 'Treble', value: '60', fill: 100 },
    ]);
  });

  it('Reverb is the program\'s one reverb with this layer\'s own amount', () => {
    const rvb = chain({ ...P({ rvbAmt: 32 }), 'common.effectsRvbEnable': 1, 'common.effectsRvbType': 2, 'common.effectsRvbColor': 1, 'common.effectsRvbChorale': 1, 'common.effectsRvbPreDelay': 0 })[6];
    expect(rvb).toMatchObject({
      on: true, type: 'Room',
      params: [{ label: 'Amount', value: '32', fill: 25 }, { label: 'Color', value: 'Dark' }],
      switches: [{ label: 'Chorale', on: true }, { label: 'Pre-Delay', on: false }],
    });
  });
});

describe('layerChainGroups', () => {
  const layers = (a: boolean, b: boolean) => [
    { blk: 'pianoFxA', label: 'Piano A', kind: 'piano' as const, on: a },
    { blk: 'pianoFxB', label: 'Piano B', kind: 'piano' as const, on: b },
  ];

  it('gives each playing layer a row and merges the ones that look alike', () => {
    expect(layerChainGroups(() => undefined, layers(true, true), C).map((g) => [g.label, g.kind])).toEqual([['Piano A·B', 'piano']]);
    const differ = (k: string) => (k === 'pianoFxB.fx1Enable' ? 1 : undefined);
    expect(layerChainGroups(differ, layers(true, true), C).map((g) => g.label)).toEqual(['Piano A', 'Piano B']);
    expect(layerChainGroups(() => undefined, layers(false, true), C).map((g) => g.label)).toEqual(['Piano B']);
  });

  it('keeps the reverb on screen when no layer plays', () => {
    const get = (k: string) => ({ 'common.effectsRvbEnable': 1, 'common.effectsRvbType': 1 } as Record<string, number>)[k];
    const groups = layerChainGroups(get, layers(false, false), C);
    expect(groups.map((g) => [g.label, g.units.map((u) => u.label)])).toEqual([['Reverb', ['Reverb']]]);
    expect(groups[0].units[0]).toMatchObject({ on: true, type: 'Booth' });
    expect(groups[0].units[0].params.map((p) => p.label)).not.toContain('Amount');
  });
});
