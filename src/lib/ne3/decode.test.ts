/**
 * Electro 3 / 3 HP decoder tests: synthetic records built from the firmware
 * layouts (OS 3.14 / HP OS 3.16 descriptors, via the generated layouts) — always
 * run — plus a check against real `.nepg` files when the gitignored corpus
 * (`fixtures/electro-3`) is present: under the right alignment no value exceeds
 * its descriptor range.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe3, NE3_HP_ONLY_KEYS } from './decode';
import { ne3Decoded } from './present';
import { NE3_LAYOUT } from './layout.generated';
import { NE3HP_LAYOUT, type Ne3HpFieldKey } from './layout-hp.generated';
import { NE4_LAYOUT } from '../ne4/layout.generated';
import { synthLegacyLayoutFile } from '../clavia/block-chain.synth';

const nepg = (values: Partial<Record<Ne3HpFieldKey, number>> = {}, version = 101) =>
  synthLegacyLayoutFile('nepg', NE3HP_LAYOUT, values, { version });
const fileByte = (key: string) => 0x1a + (NE3HP_LAYOUT.fields.find((f) => f.key === key)!.bit >> 3);

describe('Electro 3 firmware layouts', () => {
  it('are a 108-byte record at file 0x1A making a 136-byte file, version 101', () => {
    for (const l of [NE3_LAYOUT, NE3HP_LAYOUT]) {
      expect(l).toMatchObject({ dataBytes: 108, recordVersion: 101 });
      expect(l.versionBytes ?? 2).toBe(2);
    }
    expect(nepg()).toHaveLength(136);
    expect(fileByte('organPresetI.b3Drawbar1')).toBe(0x2d);
    expect(fileByte('organPresetII.b3Drawbar1')).toBe(0x3f);
    expect(fileByte('piano.type')).toBe(0x51);
    expect(fileByte('effectsOrgan.param0')).toBe(0x70);
  });

  it('the HP layout is the Electro 3 layout plus five parameters in its reserved space', () => {
    const hp = new Map(NE3HP_LAYOUT.fields.map((f) => [f.key as string, f]));
    for (const f of NE3_LAYOUT.fields) {
      expect(hp.get(f.key), f.key).toMatchObject({ bit: f.bit, width: f.width, min: f.min, max: f.max, def: f.def });
    }
    expect([...NE3_HP_ONLY_KEYS].sort()).toEqual(
      ['effectsShared.param15', 'effectsShared.param16', 'effectsShared.param17', 'piano.param18', 'piano.param19']);
  });

  it('starts the piano and effects blocks where the Electro 4 does, with the same effect parameters', () => {
    const bit = (layout: typeof NE4_LAYOUT | typeof NE3HP_LAYOUT, key: string) => layout.fields.find((f) => f.key === key)!.bit;
    expect(bit(NE3HP_LAYOUT, 'piano.type')).toBe(bit(NE4_LAYOUT, 'pianoSample.0'));
    expect(bit(NE3HP_LAYOUT, 'effectsShared.param0')).toBe(bit(NE4_LAYOUT, 'effects.0'));
    expect(bit(NE3HP_LAYOUT, 'effectsOrgan.param0')).toBe(bit(NE4_LAYOUT, 'blockX1.0'));
    expect(bit(NE3HP_LAYOUT, 'effectsPiano.param0')).toBe(bit(NE4_LAYOUT, 'blockX2.0'));
    const e4 = new Set(NE4_LAYOUT.fields.map((f) => `${f.bit}/${f.width}/${f.max}/${f.cc}`));
    for (const f of NE3HP_LAYOUT.fields.filter((x) => x.bit >= 552)) {
      expect(e4.has(`${f.bit}/${f.width}/${f.max}/${f.cc}`), f.key).toBe(true);
    }
  });

  it('stores every value raw with minimum 0, without overlaps', () => {
    const used = new Set<number>();
    for (const f of NE3HP_LAYOUT.fields) {
      expect([f.enc, f.min], f.key).toEqual(['u', 0]);
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
  });
});

describe('decodeNe3 (synthetic, firmware layout)', () => {
  it('decodes the default record: organ focus, B3, drawbars 888000000, Vox 880000088', () => {
    const p = decodeNe3(nepg());
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ parsed: true, recordVersion: 101, version: '1.01', focus: 'organ', organModel: 0, hp: null, complete: true });
    expect(p.presetI.b3Drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(p.presetII.voxDrawbars).toEqual([8, 8, 0, 0, 0, 0, 0, 8, 8]);
    expect(p.presetI.farfTabs).toEqual([1, 1, 1, 0, 0, 0, 0, 0, 0]);
    expect(p._data).toHaveLength(108);
    expect(p.values['effectsShared.param12']).toBe(127);
  });

  it('reads the piano type, the model of that type and the effect switches', () => {
    const p = decodeNe3(nepg({
      'common.instrumentSelect': 1, 'piano.type': 3, 'piano.modelWurl': 4, 'piano.modelGrand': 9,
      'effectsPiano.param1': 1, 'effectsPiano.param4': 1, 'organCommon.organModel': 2,
      'organPresetII.voxDrawbar5': 6,
    }));
    expect(p).toMatchObject({ focus: 'piano', pianoType: 3, pianoModel: 4, organModel: 2 });
    expect(p.effectSwitches).toEqual({ organ: [0, 0, 0, 0, 0], piano: [0, 1, 0, 0, 1] });
    expect(p.presetII.voxDrawbars[4]).toBe(6);
  });

  it('upgrades a version-100 record like the firmware: piano 17 takes piano 16', () => {
    const p = decodeNe3(nepg({ 'piano.param16': 4, 'piano.param17': 1 }, 100));
    expect(p.warnings).toEqual([]);
    expect(p.values['piano.param17']).toBe(4);
    expect(decodeNe3(nepg({ 'piano.param16': 4, 'piano.param17': 1 })).values['piano.param17']).toBe(1);
  });

  it('recognizes an Electro 3 HP file by its HP-only parameters', () => {
    expect(decodeNe3(nepg({ 'effectsShared.param17': 30 })).hp).toBe(true);
    expect(decodeNe3(nepg({ 'piano.param19': 2 })).hp).toBe(true);
    // A plain Electro 3 writes those bits as reserved zeros.
    const plain = synthLegacyLayoutFile('nepg', NE3_LAYOUT);
    expect(decodeNe3(plain).hp).toBeNull();
  });

  it('reads the record after an NSM-era header too', () => {
    const p = decodeNe3(synthLegacyLayoutFile('nepg', NE3HP_LAYOUT, { 'organPresetI.b3Drawbar9': 7 }, { nsmHeader: true }));
    expect(p.warnings).toEqual([]);
    expect(p.presetI.b3Drawbars[8]).toBe(7);
  });

  it('flags out-of-range values and odd versions; warns on short files, never throws', () => {
    expect(decodeNe3(nepg({ 'organPresetI.b3Drawbar1': 9 })).outOfRange).toEqual(['organPresetI.b3Drawbar1']);
    expect(decodeNe3(nepg({}, 102)).warnings.join(' ')).toContain('Record version 102');
    const short = decodeNe3(new Uint8Array(40));
    expect(short.complete).toBe(false);
    expect(short.warnings.join(' ')).toContain('136');
    expect(decodeNe3(new Uint8Array(0)).parsed).toBe(true);
  });
});

describe('ne3Decoded', () => {
  it('shows the organ presets of the selected model, the piano and the effect switches', () => {
    const d = ne3Decoded(nepg({ 'organPresetI.b3Drawbar4': 5, 'effectsOrgan.param2': 1 }));
    expect(d.title).toBe('Nord Electro 3 · Program');
    expect(d.header).toContainEqual(['Model', 'Electro 3 or 3 HP']);
    expect(d.sections.map((s) => s.id)).toEqual(['OI', 'OII', 'P', 'FX']);
    expect(d.sections[0].engines[0].parts).toEqual(['B3', '8 8 8 5 0 0 0 0 0']);
    expect(d.sections[0].drawbars).toHaveLength(9);
    expect(d.sections[2].engines[0].parts).toEqual(['Grand', 'model 1', '(not playing)']);
    expect(d.sections[3].engines.map((e) => e.parts)).toEqual([['Effect 2'], ['None on']]);
    expect(d.warnings).toEqual([]);
  });

  it('labels an HP file, Farfisa tabs and the HP piano names', () => {
    const d = ne3Decoded(nepg({
      'piano.param18': 1, 'organCommon.organModel': 1, 'common.instrumentSelect': 1, 'piano.type': 3,
    }));
    expect(d.title).toBe('Nord Electro 3 HP · Program');
    expect(d.sections[0].engines[0].parts).toEqual(['Farfisa', 'tabs 1 2 3', '(not playing)']);
    expect(d.sections[0].drawbars).toBeUndefined();
    expect(d.sections[2].engines[0].parts).toEqual(['EPiano 2', 'model 1']);
  });

  it('shows only the header for a truncated file', () => {
    const d = ne3Decoded(nepg().slice(0, 100));
    expect(d.sections).toEqual([]);
    expect(d.warnings?.length).toBeGreaterThan(0);
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-3');

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNe3 (fixtures)', () => {
  it('reads every real .nepg with no value outside its descriptor range', () => {
    const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.nepg'));
    for (const name of files) {
      const p = decodeNe3(new Uint8Array(readFileSync(join(FIXTURE_DIR, name))));
      expect(p.complete, name).toBe(true);
      expect(p.outOfRange, name).toEqual([]);
    }
  });
});
