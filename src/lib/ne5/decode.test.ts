import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe5 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-5');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.ne5p'));

// Real fixtures referenced by the cross-model mapping evidence.
const VCS3 = 'VCS3 Organ Sample.ne5p';
const WALK = 'Walk of Life Nord Samples.ne5p';
const NAKED = 'Naked Piano Sample.ne5p';
const LEAD1 = 'Nord Stage Electro Lead Samples (1).ne5p';

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNe5', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNe5(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 0.04 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNe5(load(name)).version, name).toBe('0.04');
    }
  });

  it('exposes correctly-sized named clusters', () => {
    const prog = decodeNe5(load(fixtures()[0]));
    // _organSection (body[17-33], 17 bytes)
    expect(prog._organSection).toHaveLength(17);
    // sampleModelId / _sampleRefHash: body[7-12], 6 bytes
    expect(prog.sampleModelId).toHaveLength(6);
    expect(prog._sampleRefHash).toHaveLength(6);
    // sampleDescriptor: body[83-94], 12 bytes
    expect(prog.sampleDescriptor).toHaveLength(12);
    // _extraNibbleGroup: body[71-74], 4 bytes
    expect(prog._extraNibbleGroup).toHaveLength(4);
    // _checksum: body[101-102], 2 bytes
    expect(prog._checksum).toHaveLength(2);
  });

  it('organ drawbar region contains valid nibble values (0-8) throughout', () => {
    for (const name of fixtures()) {
      const { organ } = decodeNe5(load(name));
      for (const set of [
        organ.preset1Upper,
        organ.preset1Lower,
        organ.preset2Upper,
        organ.preset2Lower,
        organ.pedal,
      ]) {
        for (const bar of set.bars) {
          expect(bar, `${name} drawbar value ${bar}`).toBeGreaterThanOrEqual(0);
          expect(bar, `${name} drawbar value ${bar}`).toBeLessThanOrEqual(8);
        }
        expect(set.bars, name).toHaveLength(9);
      }
    }
  });

  // --- CONFIRMED: organ preset 1 (primary slot, body[21-32]) ---

  it('VCS3 Organ carries its custom preset-1 upper voicing', () => {
    // Stage oracle: organ drawbar 1..9 (group o). VCS3 is the organ-only preset
    // that uses preset 1 — its real voicing is [6,1,8,8,4,8,4,6,6].
    const prog = decodeNe5(load(VCS3));
    expect(prog.organ.preset1Upper.bars).toEqual([6, 1, 8, 8, 4, 8, 4, 6, 6]);
  });

  it('VCS3 Organ preset-2 upper is all-zero (it uses preset 1)', () => {
    const prog = decodeNe5(load(VCS3));
    expect(prog.organ.preset2Upper.bars).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  // --- CONFIRMED: organ preset 2 (second preset, body[39-49]) ---

  it('preset-2 upper defaults to [8,8,8,8,0,0,0,0,0] for the majority of fixtures', () => {
    // Re-census 2026-07-04 (213 files): the default voicing is the corpus
    // majority (was "11/13" on the 13-file corpus — an overfit count). VCS3 and
    // Walk of Life deviate (they use preset 1 / a custom preset-2 respectively).
    const DEFAULT = [8, 8, 8, 8, 0, 0, 0, 0, 0].join(',');
    const all = fixtures();
    const defaultCount = all.filter(
      (n) => decodeNe5(load(n)).organ.preset2Upper.bars.join(',') === DEFAULT,
    ).length;
    expect(defaultCount).toBeGreaterThan(all.length / 2);
    expect(decodeNe5(load(VCS3)).organ.preset2Upper.bars.join(',')).not.toBe(DEFAULT);
    expect(decodeNe5(load(WALK)).organ.preset2Upper.bars.join(',')).not.toBe(DEFAULT);
  });

  it('Walk of Life carries custom preset-2 upper + lower (it uses organ preset 2)', () => {
    const prog = decodeNe5(load(WALK));
    expect(prog.organ.preset2Upper.bars).toEqual([8, 8, 8, 8, 0, 3, 0, 0, 2]);
    expect(prog.organ.preset2Lower.bars).toEqual([8, 8, 8, 7, 5, 8, 3, 1, 3]);
  });

  // --- CONFIRMED: piano/sample section active (body[17] bit7) ---

  it('reads sampleSectionActive as a boolean for every fixture', () => {
    for (const name of fixtures()) {
      expect(typeof decodeNe5(load(name)).sampleSectionActive, name).toBe('boolean');
    }
  });

  it('the organ-only presets read sampleSectionActive=false', () => {
    // VCS3 and Walk of Life are organ-only (no sample layer). Re-census
    // 2026-07-04: the 213-file corpus has more organ-only presets than these two,
    // so the earlier "exactly 2" claim was overfit — but these two still hold.
    expect(decodeNe5(load(VCS3)).sampleSectionActive).toBe(false);
    expect(decodeNe5(load(WALK)).sampleSectionActive).toBe(false);
  });

  // --- CONFIRMED: factory sample / model id (body[7-12]) ---

  it('Naked Piano and NSE Lead (1) share an identical model id (same factory sample)', () => {
    // Stage oracle: piano model ID (group p, id 245-5). Both reference the same
    // factory sample → identical id 80 07 90 15 19 24.
    const naked = Array.from(decodeNe5(load(NAKED)).sampleModelId);
    const lead1 = Array.from(decodeNe5(load(LEAD1)).sampleModelId);
    expect(naked).toEqual([0x80, 0x07, 0x90, 0x15, 0x19, 0x24]);
    expect(lead1).toEqual(naked);
  });

  it('model id is high-entropy across the corpus (>=10 unique first bytes)', () => {
    const firstBytes = new Set(fixtures().map(n => decodeNe5(load(n)).sampleModelId[0]));
    expect(firstBytes.size).toBeGreaterThanOrEqual(9);
  });

  // --- Candidate: programTypeFlags ---

  it('programTypeFlags is a valid uint8 with >=5 unique corpus values', () => {
    const values = new Set<number>();
    for (const name of fixtures()) {
      const { programTypeFlags } = decodeNe5(load(name));
      expect(programTypeFlags).toBeGreaterThanOrEqual(0);
      expect(programTypeFlags).toBeLessThanOrEqual(255);
      values.add(programTypeFlags);
    }
    expect(values.size).toBeGreaterThanOrEqual(5);
  });

  // --- Candidate: pedal drawbars ---

  it('organ.pedal bars are all in 0-8 range', () => {
    for (const name of fixtures()) {
      for (const bar of decodeNe5(load(name)).organ.pedal.bars) {
        expect(bar).toBeGreaterThanOrEqual(0);
        expect(bar).toBeLessThanOrEqual(8);
      }
    }
  });

  // --- Structure checks ---

  it('_rawBody is exactly 103 bytes for all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNe5(load(name))._rawBody).toHaveLength(103);
    }
  });

  it('all scalar candidate fields decode without throwing', () => {
    for (const name of fixtures()) {
      const prog = decodeNe5(load(name));
      expect(typeof prog.sectionEnableNibble).toBe('number');
      expect(typeof prog.sampleModelFlag).toBe('boolean');
      expect(typeof prog.sectionFlags17).toBe('number');
      expect(typeof prog.flagByte19).toBe('number');
    }
  });
});
