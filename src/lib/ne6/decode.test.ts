/**
 * NE6 decoder tests.
 *
 * 1. Synthetic bodies built from the firmware layout (Electro 6 OS 2.66
 *    registry FUN_c0054b5c, via layout.generated.ts) — always run.
 * 2. Cross-checks against the 16 real .ne6p fixtures (gitignored; skipped when
 *    absent). Expectations that encoded the corpus-only reading ("upper/lower"
 *    drawbars, `sectionEnable`, the 4-byte "modelId" at 40-43, the organ
 *    "lead-in") are restated in the firmware's terms, from the same pinned bytes.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe6 } from './decode';
import { ne6Decoded } from './present';
import { NE6_LAYOUT, type Ne6FieldKey } from './layout.generated';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';
import { readBits } from '../clavia/bitstream';

const file = (values: Partial<Record<Ne6FieldKey, number>> = {}) =>
  synthFwFile('ne6p', synthFwBody(NE6_LAYOUT, values, 204), 204);

/** Body [byte, bit-in-byte (7 = MSB)] of a field's first bit. */
function at(key: Ne6FieldKey): [number, number] {
  const f = NE6_LAYOUT.fields.find((x) => x.key === key)!;
  const bit = (NE6_LAYOUT.blocks[f.block].offset + 1) * 8 + f.bit;
  return [bit >> 3, 7 - (bit & 7)];
}

describe('NE6 firmware layout', () => {
  it('chains 14 blocks from body 4 to the 211-byte body end', () => {
    expect(NE6_LAYOUT.blocks).toHaveLength(14);
    expect(NE6_LAYOUT.bodyBytes).toBe(211);
    expect(NE6_LAYOUT.blocks[0]).toMatchObject({ name: 'MultiComm', offset: 4, length: 0x0e });
    expect(file()).toHaveLength(0x2c + 211);
  });

  it('puts the drawbar presets, enables and sample references where the firmware says', () => {
    expect(at('manualAPresetI.db1')).toEqual([143, 7]);
    expect(at('manualAPresetII.db1')).toEqual([158, 7]);
    expect(at('manualBPresetI.db1')).toEqual([182, 7]);
    expect(at('manualBPresetII.db1')).toEqual([197, 7]);
    expect(at('manualAPresetCommon.presetFocus')).toEqual([134, 7]);
    expect(at('manualBPresetCommon.presetFocus')).toEqual([173, 7]);
    expect(at('piano.enable')).toEqual([20, 7]);
    expect(at('synth.enable')).toEqual([38, 7]);
    expect(at('organ.enable')).toEqual([94, 7]);
    expect(at('synth.smpPos')).toEqual([40, 7]);
    expect(at('synth.smpNameHash')).toEqual([41, 6]);
    expect(at('piano.nameHash')).toEqual([23, 5]);
    expect(at('organManualCommon.level')).toEqual([124, 7]);
  });
});

describe('decodeNe6 (synthetic, firmware layout)', () => {
  it('decodes a default body cleanly: version, chain, default drawbars + flag nibble', () => {
    const p = decodeNe6(file());
    expect(p).toMatchObject({ format: 'ne6p', layoutMatched: true, formatVersion: 204, version: '2.04' });
    expect(p.warnings).toEqual([]);
    const body = p._rawBody;
    expect(body[142]).toBe(0x0e);
    expect(body[157]).toBe(0x0e);
    // Default preset: 88888888 8 | Vib 0 Perc 0 Harm 1 Speed 1 = 0x83, PercLevel 1 = 0x80.
    expect(Array.from(body.slice(143, 149))).toEqual([0x88, 0x88, 0x88, 0x88, 0x83, 0x80]);
    expect(p.values).toMatchObject({
      'manualAPresetI.db9': 8, 'manualAPresetI.vibratoEnable': 0, 'manualAPresetI.b3PercEnable': 0,
      'manualAPresetI.b3PercHarmonic': 1, 'manualAPresetI.b3PercSpeed': 1, 'manualAPresetI.b3PercLevel': 1,
    });
  });

  it('round-trips the four drawbar presets, focus bits, enables and sample references', () => {
    const v = {
      'manualAPresetI.db2': 5, 'manualAPresetII.db9': 0, 'manualBPresetI.db1': 3, 'manualBPresetII.db4': 1,
      'manualBPresetII.vibratoEnable': 1, 'manualBPresetCommon.presetFocus': 1,
      'piano.enable': 1, 'piano.bank': 2, 'piano.nameHash': 0x12345678,
      'synth.enable': 1, 'synth.smpPos': 399, 'synth.smpNameHash': 0x8badcafe,
      'organ.enable': 1, 'organManualCommon.level': 100, 'organManualCommon.model': 1,
    } as const;
    const p = decodeNe6(file(v));
    expect(p.values).toMatchObject(v);
    expect(p._rawBody[20] >> 7).toBe(1);
    expect(p._rawBody[94] >> 7).toBe(1);
    expect(readBits(p._rawBody, 41 * 8 + 1, 32)).toBe(0x8badcafe); // name hashes are kept as the raw bits
  });

  it("stores negative-min fields as two's complement (registry signed mode 0)", () => {
    const p = decodeNe6(file({
      'piano.octaveShift': -2, 'organMultiB.octaveShift': -6, 'effects.eqlTreble': -60, 'common.transposeValue': 5,
    }));
    const body = p._rawBody;
    // Piano octave shift: 4 bits from body 21 b5 — -2 is 0b1110 (an offset encoding would store 0b0100).
    expect(at('piano.octaveShift')).toEqual([21, 5]);
    expect((body[21] >> 2) & 0xf).toBe(0b1110);
    expect(readBits(body, 114 * 8 + 2, 4)).toBe(0b1010); // OrganMultiB octave −6
    expect(readBits(body, 69 * 8 + 2, 7)).toBe(0b1000100); // EQ treble −60 in 7 bits
    expect(p.values).toMatchObject({
      'piano.octaveShift': -2, 'organMultiB.octaveShift': -6, 'effects.eqlTreble': -60, 'common.transposeValue': 5,
    });
    expect(p.warnings).toEqual([]);

    // Raw 0b0100 is +4 under two's complement (the old raw − min reading gave −2).
    writeBits(body, 21 * 8 + 2, 4, 0b0100);
    expect(decodeNe6(synthFwFile('ne6p', body, 204)).values['piano.octaveShift']).toBe(4);
  });

  it('a 1.xx body (other chain) or a truncated file → header-only with a warning', () => {
    const p = decodeNe6(file().slice(0, 0x2c + 150));
    expect(p.layoutMatched).toBe(false);
    expect(p.warnings.length).toBeGreaterThan(0);
    expect(decodeNe6(new Uint8Array(5)).warnings.length).toBeGreaterThan(0);
    expect(ne6Decoded(new Uint8Array(5)).sections).toEqual([]);
  });

  it('presents piano / synth / organ A+B / effects with the instrument labels', () => {
    const d = ne6Decoded(file({
      'piano.enable': 1, 'piano.bank': 2, 'piano.level': 90, 'piano.octaveShift': -1,
      'synth.enable': 0,
      'organ.enable': 1, 'organManualCommon.model': 0, 'organManualCommon.vibratoType': 5,
      'manualAPresetI.vibratoEnable': 1, 'manualAPresetI.db3': 2,
      'manualBPresetCommon.presetFocus': 1, 'manualBPresetII.b3PercEnable': 1,
      'effects.fx1Enable': 1, 'effects.fx1Type': 6, 'effects.rvbEnable': 1, 'effects.rvbType': 2,
      'effects.rvbBright': 1, 'common.transposeEnable': 1, 'common.transposeValue': -2,
    }));
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO', 'SAMPLE SYNTH', 'ORGAN A', 'ORGAN B', 'EFFECTS']);
    const byId = Object.fromEntries(d.sections.map((s) => [s.id, s]));
    expect(byId.P.engines[0].parts).toEqual(['Electric', 'level 90', 'Oct −1']);
    expect(byId.S.engines[0].parts).toEqual(['level 127', '(off)']);
    expect(byId.OA.engines[0].parts).toEqual(['B3', 'level 127', 'Preset I']);
    expect(byId.OA.drawbars?.map((b) => b.level).slice(0, 3)).toEqual([8, 8, 2]);
    expect(byId.OA.drawbars?.[0].footage).toBe('16′');
    expect(byId.OA.chips).toEqual(['Vibrato C3']);
    expect(byId.OB.engines[0].parts).toContain('Preset II');
    expect(byId.OB.chips).toEqual(['Percussion']);
    expect(byId.FX.engines[0].parts).toEqual(['Wah-Wah', 'Hall Bright']);
    expect(d.header).toContainEqual(['Transpose', '−2 semitones']);
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-6');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNe6 (fixtures)', () => {
  it('decodes without warnings on a valid fixture', () => {
    const prog = decodeNe6(load('BUNDLE__Brass_Boy.ne6p'));
    expect(prog.layoutMatched).toBe(true);
    expect(prog.warnings).toHaveLength(0);
  });

  it('reads version 2.04 (CBIN and body u32) from all fixtures', () => {
    for (const name of ['BUNDLE__Brass_Boy.ne6p', 'BUNDLE__Drunken_Brass.ne6p', 'BUNDLE__Logan_Synth.ne6p']) {
      const prog = decodeNe6(load(name));
      expect(prog.version, name).toBe('2.04');
      expect(prog.formatVersion, name).toBe(204);
    }
  });

  const bars = (name: string, preset: 'manualAPresetI' | 'manualAPresetII') => {
    const v = decodeNe6(load(name)).values;
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => v[`${preset}.db${i}` as Ne6FieldKey]);
  };

  it('Brass_Boy: manual A Preset I and II (were "upper"/"lower") all at 8', () => {
    expect(bars('BUNDLE__Brass_Boy.ne6p', 'manualAPresetI')).toEqual([8, 8, 8, 8, 8, 8, 8, 8, 8]);
    expect(bars('BUNDLE__Brass_Boy.ne6p', 'manualAPresetII')).toEqual([8, 8, 8, 8, 8, 8, 8, 8, 8]);
  });

  it('Drunken_Brass: manual A Preset I (body 143) / Preset II (body 158)', () => {
    // 85 70 50 00 03 → [8,5,7,0,5,0,0,0,0]; 75 60 45 50 03 → [7,5,6,0,4,5,5,0,0]
    expect(bars('BUNDLE__Drunken_Brass.ne6p', 'manualAPresetI')).toEqual([8, 5, 7, 0, 5, 0, 0, 0, 0]);
    expect(bars('BUNDLE__Drunken_Brass.ne6p', 'manualAPresetII')).toEqual([7, 5, 6, 0, 4, 5, 5, 0, 0]);
  });

  it('Duvet_Pad: manual A Preset I', () => {
    // 62 54 32 11 0b → [6,2,5,4,3,2,1,1,0]
    expect(bars('BUNDLE__Duvet_Pad.ne6p', 'manualAPresetI')).toEqual([6, 2, 5, 4, 3, 2, 1, 1, 0]);
  });

  it('the flag nibble after drawbar 9 is Vib/Perc/Harmonic/Speed (0x3 default, 0xb on Duvet_Pad)', () => {
    const flags = (name: string) => {
      const v = decodeNe6(load(name)).values;
      return [v['manualAPresetI.vibratoEnable'], v['manualAPresetI.b3PercEnable'],
        v['manualAPresetI.b3PercHarmonic'], v['manualAPresetI.b3PercSpeed']];
    };
    expect(flags('BUNDLE__Brass_Boy.ne6p')).toEqual([0, 0, 1, 1]);
    expect(flags('BUNDLE__Duvet_Pad.ne6p')).toEqual([1, 0, 1, 1]);
  });

  it('body 5-6 bits (were "sectionEnable") are the MultiComm split position', () => {
    // byte5 b0 / byte6 b7 are the low two bits of Edt_Com_kSplPos (byte5 b1 is its top bit).
    const lowBits = (n: string) => (decodeNe6(load(n)).values['common.splPos'] ?? -1) & 0b11;
    expect(lowBits('BUNDLE__Brass_Boy.ne6p')).toBe(0b11);
    expect(lowBits('BUNDLE__Drunken_Brass.ne6p')).toBe(0b01);
    expect(lowBits('BUNDLE__Duvet_Pad.ne6p')).toBe(0b00);
  });

  it('body 38-41 (was the "sample" header + modelId) is the Synth block', () => {
    // 38-39 = df c2 / df fe: Enable 1, KbZone 2, Level 127.
    for (const name of ['BUNDLE__Brass_Boy.ne6p', 'BUNDLE__Logan_Synth.ne6p']) {
      expect(decodeNe6(load(name)).values, name).toMatchObject({ 'synth.enable': 1, 'synth.level': 127 });
    }
    // SmpPos = 9 bits from body 40 b7: 49 2f → 146, 75 1f → 234.
    expect(decodeNe6(load('BUNDLE__Tiffany-Bell.ne6p')).values['synth.smpPos']).toBe(146);
    expect(decodeNe6(load('BUNDLE__Drunken_Brass.ne6p')).values['synth.smpPos']).toBe(234);
  });

  it('body 124-125 (was the organ "lead-in") is OrgMan Level / Model / VibratoType', () => {
    // 8e 00 → level 71, model 0 (B3), vibrato 0; eb 00 → level 117, model 4 (Pipe2).
    expect(decodeNe6(load('BUNDLE__Drunken_Brass.ne6p')).values).toMatchObject({
      'organManualCommon.level': 71, 'organManualCommon.model': 0, 'organManualCommon.vibratoType': 0,
    });
    expect(decodeNe6(load('BUNDLE__Duvet_Pad.ne6p')).values).toMatchObject({
      'organManualCommon.level': 117, 'organManualCommon.model': 4,
    });
  });
});
