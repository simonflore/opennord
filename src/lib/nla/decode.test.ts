/**
 * NLA decoder tests.
 *
 * 1. Synthetic records built from the program map (Lead A1 OS 1.36
 *    descriptors, via layout.generated.ts) — always run.
 * 2. Cross-checks against the 51 real .nlas fixtures (gitignored; skipped when
 *    absent). The old "header nibble", "layerOn + volume" and section-size
 *    expectations encoded the 0x2C base and are restated in firmware terms.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNla } from './decode';
import { nlaDecoded } from './present';
import { NLA_LAYOUT, NLA_PERF_LAYOUT, type NlaFieldKey } from './layout.generated';
import { synthLegacyFile, writeLegacyRecord } from '../clavia/block-chain.synth';

const field = (key: NlaFieldKey) => NLA_LAYOUT.fields.find((f) => f.key === key)!;

function nlas(values: Partial<Record<NlaFieldKey, number>> = {}): Uint8Array {
  const data = new Uint8Array(NLA_LAYOUT.dataBytes);
  writeLegacyRecord(data, NLA_LAYOUT, values);
  return synthLegacyFile('nlas', 7, data);
}

describe('NLA firmware layout', () => {
  it('is a 95-byte record whose param 14 (CC 33) sits at data bits 148-154', () => {
    expect(NLA_LAYOUT).toMatchObject({ dataBytes: 95, recordVersion: 7 });
    expect(field('slot.param14')).toMatchObject({ name: 'param 14 (CC 33)', bit: 148, width: 7, max: 102, cc: 33 });
    // Data bit 148 = file 0x2C bit 4: the old "layerOn" bit and top of "volume".
    expect(0x1a * 8 + 148).toBe(0x2c * 8 + 4);
  });

  it("puts each two's-complement morph delta (one bit wider) before its parameter", () => {
    const base = field('slot.param2');
    const deltas = NLA_LAYOUT.fields.filter((f) => f.deltaOf === 'slot.param2');
    expect(deltas.map((d) => d.key)).toEqual(['slot.param2MorphDeltaSrc0', 'slot.param2MorphDeltaSrc1']);
    for (const d of deltas) {
      expect(d).toMatchObject({ width: base.width + 1, enc: 'twos', min: -127, max: 127 });
      expect(d.bit).toBeLessThan(base.bit);
    }
    // Every other field is raw with minimum 0.
    for (const f of NLA_LAYOUT.fields.filter((x) => !x.deltaOf)) expect([f.enc, f.min], f.key).toEqual(['u', 0]);
  });
});

describe('decodeNla (synthetic, firmware layout)', () => {
  it('reads parameters and signed inline morph deltas from file 0x1A', () => {
    const p = decodeNla(nlas({
      'slot.param14': 77, 'slot.param5': 100, 'slot.param5MorphDeltaSrc0': -30, 'slot.param5MorphDeltaSrc1': 12,
      'fx.param16': 3,
    }));
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ recordVersion: 7, version: '0.07' });
    expect(p.values).toMatchObject({ 'slot.param14': 77, 'slot.param5': 100, 'fx.param16': 3 });
    expect(p.morphDeltas['slot.param5']).toEqual([-30, 12]);
    expect(p.morphDeltas['fx.param3']).toEqual([0]); // FX deltas: one source
    expect(p.outOfRange).toEqual([]);
    expect(p._data).toHaveLength(95);
  });

  it('flags values above their descriptor max', () => {
    expect(decodeNla(nlas({ 'slot.param14': 120 })).outOfRange).toEqual(['slot.param14']);
  });

  it('reads an .nlap: performance common, then slot A at data byte 19', () => {
    const data = new Uint8Array(399);
    writeLegacyRecord(data, NLA_PERF_LAYOUT, { 'perf.param2': 120 });
    writeLegacyRecord(data, NLA_LAYOUT, { 'slot.param0': 4 }, 19);
    const p = decodeNla(synthLegacyFile('nlap', 7, data));
    expect(p.performance?.['perf.param2']).toBe(120);
    expect(p.values['slot.param0']).toBe(4);
    expect(nlaDecoded(synthLegacyFile('nlap', 7, data)).title).toContain('Performance');
  });

  it('warns on truncated or mis-sized files and presents the morph count', () => {
    expect(decodeNla(new Uint8Array(5)).warnings.length).toBeGreaterThan(0);
    expect(decodeNla(synthLegacyFile('nlas', 7, new Uint8Array(113))).warnings.join(' ')).toContain('123');
    const d = nlaDecoded(nlas({ 'slot.param8MorphDeltaSrc1': 5 }));
    expect(d.sections[0].engines[0].parts).toEqual(['1 control']);
    expect(nlaDecoded(nlas()).sections[0].engines[0].parts).toEqual(['none']);
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/lead-a1');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.nlas'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNla (fixtures)', () => {
  it('decodes every 123-byte fixture without warnings', () => {
    for (const name of fixtures()) {
      const file = load(name);
      // 123 bytes, or 141 behind an NSM-era header (record at 0x2C, no trailer).
      const prog = decodeNla(file);
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads record version 7 ("0.07") from all fixtures', () => {
    for (const name of fixtures()) {
      const prog = decodeNla(load(name));
      expect(prog.version, name).toBe('0.07');
      expect(prog.recordVersion, name).toBe(7);
    }
  });

  it('param 14 (CC 33; was "layerOn + volume") stays within its descriptor max and varies', () => {
    const vals = new Set<number>();
    for (const name of fixtures()) {
      const v = decodeNla(load(name)).values['slot.param14'] ?? -1;
      expect(v, name).toBeLessThanOrEqual(102);
      vals.add(v);
    }
    expect(vals.size).toBeGreaterThan(1);
  });

  it('the old constant-0 "header nibble" is params 12 + 13 at their firmware positions', () => {
    for (const name of fixtures()) {
      const v = decodeNla(load(name)).values;
      expect(((v['slot.param12'] ?? -1) << 3) | (v['slot.param13'] ?? -1), name).toBe(0);
    }
  });

  it('reads a near-unique 16-bit checksum (50/51 distinct)', () => {
    const seen = new Set<number>();
    for (const name of fixtures()) {
      const prog = decodeNla(load(name));
      expect(prog.checksum, name).toBeGreaterThanOrEqual(0);
      expect(prog.checksum, name).toBeLessThanOrEqual(0xffff);
      seen.add(prog.checksum);
    }
    expect(seen.size).toBeGreaterThanOrEqual(fixtures().length - 1);
  });
});
