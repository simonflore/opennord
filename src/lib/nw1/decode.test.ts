/**
 * Nord Wave decoder tests.
 *
 * 1. Synthetic records built from the program map (Wave OS 2.14
 *    descriptors, via layout.generated.ts) — always run.
 * 2. The 1,018-file corpus (gitignored; skipped when absent). Its checks are
 *    the alignment test the maintainers’ notes asks for — under the right
 *    alignment no stored value exceeds its descriptor range — plus the earlier
 *    corpus reader's findings restated in firmware terms: the 350-byte size,
 *    the CRC trailer, the +140 slot stride and the old `oscSelect` byte.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNw1 } from './decode';
import { nw1Decoded } from './present';
import { NW1_LAYOUT, type Nw1FieldKey } from './layout.generated';
import { synthLegacyLayoutFile } from '../clavia/block-chain.synth';
import { verifyTrailerChecksum } from '../clavia/crc16';

const nwp = (values: Partial<Record<Nw1FieldKey, number>> = {}, version = 8) =>
  synthLegacyLayoutFile('nwp', NW1_LAYOUT, values, { version });
const field = (key: Nw1FieldKey) => NW1_LAYOUT.fields.find((f) => f.key === key)!;

describe('Wave firmware layout', () => {
  it('is a u8-versioned record: data at file 0x19, 321 bytes + 2 pad, 350-byte file', () => {
    expect(NW1_LAYOUT).toMatchObject({ recordVersion: 8, versionBytes: 1, dataBytes: 321, padBytes: 2 });
    const file = nwp();
    expect(file).toHaveLength(350);
    expect(file[0x18]).toBe(8);
    expect(verifyTrailerChecksum(file)).toBe(true);
  });

  it('puts slot A at file 0x2C (+4 bits) and slot B 140 bytes later', () => {
    const a = field('slotA.param0').bit;
    expect(0x19 * 8 + a).toBe(0x2c * 8 + 4);
    for (const f of NW1_LAYOUT.fields.filter((x) => x.key.startsWith('slotA.'))) {
      const b = field(f.key.replace('slotA.', 'slotB.') as Nw1FieldKey);
      expect(b.bit - f.bit, f.key).toBe(140 * 8);
      expect([b.width, b.max, b.def, b.cc]).toEqual([f.width, f.max, f.def, f.cc]);
    }
  });

  it('stores three signed 8-bit deltas in front of each morphable value, 26 per slot and one in common', () => {
    const deltas = NW1_LAYOUT.fields.filter((f) => f.deltaOf);
    expect(deltas).toHaveLength(3 * 53);
    expect(deltas.filter((f) => f.key.startsWith('slotA.'))).toHaveLength(3 * 26);
    for (const d of deltas) {
      const base = field(d.deltaOf!);
      expect(d.width, d.key).toBe(8);
      expect(d.enc).toBe('twos');
      expect([d.min, d.max]).toEqual([-(base.max - base.min), base.max - base.min]);
      expect(d.bit).toBeLessThan(base.bit);
    }
    const used = new Set<number>();
    for (const f of NW1_LAYOUT.fields) {
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
  });
});

describe('decodeNw1 (synthetic, firmware layout)', () => {
  it('decodes the default record', () => {
    const p = decodeNw1(nwp());
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ parsed: true, recordVersion: 8, version: '0.08', complete: true });
    expect(p.slot1.params).toHaveLength(56);
    expect(p.slot1.params[0]).toBe(2); // descriptor default
    expect(p.global.params).toHaveLength(8);
    expect(p.common.params[2]).toBe(32768);
    expect(Object.keys(p.slot1.morphs)).toHaveLength(26);
    expect(p._data).toHaveLength(323);
  });

  it('reads slot values and morph deltas, slot B independently of slot A', () => {
    const p = decodeNw1(nwp({
      'slotA.param7': 100, 'slotA.param7MorphDeltaSrc5': -20, 'slotA.param7MorphDeltaSrc6': 27,
      'slotB.param0': 4, 'common.param5MorphDeltaSrc0': -64,
    }));
    expect(p.slot1.params[7]).toBe(100);
    expect(p.slot1.morphs[7]).toEqual([0, -20, 27]);
    expect(p.morphDeltas['slotA.param7']).toEqual([0, -20, 27]);
    expect(p.slot2.params[0]).toBe(4);
    expect(p.slot2.morphs[7]).toEqual([0, 0, 0]);
    expect(p.common.morphs[5]).toEqual([-64, 0, 0]);
  });

  it('the earlier reader’s oscSelect byte (file 0x2C) is 2 · slot A param 0 + the top bit of param 1', () => {
    const file = nwp({ 'slotA.param0': 3, 'slotA.param1': 2 });
    expect(file[0x2c] & 0x0f).toBe(2 * 3 + 1);
  });

  it('converts versions 6 and 7 as the firmware does: global 7 (v6), and Osc / LFO / Mod Env resets per slot', () => {
    // Slot A: Osc 1 on waveform 4, sync off → Osc 1 Shape and its morphs 0; LFO 1 Dest 2 with Osc 2
    // not on 4/5 → Dest 3; LFO 2 Dest 1 → LFO 2 Amount and morphs 0.
    // Slot B: Osc 2 on waveform 5 → Osc 2 Shape and morphs 0; LFO 1 Dest 2 with Osc 1 not on 4/5 → 1;
    // Mod Env Dest 1 → Mod Env Amount 64, morphs 0.
    const values: Partial<Record<Nw1FieldKey, number>> = {
      'global.param7': 70,
      'slotA.param19': 4, 'slotA.param33': 0, 'slotA.param23': 90, 'slotA.param23MorphDeltaSrc5': -9,
      'slotA.param5': 2, 'slotA.param24': 1, 'slotA.param10': 1, 'slotA.param13': 50, 'slotA.param13MorphDeltaSrc0': 12,
      'slotA.param8': 33,
      'slotB.param19': 0, 'slotB.param24': 5, 'slotB.param32': 77, 'slotB.param32MorphDeltaSrc6': 3,
      'slotB.param5': 2, 'slotB.param17': 1, 'slotB.param16': 10, 'slotB.param16MorphDeltaSrc0': -5, 'slotB.param13': 40,
    };
    const v6 = decodeNw1(nwp(values, 6));
    expect(v6.values).toMatchObject({
      'global.param7': 40,
      'slotA.param23': 0, 'slotA.param23MorphDeltaSrc5': 0, 'slotA.param5': 3, 'slotA.param8': 33,
      'slotA.param13': 0, 'slotA.param13MorphDeltaSrc0': 0,
      'slotB.param32': 0, 'slotB.param32MorphDeltaSrc6': 0, 'slotB.param5': 1,
      'slotB.param16': 64, 'slotB.param16MorphDeltaSrc0': 0, 'slotB.param13': 40,
    });
    expect(v6.warnings.join(' ')).toMatch(/version 6.*converts it the same way/);
    expect(decodeNw1(nwp(values, 7)).values['global.param7']).toBe(70); // version 6 only
    expect(decodeNw1(nwp(values, 8)).values).toMatchObject({ 'slotA.param23': 90, 'slotB.param5': 2 }); // as stored
    // Both oscillators on 4/5 with LFO 1 Dest 2: LFO 1 Amount 0, morphs kept; then LFO 1 Dest 3 → LFO 2 Amount 0.
    const both = decodeNw1(nwp({
      'slotA.param19': 5, 'slotA.param24': 4, 'slotA.param5': 2, 'slotA.param8': 20, 'slotA.param8MorphDeltaSrc0': 7,
    }, 7)).values;
    expect(both).toMatchObject({ 'slotA.param8': 0, 'slotA.param8MorphDeltaSrc0': 7, 'slotA.param5': 2 });
  });

  it('notes the record versions the firmware converts; flags others and out-of-range values', () => {
    expect(decodeNw1(nwp({}, 7)).warnings.join(' ')).toContain('converts');
    expect(decodeNw1(nwp({}, 9)).warnings.join(' ')).toContain('Record version 9');
    expect(decodeNw1(nwp({ 'slotA.param30': 60 })).outOfRange).toEqual(['slotA.param30']);
    expect(decodeNw1(new Uint8Array(30)).complete).toBe(false);
    expect(decodeNw1(new Uint8Array(0)).parsed).toBe(true);
  });
});

describe('nw1Decoded', () => {
  it('counts the morphed controls per slot and spots a repeated slot', () => {
    const d = nw1Decoded(nwp({ 'slotA.param7MorphDeltaSrc0': 5, 'slotA.param8MorphDeltaSrc6': -1 }));
    expect(d.title).toBe('Nord Wave · Program');
    expect(d.sections.map((s) => [s.id, s.engines[0].parts[0]])).toEqual([['A', '2 controls'], ['B', 'none']]);
    expect(d.sections[1].chips).toBeUndefined();
    expect(nw1Decoded(nwp()).sections[1].chips).toEqual(['Same as slot A']);
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/wave');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.nwp'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNw1 (fixtures)', () => {
  it('reads every version-8 file with no value outside its descriptor range (the alignment test)', () => {
    for (const name of fixtures()) {
      const file = load(name);
      const p = decodeNw1(file);
      expect(p.complete, name).toBe(true);
      expect(file, name).toHaveLength(350);
      expect(verifyTrailerChecksum(file), name).toBe(true);
      if (p.recordVersion === 8) expect(p.outOfRange, name).toEqual([]);
    }
  });

  it('keeps the earlier corpus findings: oscSelect byte and the +140 slot stride', () => {
    let identical = 0;
    for (const name of fixtures().slice(0, 200)) {
      const file = load(name);
      const p = decodeNw1(file);
      const [a0, a1] = [p.slot1.params[0]!, p.slot1.params[1]!];
      expect(file[0x2c] & 0x0f, name).toBe(2 * a0 + (a1 >> 1));
      if (p.slot1.params.every((v, i) => v === p.slot2.params[i])) identical++;
    }
    expect(identical).toBeGreaterThan(0); // 199/1018 files repeat slot A in slot B
  });
});
