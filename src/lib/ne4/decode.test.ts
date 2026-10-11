/**
 * NE4 decoder tests.
 *
 * 1. Synthetic records built from the firmware layout (Electro 4 OS 1.22
 *    descriptors, via layout.generated.ts) — always run.
 * 2. Cross-checks against the 16 real .ne4p fixtures (gitignored; skipped when
 *    absent). The corpus expectations are kept, restated in firmware terms: the
 *    "active" drawbars (body 16-20) are B3 Preset II, the factory-default pair
 *    (body 4-8 / 25-29) is Vox Preset I / II, "sectionFlags" (body 0) is B3
 *    Preset I's percussion switches + 3-bit field, and the 5-byte "refId" (body
 *    37-41) is pianoSample type / model / variation / reference ids.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe4 } from './decode';
import { NE4_LAYOUT, type Ne4FieldKey } from './layout.generated';
import { synthLegacyFile, writeLegacyRecord } from '../clavia/block-chain.synth';

const fileByte = (key: Ne4FieldKey) => 0x1a + (NE4_LAYOUT.fields.find((f) => f.key === key)!.bit >> 3);

function ne4p(values: Partial<Record<Ne4FieldKey, number>> = {}): Uint8Array {
  const data = new Uint8Array(NE4_LAYOUT.dataBytes);
  writeLegacyRecord(data, NE4_LAYOUT, values);
  return synthLegacyFile('ne4p', 103, data); // any trailer: the E4 CRC coverage is unverified
}

describe('NE4 firmware layout', () => {
  it('is a 108-byte bitstream at file 0x1A with the drawbar sets at the corpus anchors', () => {
    expect(NE4_LAYOUT).toMatchObject({ dataBytes: 108, recordVersion: null });
    expect(0x1a + NE4_LAYOUT.dataBytes + 2).toBe(136);
    expect(fileByte('b3PresetI.0')).toBe(0x27);
    expect(fileByte('voxPresetI.0')).toBe(0x2c + 4);
    expect(fileByte('b3PresetII.0')).toBe(0x2c + 16);
    expect(fileByte('voxPresetII.0')).toBe(0x2c + 25);
    expect(fileByte('farfPresetI.0')).toBe(0x37);
    expect(fileByte('farfPresetII.0')).toBe(0x4c);
    expect(fileByte('pianoSample.0')).toBe(0x2c + 37);
    expect(fileByte('effects.0')).toBe(0x2c + 51);
  });

  it('stores every value raw with minimum 0, without overlaps, and drops the not-stored and reserved descriptors', () => {
    const used = new Set<number>();
    for (const f of NE4_LAYOUT.fields) {
      expect([f.enc, f.min], f.key).toEqual(['u', 0]);
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
    const keys = NE4_LAYOUT.fields.map((f) => f.key as string);
    expect(keys).not.toContain('b3Common.1'); // not stored
    expect(keys).not.toContain('programCommon.4'); // reserved
  });
});

describe('decodeNe4 (synthetic, firmware layout)', () => {
  it('decodes the default record: B3 888000000, Vox 880000088, trailer', () => {
    const file = ne4p();
    const p = decodeNe4(file);
    expect(p.warnings).toEqual([]);
    expect(p.outOfRange).toEqual([]);
    expect(p.version).toBe('1.03');
    expect(p.organ.b3PresetI.drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(p.organ.b3PresetII.drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(p.organ.voxPresetI.drawbars).toEqual([8, 8, 0, 0, 0, 0, 0, 8, 8]);
    expect(p.organ.farfPresetI.tabs).toEqual([1, 1, 1, 0, 0, 0, 0, 0, 0]);
    expect(p.organ.b3PresetI.mode).toBe(2);
    expect(file[0x2c]).toBe(0x04); // the corpus "sectionFlags" default = B3 Preset I mode 2
    expect(p.checksum).toBe(file[134] | (file[135] << 8));
    expect(p._data).toHaveLength(108);
  });

  it('reads B3 vibrato + percussion, Farfisa vibrato and the piano/sample reference', () => {
    const p = decodeNe4(ne4p({
      'b3PresetII.9': 5, 'b3PresetII.11': 1, 'b3PresetII.14': 1, 'b3PresetII.15': 4,
      'farfPresetII.9': 3,
      'pianoSample.0': 5, 'pianoSample.1': 37, 'pianoSample.3': 0x1cb3, 'pianoSample.4': 0x7fff,
    }));
    expect(p.organ.b3PresetII).toMatchObject({ vibratoType: 5, percussion: [1, 0, 0, 1], mode: 4 });
    expect(p.organ.farfPresetII.vibrato).toBe(3);
    expect(p.pianoSample).toEqual({ type: 5, model: 37, variation: 0, refIds: [0x1cb3, 0x7fff] });
    expect(p.values['effects.12']).toBe(127); // descriptor default
  });

  it('flags values above their descriptor max', () => {
    expect(decodeNe4(ne4p({ 'b3PresetI.0': 9 })).outOfRange).toEqual(['b3PresetI.0']);
  });

  it('warns on truncated or mis-sized files, never throws', () => {
    expect(decodeNe4(new Uint8Array(5)).warnings.length).toBeGreaterThan(0);
    expect(decodeNe4(new Uint8Array(92)).warnings.join(' ')).toContain('136');
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.ne4p'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNe4 (fixtures)', () => {
  it('decodes every fixture without warnings, version 1.03, values in range', () => {
    for (const name of fixtures()) {
      const prog = decodeNe4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
      expect(prog.version, name).toBe('1.03');
      expect(prog.outOfRange, name).toEqual([]);
    }
  });

  it('B3 Preset II drawbars (was the "active" set at body 16-20)', () => {
    expect(decodeNe4(load('Infectd Square 1 FS.ne4p')).organ.b3PresetII.drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(decodeNe4(load('Freddie Smith Nord Samples.ne4p')).organ.b3PresetII.drawbars).toEqual([8, 8, 8, 8, 0, 0, 0, 0, 0]);
  });

  it('Vox Preset I / II drawbars (were the factory-default pair at body 4-8 / 25-29)', () => {
    for (const name of fixtures()) {
      const o = decodeNe4(load(name)).organ;
      expect(o.voxPresetI.drawbars, name).toEqual([8, 8, 0, 0, 0, 0, 0, 8, 8]);
      expect(o.voxPresetII.drawbars, name).toEqual([8, 8, 0, 0, 0, 0, 0, 8, 8]);
    }
  });

  it('B3 Preset I percussion + mode (was "sectionFlags" 0x04 / 0x38 / 0xf6 at body 0)', () => {
    expect(decodeNe4(load('Infectd Square 1 FS.ne4p')).organ.b3PresetI).toMatchObject({ percussion: [0, 0, 0, 0], mode: 2 });
    expect(decodeNe4(load('Nord Stage Electro Lead Samples.ne4p')).organ.b3PresetI).toMatchObject({ percussion: [0, 0, 1, 1], mode: 4 });
    expect(decodeNe4(load('Nord Stage Electro Lead Samples (2).ne4p')).organ.b3PresetI).toMatchObject({ percussion: [1, 1, 1, 1], mode: 3 });
  });

  it('pianoSample type/model/ids (was the 5-byte "refId" a941cb3d51 at body 37-41)', () => {
    // a9 41 cb 3d 51 → type 5, model 37, variation 0, id0 0x1cb3; the sibling sound
    // a5 81 cb 3d 51 shares the ids and differs in model (22).
    const sq1 = decodeNe4(load('Infectd Square 1 FS.ne4p')).pianoSample;
    const sq2 = decodeNe4(load('Infected Squ 2FS.ne4p')).pianoSample;
    expect(sq1).toMatchObject({ type: 5, model: 37, variation: 0 });
    expect(sq2).toMatchObject({ type: 5, model: 22, variation: 0 });
    expect(sq1.refIds[0]).toBe(0x1cb3);
    expect(sq2.refIds).toEqual(sq1.refIds);
  });

  it('the trailer is the old "program-specific" body 90-91', () => {
    for (const name of fixtures()) {
      const file = load(name);
      expect(decodeNe4(file).checksum, name).toBe(file[0x2c + 90] | (file[0x2c + 91] << 8));
    }
  });
});
