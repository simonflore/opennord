/**
 * C2D decoder tests: synthetic records built from the firmware layout (C2D OS
 * 1.12 container list, via layout.generated.ts) — always run — plus a check
 * against real `.nc2p` files when the gitignored corpus (`fixtures/c2d`) is
 * present: under the right alignment no value exceeds its descriptor range.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNc2 } from './decode';
import { nc2Decoded } from './present';
import { NC2_LAYOUT, type Nc2FieldKey } from './layout.generated';
import { synthLegacyLayoutFile, writeBits } from '../clavia/block-chain.synth';

const nc2p = (values: Partial<Record<Nc2FieldKey, number>> = {}, version = 100) =>
  synthLegacyLayoutFile('nc2p', NC2_LAYOUT, values, { version });
const field = (key: Nc2FieldKey) => NC2_LAYOUT.fields.find((f) => f.key === key)!;

describe('C2D firmware layout', () => {
  it('is a 345-byte record at file 0x1A making a 373-byte file, version 100', () => {
    expect(NC2_LAYOUT).toMatchObject({ dataBytes: 345, recordVersion: 100 });
    expect(nc2p()).toHaveLength(373);
  });

  it('stores 72 repeated-container values that point at their first copy', () => {
    const copies = NC2_LAYOUT.fields.filter((f) => f.copyOf);
    expect(copies).toHaveLength(72); // (B3 + Vox + Farfisa + pipe) × 2 manuals × 9
    for (const f of copies) {
      const first = field(f.copyOf!);
      expect([f.width, f.max, f.def], f.key).toEqual([first.width, first.max, first.def]);
      expect(f.bit).toBeGreaterThan(first.bit);
    }
  });

  it('stores every value raw with minimum 0, without overlaps', () => {
    const used = new Set<number>();
    for (const f of NC2_LAYOUT.fields) {
      expect([f.enc, f.min], f.key).toEqual(['u', 0]);
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
    }
  });
});

describe('decodeNc2 (synthetic, firmware layout)', () => {
  it('decodes the default record: B3 drawbars 888000000 on both manuals', () => {
    const p = decodeNc2(nc2p());
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ parsed: true, recordVersion: 100, version: '1.00', complete: true });
    expect(p.manuals[0].b3Drawbars).toHaveLength(4);
    expect(p.manuals[1].b3Drawbars[3]).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(p.pedalDrawbars).toEqual([8, 0]);
    expect(p._data).toHaveLength(345);
  });

  it('reads drawbars, pedal drawbars and effect switches', () => {
    const p = decodeNc2(nc2p({
      'b3Drawbars0_0.param3': 6, 'b3Drawbars1_2.param8': 2, 'pedalADrawbars0.param1': 5,
      'fxSwitch2.param0': 1, 'fxSwitch2.param3': 1,
    }));
    expect(p.manuals[0].b3Drawbars[0]).toEqual([8, 8, 8, 6, 0, 0, 0, 0, 0]);
    expect(p.manuals[1].b3Drawbars[2][8]).toBe(2);
    expect(p.pedalDrawbars).toEqual([8, 5]);
    expect(p.effectSwitches[2]).toEqual([1, 0, 0, 1]);
  });

  it('lets the second copy of a repeated container win, as the firmware reader does', () => {
    const file = nc2p({ 'b3Drawbars0_3.param0': 3 });
    expect(decodeNc2(file).manuals[0].b3Drawbars[3][0]).toBe(3); // the writer stores it twice
    writeBits(file, 0x1a * 8 + field('b3Drawbars0_3dup.param0').bit, 4, 7);
    const p = decodeNc2(file);
    expect(p.manuals[0].b3Drawbars[3][0]).toBe(7);
    expect(p.values['b3Drawbars0_3.param0']).toBe(7);
  });

  it('flags out-of-range values and other record versions; never throws', () => {
    expect(decodeNc2(nc2p({ 'b3Drawbars0_0.param0': 9 })).outOfRange).toEqual(['b3Drawbars0_0.param0']);
    expect(decodeNc2(nc2p({}, 101)).warnings.join(' ')).toContain('Record version 101');
    expect(decodeNc2(new Uint8Array(30)).complete).toBe(false);
    expect(decodeNc2(new Uint8Array(0)).parsed).toBe(true);
  });
});

describe('nc2Decoded', () => {
  it('shows each manual’s first B3 set, the pedal drawbars and the effect switches', () => {
    const d = nc2Decoded(nc2p({ 'b3Drawbars1_0.param8': 4, 'fxSwitch0.param1': 1 }));
    expect(d.title).toBe('Nord C2D · Program');
    expect(d.sections.map((s) => s.id)).toEqual(['M1', 'M2', 'PD', 'FX']);
    expect(d.sections[1].engines[0].parts).toEqual(['set 1', '8 8 8 0 0 0 0 0 4']);
    expect(d.sections[1].drawbars).toHaveLength(9);
    expect(d.sections[3].engines[0].parts[0]).toBe('set 1: 1 of 4 on');
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/c2d');

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNc2 (fixtures)', () => {
  it('reads every real .nc2p with no value outside its descriptor range', () => {
    for (const name of readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.nc2p'))) {
      const p = decodeNc2(new Uint8Array(readFileSync(join(FIXTURE_DIR, name))));
      expect(p.complete, name).toBe(true);
      expect(p.outOfRange, name).toEqual([]);
    }
  });
});
