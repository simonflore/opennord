/**
 * NE5 reader tests.
 *
 * 1. Synthetic records built from the firmware layout (Electro 5 OS 2.04
 *    containers, via layout.generated.ts) — always run.
 * 2. Cross-checks against the real .ne5p fixtures (gitignored; skipped when
 *    absent). The earlier corpus decoder's anchors are kept, restated in
 *    firmware terms (types.ts): its "preset 1 upper / lower" are B3 Preset I /
 *    II, its "preset 2 upper / lower" Vox Preset I / II, its "pedal" Farfisa
 *    Preset I, and its 6-byte "sample model id" the Sample Synth sample select
 *    and its two 15-bit sample ids.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe5 } from './decode';
import { ne5Decoded } from './present';
import { NE5_LAYOUT, type Ne5FieldKey } from './layout.generated';
import { synthLegacyLayoutFile } from '../clavia/block-chain.synth';

const field = (key: Ne5FieldKey) => NE5_LAYOUT.fields.find((f) => f.key === key)!;
/** The old decoder's "body" offset (from file 0x2C) of a field's first byte. */
const body = (key: Ne5FieldKey) => 0x1a + (field(key).bit >> 3) - 0x2c;

function ne5p(values: Partial<Record<Ne5FieldKey, number>> = {}, version = 4): Uint8Array {
  return synthLegacyLayoutFile('ne5p', NE5_LAYOUT, values, { version: version });
}

describe('NE5 record version', () => {
  it("falls back to NSM's copy at 0x14 when the record's own copy (0x18) isn't one the firmware reads", () => {
    const bytes = ne5p({ 'b3PresetI.drawbar1': 7 });
    bytes[0x18] = 0; bytes[0x19] = 0; // the old decoder never checked these two bytes
    const p = decodeNe5(bytes);
    expect(p.layoutMatched).toBe(true);
    expect(p.recordVersion).toBe(4);
    expect(p.values['b3PresetI.drawbar1']).toBe(7);
  });

  it('still refuses a file whose version is unreadable in both places', () => {
    const bytes = ne5p();
    bytes[0x18] = 0; bytes[0x19] = 9; bytes[0x14] = 9; bytes[0x15] = 0;
    expect(decodeNe5(bytes).layoutMatched).toBe(false);
  });
});

describe('NE5 firmware layout', () => {
  it('is a 119-byte record at file 0x1A, version 4, 173 parameters', () => {
    expect(NE5_LAYOUT).toMatchObject({ dataBytes: 119, recordVersion: 4 });
    expect(NE5_LAYOUT.fields).toHaveLength(173);
    expect(0x1a + NE5_LAYOUT.dataBytes + 2).toBe(147);
    // 167 carry a firmware label; the other six are named by position (`common.param8`, …).
    expect(NE5_LAYOUT.fields.filter((f) => f.name !== f.key)).toHaveLength(167);
  });

  it('puts the organ presets where the old decoder found drawbars, under their firmware names', () => {
    expect(body('b3PresetI.drawbar1')).toBe(21);
    expect(body('b3PresetII.drawbar1')).toBe(28);
    expect(body('voxPresetI.drawbar1')).toBe(39);
    expect(body('voxPresetII.drawbar1')).toBe(45);
    expect(body('farfPresetI.drawbar1')).toBe(55);
    expect(body('churchPresetI.drawbar1')).toBe(71);
    // The old "sampleSectionActive" (body 17 bit 7) is the top bit of the B3 vibrato/chorus type.
    expect(field('b3Global.b3VibChorus')).toMatchObject({ bit: (0x2c + 17 - 0x1a) * 8, width: 3 });
    // The old "flagByte19" is the B3 Upper preset select; "sectionEnableNibble" (body 6) the attack.
    expect(body('b3Upper.presetSelect')).toBe(19);
    expect(body('sampleSynth.sampleSynthAttack')).toBe(6);
    // The old "sampleModelFlag" (body 13 bit 7) is Filter Vel; "sampleDescriptor" (83–94) the effects.
    expect(field('sampleSynth.sampleSynthFilterVel')).toMatchObject({ bit: (0x2c + 13 - 0x1a) * 8, width: 1 });
    expect(body('effects.effects1Enable')).toBe(83);
  });

  it('stores every value raw with minimum 0, without overlaps', () => {
    const used = new Set<number>();
    for (const f of NE5_LAYOUT.fields) {
      expect([f.enc, f.min], f.key).toEqual(['u', 0]);
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
  });
});

describe('decodeNe5 (synthetic, firmware layout)', () => {
  it('reads a default record: B3 888000000 in both presets, effects off', () => {
    const p = decodeNe5(ne5p());
    expect(p.warnings).toEqual([]);
    expect(p.layoutMatched).toBe(true);
    expect(p.version).toBe('0.04');
    expect(p.recordVersion).toBe(4);
    expect(p.organ.b3.presetI.drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(p.organ.b3.presetI.bass).toEqual([8, 8]);
    expect(p.organ.vox.presetII.drawbars).toEqual([8, 8, 8, 8, 0, 0, 0, 0, 0]);
    expect(p.organModel).toBe(0);
  });

  it('reads the organ sets, piano and sample references', () => {
    const p = decodeNe5(ne5p({
      'b3PresetI.drawbar1': 6, 'b3PresetI.drawbar9': 3, 'b3PresetI.vibChorusOn': 1, 'b3PresetI.percussionOn': 1,
      'b3Upper.presetSelect': 1, 'churchPresetII.percOn': 1, 'common.organModel': 3,
      'piano.pianoType': 2, 'piano.pianoModel': 11, 'piano.pianoIdA': 0x1234, 'piano.pianoIdB': 0x7fff,
      'sampleSynth.sampleSelect': 1, 'sampleSynth.sampleIdA': 29186, 'sampleSynth.sampleIdB': 20882,
    }));
    expect(p.organ.b3.presetI).toMatchObject({ drawbars: [6, 8, 8, 0, 0, 0, 0, 0, 3], vibrato: true, percussion: true });
    expect(p.organ.b3.upperPreset).toBe(1);
    expect(p.organ.church.presetII.percussion).toBe(true);
    expect(p.organModel).toBe(3);
    expect(p.piano).toEqual({ type: 2, model: 11, ids: [0x1234, 0x7fff] });
    expect(p.sampleSynth).toEqual({ sample: 1, ids: [29186, 20882] });
    // The old decoder's 6-byte "sample model id" at body 7–12 holds exactly these.
    const file = ne5p({ 'sampleSynth.sampleSelect': 1, 'sampleSynth.sampleIdA': 29186, 'sampleSynth.sampleIdB': 20882,
      'sampleSynth.sampleSynthDcyRel': 0x20, 'sampleSynth.param6': 1 });
    expect(Array.from(file.slice(0x2c + 7, 0x2c + 13))).toEqual([0x80, 0x07, 0x90, 0x15, 0x19, 0x24]);
  });

  it('converts a version 3 record (the EQ source moves to its 2-bit field), refuses version 2 (header only)', () => {
    const v3 = decodeNe5(ne5p({}, 3));
    expect(v3.layoutMatched).toBe(true);
    expect(v3.warnings.join(' ')).toMatch(/version 3.*converts it the same way/);
    // Version 3 kept the EQ source in one bit (now effects.param15): 1 = Part U.
    const u = decodeNe5(ne5p({ 'effects.param15': 1, 'effects.equalizerSource': 2 }, 3));
    expect(u.values).toMatchObject({ 'effects.equalizerSource': 1, 'effects.param15': 0 });
    expect(u.outOfRange).toEqual([]);
    const l = decodeNe5(ne5p({ 'effects.param15': 0, 'effects.equalizerSource': 2 }, 3));
    expect(l.values['effects.equalizerSource']).toBe(0);
    // Version 4 reads as stored.
    expect(decodeNe5(ne5p({ 'effects.equalizerSource': 2 })).values['effects.equalizerSource']).toBe(2);
    const v2 = decodeNe5(ne5p({}, 2));
    expect(v2.layoutMatched).toBe(false);
    expect(v2.values).toEqual({});
    expect(v2.warnings.join(' ')).toMatch(/version 2/);
  });

  it('flags a short file (header only) and a wrong size', () => {
    const file = ne5p();
    const short = decodeNe5(file.slice(0, 100));
    expect(short.layoutMatched).toBe(false);
    expect(short.warnings[0]).toMatch(/too short/);
    const long = new Uint8Array(file.length + 4);
    long.set(file);
    expect(decodeNe5(long).warnings[0]).toMatch(/151 bytes.*147/);
  });

  it('presents the piano, sample synth, organ parts with B3 footage and the effects', () => {
    const d = ne5Decoded(ne5p({
      'common.organModel': 0, 'b3Upper.presetSelect': 1, 'b3PresetII.drawbar2': 5, 'b3PresetII.percussionOn': 1,
      'piano.pianoType': 0, 'effects.reverbEnable': 1, 'effects.delayEnable': 1,
    }));
    expect(d.title).toBe('Nord Electro 5 · Program');
    expect(d.sections.map((s) => s.id)).toEqual(['P', 'S', 'OU', 'OL', 'FX']);
    const upper = d.sections.find((s) => s.id === 'OU')!;
    expect(upper.engines[0].parts).toEqual(['B3', 'Preset II']);
    expect(upper.drawbars!.map((b) => b.level)).toEqual([8, 5, 8, 0, 0, 0, 0, 0, 0]);
    expect(upper.drawbars![0].footage).toBe('16′');
    expect(upper.chips).toContain('Percussion');
    expect(d.sections.find((s) => s.id === 'OL')!.engines[0].parts).toEqual(['B3', 'Preset I']);
    expect(d.sections.find((s) => s.id === 'P')!.engines[0].parts[0]).toBe('Grand');
    expect(d.sections.find((s) => s.id === 'FX')!.engines[0].parts).toEqual(['Delay', 'Reverb']);
    const vox = ne5Decoded(ne5p({ 'common.organModel': 1 })).sections.find((s) => s.id === 'OU')!;
    expect(vox.engines[0].parts[0]).toBe('Vox');
    expect(vox.drawbars![0].footage).toBeUndefined();
  });

  it('presents a refused version as the file header only', () => {
    const d = ne5Decoded(ne5p({}, 1));
    expect(d.sections).toEqual([]);
    expect(d.warnings!.length).toBeGreaterThan(0);
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-5');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.ne5p'));

const VCS3 = 'VCS3 Organ Sample.ne5p';
const WALK = 'Walk of Life Nord Samples.ne5p';
const NAKED = 'Naked Piano Sample.ne5p';
const LEAD1 = 'Nord Stage Electro Lead Samples (1).ne5p';

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNe5 (corpus)', () => {
  it('reads every fixture as a version 4 record without warnings', () => {
    for (const name of fixtures()) {
      const p = decodeNe5(load(name));
      expect(p.layoutMatched, name).toBe(true);
      expect(p.version, name).toBe('0.04');
      expect(p.warnings, name).toHaveLength(0);
    }
  });

  it('every drawbar is 0–8', () => {
    for (const name of fixtures()) {
      const { organ } = decodeNe5(load(name));
      for (const set of Object.values(organ)) {
        for (const pr of [set.presetI, set.presetII]) {
          for (const bar of pr.drawbars) expect(bar, name).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it('VCS3 Organ: B3 Preset I carries its custom voicing, Vox Preset I is all zero', () => {
    const p = decodeNe5(load(VCS3));
    expect(p.organ.b3.presetI.drawbars).toEqual([6, 1, 8, 8, 4, 8, 4, 6, 6]);
    expect(p.organ.vox.presetI.drawbars).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('Walk of Life carries custom Vox Preset I and II drawbars', () => {
    const p = decodeNe5(load(WALK));
    expect(p.organ.vox.presetI.drawbars).toEqual([8, 8, 8, 8, 0, 3, 0, 0, 2]);
    expect(p.organ.vox.presetII.drawbars).toEqual([8, 8, 8, 7, 5, 8, 3, 1, 3]);
  });

  it('Naked Piano and NSE Lead (1) reference the same sample (select 1, ids 29186 / 20882)', () => {
    const naked = decodeNe5(load(NAKED)).sampleSynth;
    expect(naked).toEqual({ sample: 1, ids: [29186, 20882] });
    expect(decodeNe5(load(LEAD1)).sampleSynth).toEqual(naked);
  });
});
