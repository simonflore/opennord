import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNg2 } from './decode';
import { ng2Decoded } from './present';
import { NG2_LAYOUT, type Ng2FieldKey } from './layout.generated';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';
import { CBIN_BODY_OFFSET } from '../clavia/cbin';

const file = (values: Partial<Record<Ng2FieldKey, number>> = {}) =>
  synthFwFile('ng2p', synthFwBody(NG2_LAYOUT, values, 102), 102);

describe('decodeNg2 (Grand 2, firmware layout OS 1.22 FUN_c01125f8)', () => {
  it('reads a 229-byte file (185-byte body, 11 blocks)', () => {
    expect(NG2_LAYOUT.blocks.map((b) => b.length)).toEqual([10, 5, 13, 13, 21, 21, 5, 20, 20, 21, 21]);
    const bytes = file();
    expect(bytes.length).toBe(229);
    const p = decodeNg2(bytes);
    expect(p).toMatchObject({ parsed: true, format: 'ng2p', layoutMatched: true, formatVersion: 102, version: '1.02' });
    expect(p.warnings).toEqual([]);
  });

  it('the corpus "TLV tags" are the block-length bytes (0x0d piano, 0x15 piano FX, 0x14 synth, 0x05 common)', () => {
    const body = file().slice(CBIN_BODY_OFFSET);
    expect(NG2_LAYOUT.blocks.map((b) => body[b.offset])).toEqual([10, 5, 13, 13, 21, 21, 5, 20, 20, 21, 21]);
    expect(body[99]).toBe(0x14); // SynA length — the old "effects section tag"
  });

  it('places the piano A fields at their firmware bits (level 176, bank 191, entry 194, variation 199, hash 201)', () => {
    const body = synthFwBody(NG2_LAYOUT, {}, 102);
    writeBits(body, 176, 7, 107);
    writeBits(body, 185, 4, 0b1110); // OctaveShift −2, two's complement
    writeBits(body, 191, 3, 3);
    writeBits(body, 194, 5, 19);
    writeBits(body, 199, 2, 3);
    writeBits(body, 201, 32, 1885350104);
    writeBits(body, 313, 32, 1145892321); // piano B hash
    writeBits(body, 242, 4, 15);          // piano A Eq
    writeBits(body, 64, 1, 1);            // Com_kEffectsRvbChorale — the old "layerBActiveFlag" (body[8] b7)
    const p = decodeNg2(synthFwFile('ng2p', body, 102));
    expect(p.values).toMatchObject({
      'pianoA.layerLevel': 107, 'pianoA.octaveShift': -2, 'pianoA.bank': 3, 'pianoA.entry': 19,
      'pianoA.variation': 3, 'pianoA.nameHash': 1885350104, 'pianoB.nameHash': 1145892321, 'pianoA.eq': 15,
      'common.effectsRvbChorale': 1,
    });
    expect(p._rawBody[8] & 0x80).toBe(0x80);
  });

  it('round-trips the piano / synth layers, their effects and the global reverb', () => {
    const values = {
      'pianoCommon.layerEnable': 3, 'synthCommon.layerEnable': 2, 'pianoB.unison': 3, 'pianoB.dynComp': 2,
      'pianoFxA.eqTreble': -60, 'pianoFxB.dlyRate': 16383, 'synthA.smpId': 16383, 'synthA.ampEnvDcyRls': -60,
      'synthB.smpTimbre': 2, 'synthFxA.ampType': 3, 'common.effectsRvbType': 5, 'common.transposeValue': -6,
    } as const;
    expect(decodeNg2(file(values)).values).toMatchObject(values);
  });

  it('odd or short files → header-only with a warning, never a throw', () => {
    const full = file();
    for (const bytes of [full.slice(0, 44), full.slice(0, 228), new Uint8Array(10)]) {
      const p = decodeNg2(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('ng2Decoded', () => {
  it('shows the enabled layers with Grand 2 labels, per-layer effects and the global reverb', () => {
    const d = ng2Decoded(file({
      'pianoCommon.layerEnable': 0b11, 'synthCommon.layerEnable': 0b01,
      'pianoA.bank': 0, 'pianoA.layerLevel': 90, 'pianoB.bank': 2, 'pianoB.variation': 1, 'pianoB.octaveShift': -1,
      'pianoFxA.fx2Enable': 1, 'pianoFxA.fx2Type': 5, 'pianoFxA.cmpEnable': 1,
      'pianoFxA.dlyEnable': 1, 'pianoFxA.dlyFltType': 1,
      'common.effectsRvbEnable': 1, 'common.effectsRvbType': 4, 'common.effectsRvbColor': 2,
    }));
    expect(d.title).toBe('Nord Grand 2 · Program');
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO A', 'PIANO B', 'SYNTH A', 'SYNTH B', 'REVERB']);
    const [pa, pb, sa, sb, rv] = d.sections;
    expect(pa.engines[0].parts).toEqual(['Grand', 'level 90']);
    expect(pa.engines[1].parts).toEqual(['Vibe', 'Delay LP', 'Comp']);
    expect(pa.chips).toEqual(['Pedal Noise']); // firmware default: pedal noise on
    expect(pb.engines[0].parts).toEqual(['Electric', 'variation 2', 'level 127', 'Oct −1']);
    expect(pb.engines[1].parts).toEqual(['None on']);
    expect(sa.engines[0].parts).not.toContain('(off)');
    expect(sb.engines[0].parts).toContain('(off)');
    expect(sb.engines[1].parts).toEqual(['—']);
    expect(rv.engines[0].parts).toEqual(['Reverb Hall Bright']);
    expect(d.note).toMatch(/Grand 2 OS 1\.22 firmware/);
  });

  it('resolves piano names through the injected table', () => {
    const d = ng2Decoded(file({ 'pianoB.nameHash': 1770716052, 'pianoB.bank': 0 }), (h) => (h === 1770716052 ? 'Soft Grand Lrg' : undefined));
    expect(d.sections[1].engines[0].parts.slice(0, 2)).toEqual(['Soft Grand Lrg', 'Grand']);
    expect(d.header).toContainEqual(['Piano B sound id', '0x698afb94']);
  });

  it('header-only presentation for a file whose structure does not match', () => {
    const d = ng2Decoded(file().slice(0, 120));
    expect(d.sections).toEqual([]);
    expect(d.warnings?.length).toBeGreaterThan(0);
  });
});

// ── Real-corpus cross-checks (gitignored fixtures; skipped when absent) ─────────

const FIXTURE_DIR = join(__dirname, '../../../fixtures/grand-2');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.ng2p'));
const prog = (n: string) => decodeNg2(load(`BUNDLE__DW_${n}.ng2p`));
const values = (n: string) => prog(n).values;

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNg2 — fixtures', () => {
  it('decodes every fixture without warnings (the block chain tiles the 185-byte body)', () => {
    for (const name of fixtures()) {
      const p = decodeNg2(load(name));
      expect(p.layoutMatched, name).toBe(true);
      expect(p.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.02 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNg2(load(name)).version, name).toBe('1.02');
    }
  });

  // The corpus decoder read a 32-bit id at piano-block bit 28; the firmware hash is
  // bits 25-56, so hash & 0x1fffffff === old >>> 3 (29 bits shared). The top three
  // bits are the old slot's low bit + old variation where those were pinned
  // (Clavish-A: slot 24, var 3 → 0b011), and in every case they are the only
  // choice that resolves in the piano-name table:
  //   Lazy-A                  0x40a12a7b → 1209279823 "White Grand XL"
  //   Clavish-A / Untitled-A  0x830146c3 → 1885350104 "DigiGrand 2 Sml"
  //   Kentucky-A / Thursday-B 0x4c57dca3 → 1770716052 "Soft Grand Lrg"
  //   Griti-B / Concerto-B    0x22676f0b → 1145892321 "EP1 Deep Timbre Lrg"
  it('reads the piano name hash at piano-block bit 25', () => {
    const expected: [string, 'A' | 'B', number][] = [
      ['Lazy_River', 'A', 1209279823], ['Clavish', 'A', 1885350104], ['Untitled', 'A', 1885350104],
      ['Kentucky', 'A', 1770716052], ['Thursday', 'B', 1770716052],
      ['Griti_Tines', 'B', 1145892321], ['Concerto', 'B', 1145892321],
    ];
    for (const [n, layer, hash] of expected) expect(values(n)[`piano${layer}.nameHash`], `${n} ${layer}`).toBe(hash);
  });

  it('body[101]/[122] is not the piano reference (same piano, different byte)', () => {
    const clavish = prog('Clavish');
    const untitled = prog('Untitled');
    expect(clavish.values['pianoA.nameHash']).toBe(untitled.values['pianoA.nameHash']);
    expect(clavish._rawBody[101]).not.toBe(untitled._rawBody[101]); // 14 vs 12 — inside SynA
  });

  // Values below are re-derived from the corpus-era expectations, bit for bit:
  // each firmware field is fully covered by previously pinned old fields.
  it('decodes piano-layer fields from the bits the old map had pinned', () => {
    // Acid-B: old on=1 + volume 86 → LayerLevel 0b1101011; old slot 17 → Variation 0.
    expect(values('Acid_Piano')).toMatchObject({ 'pianoB.layerLevel': 107, 'pianoB.variation': 0 });
    // Duet-B: old on=0 + volume 100 → LayerLevel 50; old slot 9 → Variation 0.
    expect(values('Duet')).toMatchObject({ 'pianoB.layerLevel': 50, 'pianoB.variation': 0 });
    // Clavish-A: old slot 24 → Variation 0. Clavish-B: old pstick+susPedal → Bank 0b?11 = 3 (Clavinet).
    expect(values('Clavish')).toMatchObject({ 'pianoA.variation': 0, 'pianoB.bank': 3, 'pianoB.variation': 3 });
    // Stacked-B: old touch 1 / unison 2 / dynComp 2 / timbre 4 → DynComp 3, Eq 5.
    expect(values('Stacked')).toMatchObject({ 'pianoB.dynComp': 3, 'pianoB.eq': 5 });
    // Wavey-A: old pedalNoise 1 / touch 1 / unison 2 → Unison 2, DynComp 3.
    expect(values('Wavey')).toMatchObject({ 'pianoA.unison': 2, 'pianoA.dynComp': 3 });
  });

  it('every field stays inside its firmware range across the corpus', () => {
    for (const name of fixtures()) {
      expect(decodeNg2(load(name)).warnings.filter((w) => /outside the firmware/.test(w)), name).toEqual([]);
    }
  });
});
