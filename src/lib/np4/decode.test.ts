import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNp4 } from './decode';
import { np4Decoded } from './present';
import { NP4_LAYOUT, type Np4FieldKey } from './layout.generated';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';
import { CBIN_BODY_OFFSET } from '../clavia/cbin';

const file = (values: Partial<Record<Np4FieldKey, number>> = {}) => synthFwFile('np4p', synthFwBody(NP4_LAYOUT, values));

describe('decodeNp4 (Piano 4, firmware layout OS 2.66)', () => {
  it('reads a 134-byte file (90-byte body: MultiCommon 11 · Piano 17 · Synth 23 · Effects 31)', () => {
    expect(NP4_LAYOUT.blocks.map((b) => [b.name, b.offset, b.length])).toEqual([
      ['MultiCommon', 4, 11], ['Piano', 16, 17], ['Synth', 34, 23], ['Effects', 58, 31],
    ]);
    const bytes = file();
    expect(bytes.length).toBe(134);
    const p = decodeNp4(bytes);
    expect(p).toMatchObject({ parsed: true, format: 'np4p', layoutMatched: true, formatVersion: 100, version: '1.00' });
    expect(p.warnings).toEqual([]);
    expect(p._rawBody).toHaveLength(90);
    expect(p.values['piano.level']).toBe(127);
    expect(p.values['common.transposeValue']).toBe(1); // firmware default +1
  });

  it('places the piano reference at body[19] + bits 160–193 (bank 152/3, entry 155/5, variation 160/2, hash 162/32)', () => {
    const body = synthFwBody(NP4_LAYOUT);
    writeBits(body, 152, 3, 2);
    writeBits(body, 155, 5, 19);
    writeBits(body, 160, 2, 2);
    writeBits(body, 162, 32, 3490565097);
    writeBits(body, 146, 4, 0b1110); // OctaveShift −2, two's complement
    writeBits(body, 198, 3, 5);      // Eq
    const v = decodeNp4(synthFwFile('np4p', body)).values;
    expect(v['piano.bank']).toBe(2);
    expect(v['piano.entry']).toBe(19); // entry bit 4 survives (the old `& 0x0f` read gave 3)
    expect(v['piano.variation']).toBe(2);
    // The lookup key is the 32-bit hash alone — the old 34-bit read would have
    // been 2·2^32 + hash here and missed the piano-name table.
    expect(v['piano.nameHash']).toBe(3490565097);
    expect(v['piano.octaveShift']).toBe(-2);
    expect(v['piano.eq']).toBe(5);
  });

  it('round-trips piano, synth and effect fields (two\'s complement and value−1 fields included)', () => {
    const values = {
      'piano.enable': 1, 'piano.kbZone': 3, 'piano.level': 101, 'piano.octaveShift': -6, 'piano.acoustic': 2,
      'piano.kbdTouch': 1, 'piano.pedalNoise': 1, 'common.slotEnable': 3, 'common.transposeValue': -5,
      'synth.enable': 1, 'synth.smpPos': 399, 'synth.smpNameHash': 0xfedcba98, 'synth.ampEnvDcyRls': -60,
      'effects.fx1Src': 2, 'effects.eqlTreble': -60, 'effects.eqlBass': 12, 'effects.dlyRate': 16383, 'effects.spkType': 4,
    } as const;
    expect(decodeNp4(file(values)).values).toMatchObject(values);
  });

  it('matches the corpus bytes: body[6..7] = 80 40 is SplPos 3 + TransposeValue +1 (the firmware defaults)', () => {
    const bytes = file();
    expect(bytes[CBIN_BODY_OFFSET + 6]).toBe(0x80);
    expect(bytes[CBIN_BODY_OFFSET + 7]).toBe(0x40);
  });

  it('odd or short files → header-only with a warning, never a throw', () => {
    const full = file();
    const resized = full.slice();
    resized[CBIN_BODY_OFFSET + 16] = 0x12; // Piano block claims one byte too many
    for (const bytes of [full.slice(0, 44), full.slice(0, 100), resized, new Uint8Array(10)]) {
      const p = decodeNp4(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.values).toEqual({});
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('np4Decoded', () => {
  it('shows the piano by name, with Piano 4 labels and the effects that are on', () => {
    const d = np4Decoded(file({
      'piano.enable': 1, 'piano.bank': 2, 'piano.entry': 5, 'piano.nameHash': 3490565097, 'piano.level': 100, 'piano.eq': 3,
      'effects.fx2Enable': 1, 'effects.fx2Type': 0, 'effects.rvbEnable': 1, 'effects.rvbType': 1,
      'effects.spkEnable': 1, 'effects.spkType': 2,
      'common.transposeEnable': 1, 'common.transposeValue': 2,
    }), (h) => (h === 3490565097 ? 'EP6 Sparkletop XL' : undefined));
    expect(d.title).toBe('Nord Piano 4 · Program');
    expect(d.header).toContainEqual(['Transpose', '+2 semitones']);
    expect(d.header).toContainEqual(['Piano sound id', '0xd00dcbe9']);
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO', 'SAMPLE SYNTH', 'EFFECTS']);
    expect(d.sections[0].engines[0].parts).toEqual(['EP6 Sparkletop XL', 'Electric', 'level 100', 'Timbre Bright']);
    expect(d.sections[1].engines[0].parts).toContain('(off)');
    expect(d.sections[2].engines[0].parts).toEqual(['Phaser 1', 'Amp Twin', 'Reverb Stage']);
    expect(d.warnings).toEqual([]);
  });

  it('falls back to the piano type, shows a non-zero variation, and holds back the Clav timbre', () => {
    const d = np4Decoded(file({ 'piano.bank': 3, 'piano.variation': 1, 'piano.eq': 2 }), () => undefined);
    expect(d.sections[0].engines[0].parts).toEqual(['Clav/Hps', 'variation 2', 'level 127', '(off)']);
  });

  it('header-only presentation for a file whose structure does not match', () => {
    const d = np4Decoded(file().slice(0, 60));
    expect(d.sections).toEqual([]);
    expect(d.note).toMatch(/only the file header/);
    expect(d.warnings?.length).toBeGreaterThan(0);
  });
});

// ── Real-corpus cross-checks (gitignored fixtures; skipped when absent) ─────────

const FIXTURE_DIR = join(__dirname, '../../../fixtures/piano-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.np4p') && !f.startsWith('BUNDLE__'));
const values = (name: string) => decodeNp4(load(name)).values;

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNp4 — fixtures', () => {
  it('decodes every fixture without warnings (the block chain tiles the 90-byte body)', () => {
    for (const name of fixtures()) {
      const prog = decodeNp4(load(name));
      expect(prog.layoutMatched, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads a known version (1.00 or 1.01) from every fixture', () => {
    // 204/212 factory-restore fixtures are 1.00; 8 are 1.01 (the container reads 1.00–1.01).
    for (const name of fixtures()) {
      expect(['1.00', '1.01'], name).toContain(decodeNp4(load(name)).version);
    }
  });

  // Ground truth: the Ondre bundle's meta.xml declares each program's .npno
  // dependency; resolving the decoded hashes through the family-wide piano-name
  // table gives (2026-07-04): Utility Stage → EP1 Deep Timbre Lrg, Nord Corea →
  // EP4 Mk5 80s Lrg, George / Tea → EP5 BrightTines XL, Jazz Suitcase 2 → EP6
  // Sparkletop XL, Funky Suitcase → EP8 Nefertiti XL. The old 34-bit read at bit
  // 160 was Variation·2^32 + NameHash; every bundle program has variation 0, so
  // the values are unchanged.
  it('decodes the family-wide piano name hash for every bundle program', () => {
    const expected: [string, number][] = [
      ['Utility Stage', 3456736737], ['Nord Corea', 27369483], ['George Model E', 1691162699],
      ['Tea Phaser', 1691162699], ['Jazz Suitcase 2', 3490565097], ['Funky Suitcase', 401488166],
    ];
    for (const [n, hash] of expected) {
      expect(values(`${n}.np4p`)['piano.nameHash'], n).toBe(hash);
      expect(values(`${n}.np4p`)['piano.variation'], n).toBe(0);
    }
  });

  it('Pno_kEntry (body[19] bits 4–0) matches each paired .npno CBIN slot byte; Bank is Electric', () => {
    // meta.xml pairing → npno header slot @0x0e: EP1=0, EP4=3, EP5=4, EP6=5, EP8=7.
    // body[19] high bits 0b010 = Bank 2 (Electric) for all six EPs.
    const expected: [string, number][] = [
      ['Utility Stage', 0], ['Nord Corea', 3], ['George Model E', 4],
      ['Tea Phaser', 4], ['Jazz Suitcase 2', 5], ['Funky Suitcase', 7],
    ];
    for (const [n, slot] of expected) {
      expect(values(`${n}.np4p`)['piano.entry'], n).toBe(slot);
      expect(values(`${n}.np4p`)['piano.bank'], n).toBe(2);
    }
  });

  // The old `fxModWord` (body[59-60]) pinned the raw head of the Effects block.
  // The same corpus bytes decoded with the firmware layout (body bits 472-487):
  //   0x0202 → FX1 off, rate 64 (its default), FX2 on   (George, Corea, Tea Phaser)
  //   0x90f0 → FX1 on, type 4 (Panning 2), rate 30, FX2 off   (Funky Suitcase)
  //   0x8d7a → FX1 on, type 3 (Panning 1), rate 47, FX2 on    (Jazz Suitcase 2)
  //   0x94c8 → FX1 on, type 5 (Panning 3), rate 25, FX2 off   (Utility Stage)
  it('decodes the effects head that the old fxModWord pinned', () => {
    for (const n of ['George Model E', 'Nord Corea', 'Tea Phaser']) {
      expect(values(`${n}.np4p`), n).toMatchObject({ 'effects.fx1Enable': 0, 'effects.fx1Rate': 64, 'effects.fx2Enable': 1 });
    }
    expect(values('Funky Suitcase.np4p')).toMatchObject({ 'effects.fx1Enable': 1, 'effects.fx1Type': 4, 'effects.fx1Rate': 30, 'effects.fx2Enable': 0 });
    expect(values('Jazz Suitcase 2.np4p')).toMatchObject({ 'effects.fx1Enable': 1, 'effects.fx1Type': 3, 'effects.fx1Rate': 47, 'effects.fx2Enable': 1 });
    expect(values('Utility Stage.np4p')).toMatchObject({ 'effects.fx1Enable': 1, 'effects.fx1Type': 5, 'effects.fx1Rate': 25, 'effects.fx2Enable': 0 });
  });

  it('every field stays inside its firmware range across the corpus', () => {
    for (const name of fixtures()) {
      expect(decodeNp4(load(name)).warnings.filter((w) => /outside the instrument/.test(w)), name).toEqual([]);
    }
  });
});

describe('np4Decoded: keyboard split', () => {
  const split = (values: Parameters<typeof file>[0]) => np4Decoded(file(values)).header.find(([k]) => k === 'Split')?.[1];
  it('says which sound is below, where the split is (seven places from C3) and its crossfade', () => {
    expect(split({ 'common.splSelect': 0, 'common.splPos': 2 })).toBe('off');
    expect(split({ 'common.splSelect': 1, 'common.splPos': 0 })).toBe('Piano / Synth · at C3');
    expect(split({ 'common.splSelect': 2, 'common.splPos': 6, 'common.splWidth': 2 })).toBe('Synth / Piano · at C6 · crossfade ±12');
  });
  it('draws the two sounds on their sides', () => {
    const d = np4Decoded(file({ 'common.splSelect': 1, 'common.splPos': 3, 'piano.enable': 1, 'synth.enable': 1 }));
    expect(d.keyboard!.boundaries).toEqual([null, 'F4', null]);
    expect([d.keyboard!.zones[0].layers[0].kind, d.keyboard!.zones[3].layers[0].kind]).toEqual(['piano', 'synth']);
  });
});
