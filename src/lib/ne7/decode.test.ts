import { describe, it, expect } from 'vitest';
import { decodeNe7 } from './decode';
import { ne7Decoded, NE7_PROVISIONAL_NOTE } from './present';
import { NE7_LAYOUT, type Ne7FieldKey } from './layout.generated';
import { fieldBit, synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';

const file = (values: Partial<Record<Ne7FieldKey, number>> = {}) => synthFwFile('ne7p', synthFwBody(NE7_LAYOUT, values));

describe('decodeNe7 (Electro 7, firmware layout, provisional block order)', () => {
  it('reads the predicted 397-byte file (353-byte body, 13 blocks)', () => {
    const bytes = file();
    expect(bytes.length).toBe(397);
    const p = decodeNe7(bytes);
    expect(p).toMatchObject({ format: 'ne7p', layoutMatched: true, formatVersion: 100 });
    expect(p.warnings).toEqual([]);
  });

  it('round-trips organ, drawbar, piano and synth-preset fields', () => {
    const v = {
      'organ.organModel': 5, 'organLayerB.octaveShift': -6, 'organDrawbars3.drawbarValue9': 8,
      'piano.nameHash': 0xfedcba98, 'piano.entry': 19, 'synth.synPresetId': 3199,
      'synthPreset.analogSemitone': -24, 'synthPreset.fmAlgorithm': 9, 'synthFx.ampTreble': -60,
      'common.rotaryHornAngle': -32768,
    } as const;
    expect(decodeNe7(file(v)).values).toMatchObject(v);
  });

  it('places fields at the firmware bits (organ model 305, drawbar set 1 at byte 120, piano hash 1396)', () => {
    const body = synthFwBody(NE7_LAYOUT);
    writeBits(body, 305, 3, 2);          // Org_kOrganModel
    writeBits(body, 960, 4, 5);          // Drawbars1 value 1 (body byte 120, high nibble)
    writeBits(body, 1396, 32, 0x0badf00d); // Pno_kNameHash
    const v = decodeNe7(synthFwFile('ne7p', body)).values;
    expect(v['organ.organModel']).toBe(2);
    expect(v['organDrawbars1.drawbarValue1']).toBe(5);
    expect(v['piano.nameHash']).toBe(0x0badf00d);
    expect(v['organ.level']).toBe(127);
    expect(v['organ.kbdZone']).toBe(1);
  });

  it('reads the two assign bits after a kind-3 knob (pedal, then wheel)', () => {
    const body = synthFwBody(NE7_LAYOUT);
    writeBits(body, 315, 2, 0b10);       // after Org_kLevel (bits 308–314): pedal on, wheel off
    writeBits(body, 2346, 2, 0b01);      // after Syn_kFMAmount: pedal off, wheel on
    const v = decodeNe7(synthFwFile('ne7p', body)).values;
    expect(v['organ.level']).toBe(127);
    expect([v['organ.level.pedalAssign'], v['organ.level.wheelAssign']]).toEqual([1, 0]);
    expect([v['synthPreset.fmAmount.pedalAssign'], v['synthPreset.fmAmount.wheelAssign']]).toEqual([0, 1]);
  });

  it('stores negative values as two\'s complement, not value − min', () => {
    expect(NE7_LAYOUT.fields.filter((f) => f.min < 0 && f.enc !== 'twos' && f.enc !== 'raw')).toEqual([]); // raw = name hashes
    const body = synthFwBody(NE7_LAYOUT);
    writeBits(body, fieldBit(NE7_LAYOUT, 'common.transposeValue'), 4, 0b1010);    // −6
    writeBits(body, fieldBit(NE7_LAYOUT, 'synthPreset.analogSemitone'), 7, 0);    // 0, not −24
    const v = decodeNe7(synthFwFile('ne7p', body)).values;
    expect(v['common.transposeValue']).toBe(-6);
    expect(v['synthPreset.analogSemitone']).toBe(0);
  });

  it('a partial save with a folder missing → header-only with a warning', () => {
    // Drop the Synth folder (last three blocks): the chain still ends at EOF but has 10 blocks.
    const body = synthFwBody(NE7_LAYOUT).slice(0, NE7_LAYOUT.blocks[10].offset);
    const p = decodeNe7(synthFwFile('ne7p', body));
    expect(p.layoutMatched).toBe(false);
    expect(p.warnings[0]).toMatch(/Expected 13 blocks.*found 10/);
  });

  it('odd or short files → header-only with a warning, never a throw', () => {
    for (const bytes of [file().slice(0, 50), new Uint8Array(0)]) {
      const p = decodeNe7(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('ne7Decoded', () => {
  it('marks every decoded program as provisional and shows organ, drawbars, piano and synth', () => {
    const d = ne7Decoded(file({
      'organ.isEnabled': 1, 'organ.organModel': 0, 'organ.level': 100,
      'organDrawbars1.drawbarValue1': 8, 'organDrawbars1.drawbarValue2': 6, 'organDrawbars1.percussionEnable': 1,
      'piano.isEnabled': 1, 'piano.bank': 3, 'synth.isEnabled': 0,
      'synthPreset.analogMainWaveform': 5, 'synthPreset.fmAlgorithm': 2,
      'common.rotaryEnable': 1,
    }));
    expect(d.note).toBe(NE7_PROVISIONAL_NOTE);
    expect(d.note).toMatch(/block order not yet confirmed on a real file/);
    const byId = Object.fromEntries(d.sections.map((s) => [s.id, s]));
    expect(byId.O.engines[0].parts).toEqual(['B3', 'level 100']);
    expect(byId.D1.drawbars?.map((b) => b.level).slice(0, 3)).toEqual([8, 6, 8]);
    expect(byId.D1.drawbars?.[0].footage).toBe('16′');
    expect(byId.D1.chips).toEqual(['Percussion']);
    expect(byId.P.engines[0].parts[0]).toBe('Clavinet');
    expect(byId.S.engines[0].parts).toContain('(off)');
    // Default mode 1: Analog (likely), showing only that mode's sound, not the FM algorithm.
    expect(byId.S.engines.map((e) => e.label)).toEqual(['Synth', 'Preset']);
    expect(byId.S.engines[1].parts).toEqual(['Analog (likely)', 'SuperSaw']);
    // A chain for each engine that is on (the synth is off here), then the rotary.
    const six = ['Effect 1', 'Effect 2', 'Delay', 'Amp/EQ', 'Comp', 'Reverb'];
    expect(byId.FX.fx!.groups.map((g) => [g.label, g.kind, g.units.map((u) => u.label)])).toEqual([
      ['Organ', 'organ', six], ['Piano', 'piano', six], ['Rotary', 'organ', ['Rotary']],
    ]);
    expect(byId.FX.fx!.groups[2].units[0].on).toBe(true);
    expect(byId.G).toBeUndefined();
  });

    it('an engine\'s chain carries its settings; types show as stored', () => {
      const units = ne7Decoded(file({
      'piano.isEnabled': 1,
        'pianoFx.fx1Enable': 1, 'pianoFx.fx1Type': 3, 'pianoFx.fx1Rate': 127, 'pianoFx.fx1Amt': 64,
        'pianoFx.fx2Mono': 1, 'pianoFx.dlyEnable': 1, 'pianoFx.dlyRate': 16383, 'pianoFx.dlyMix': 0, 'pianoFx.dlyFeedback': 127,
        'pianoFx.ampEnable': 1, 'pianoFx.ampType': 2, 'pianoFx.ampDrive': 64, 'pianoFx.ampBass': -60, 'pianoFx.ampMid': 0, 'pianoFx.ampTreble': 60, 'pianoFx.ampMidFreq': 0,
        'pianoFx.cmpEnable': 1, 'pianoFx.cmpAmt': 127, 'pianoFx.rvbAmt': 32, 'common.rvbEnable': 1, 'common.rvbType': 4, 'common.rvbChorale': 1,
      })).sections.find((s) => s.id === 'FX')!.fx!.groups.find((g) => g.label === 'Piano')!.units;
      const [fx1, fx2, dly, amp, cmp, rvb] = units;
      expect(fx1).toMatchObject({ on: true, type: '3', params: [{ label: 'Rate', value: '127', fill: 100 }, { label: 'Amount', value: '64', fill: 50 }] });
      expect(fx2.switches).toEqual([{ label: 'Mono', on: true }]);
      expect(dly.params.slice(0, 3)).toEqual([
        { label: 'Rate', value: '16383', fill: 100 }, { label: 'Mix', value: '0', fill: 0 }, { label: 'Feedback', value: '127', fill: 100 },
      ]);
      expect(amp).toMatchObject({ on: true, type: '2' });
      expect(amp.params).toEqual([
        { label: 'Drive', value: '64', fill: 50 }, { label: 'Bass', value: '-60', fill: 0 }, { label: 'Mid', value: '0', fill: 50 },
        { label: 'Mid Freq', value: '0', fill: 0 }, { label: 'Treble', value: '60', fill: 100 },
      ]);
      expect(cmp.params).toEqual([{ label: 'Amount', value: '127', fill: 100 }]);
      expect(rvb).toMatchObject({ on: true, type: '4', switches: [{ label: 'Chorale', on: true }] });
      expect(rvb.params[0]).toEqual({ label: 'Amount', value: '32', fill: 25 });
    });

  it('shows the synth preset for its mode: Sample (confirmed), FM (likely)', () => {
    const synth = (values: Partial<Record<Ne7FieldKey, number>>) =>
      ne7Decoded(file(values)).sections.find((s) => s.id === 'S')?.engines[1].parts;
    expect(synth({ 'synthPreset.mode': 0, 'synthPreset.analogMainWaveform': 2 })).toEqual(['Sample']);
    expect(ne7Decoded(file({ 'synthPreset.mode': 0, 'synthPreset.smpNameHash': 0x1234 })).header)
      .toContainEqual(['Synth sample id', '0x00001234']);
    expect(synth({ 'synthPreset.mode': 2, 'synthPreset.fmAlgorithm': 9 })).toEqual(['FM (likely)', 'Algorithm 10']);
    expect(synth({ 'synthPreset.mode': 1, 'synthPreset.analogMainWaveform': 1, 'synthPreset.analogAuxWaveform': 6 }))
      .toEqual(['Analog (likely)', 'Saw', 'Osc B Noise']);
  });

  it('header-only presentation still carries the provisional note', () => {
    const d = ne7Decoded(file().slice(0, 100));
    expect(d.sections).toEqual([]);
    expect(d.note).toMatch(/not yet confirmed/);
  });
});

describe('ne7Decoded: keyboard split', () => {
  const header = (d: { header: [string, string][] }, key: string) => d.header.find(([k]) => k === key)?.[1];
  const kinds = (z: { layers: { kind: string }[] }) => z.layers.map((l) => l.kind);

  it('shows where the split is and which sounds play either side', () => {
    const d = ne7Decoded(file({
      'common.splitEnable': 1, 'common.splitPosition': 3, 'common.splitWidth': 1,
      'organ.isEnabled': 1, 'organ.kbdZone': 0, // lower
      'piano.isEnabled': 1, 'piano.kbdZone': 2, // upper
      'synth.isEnabled': 1, 'synth.kbdZone': 1, // both
    }));
    expect(header(d, 'Split')).toBe('at C4 · crossfade ±6');
    expect(d.keyboard!.boundaries).toEqual([null, 'C4', null]);
    expect(d.keyboard!.zones.map(kinds)).toEqual([['organ', 'synth'], ['organ', 'synth'], ['piano', 'synth'], ['piano', 'synth']]);
  });

  it('has nine positions, F2 to F6', () => {
    const at = (pos: number) => header(ne7Decoded(file({ 'common.splitEnable': 1, 'common.splitPosition': pos })), 'Split');
    expect([at(0), at(8)]).toEqual(['at F2', 'at F6']);
  });

  it('draws no split, and leaves sounds that are off out, when the split is off', () => {
    const d = ne7Decoded(file({ 'common.splitEnable': 0, 'piano.isEnabled': 1, 'piano.kbdZone': 0 }));
    expect(header(d, 'Split')).toBe('off');
    expect(d.keyboard).toBeUndefined();
    const split = ne7Decoded(file({ 'common.splitEnable': 1, 'piano.isEnabled': 1, 'piano.kbdZone': 0, 'organ.isEnabled': 0, 'organ.kbdZone': 0 }));
    expect(split.keyboard!.zones.map(kinds)).toEqual([['piano'], ['piano'], [], []]);
  });
});
