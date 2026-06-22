import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe5 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-5');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.ne5p'));

describe('decodeNe5', () => {
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
    // _organSection replaces former _clusterB (body[17-33], 17 bytes)
    expect(prog._organSection).toHaveLength(17);
    // _sampleRefHash: body[7-12], 6 bytes
    expect(prog._sampleRefHash).toHaveLength(6);
    // _extraNibbleGroup: body[71-74], 4 bytes
    expect(prog._extraNibbleGroup).toHaveLength(4);
    // _clusterC: body[83-97], 15 bytes (sample reference block)
    expect(prog._clusterC).toHaveLength(15);
    // _checksum: body[101-102], 2 bytes
    expect(prog._checksum).toHaveLength(2);
  });

  it('organ drawbar region contains valid nibble values (0-8) throughout', () => {
    for (const name of fixtures()) {
      const { organ } = decodeNe5(load(name));
      // Check all five drawbar sets (upper/lower/pedal/upperAlt/lowerAlt)
      for (const set of [organ.upper, organ.lower, organ.pedal, organ.upperAlt, organ.lowerAlt]) {
        for (const bar of set.bars) {
          expect(bar, `${name} drawbar value ${bar}`).toBeGreaterThanOrEqual(0);
          expect(bar, `${name} drawbar value ${bar}`).toBeLessThanOrEqual(8);
        }
        expect(set.bars, name).toHaveLength(9);
      }
    }
  });

  // --- Confirmed field: upperDrawbarsB (body[39-43]) ---

  it('organ.upper default is [8,8,8,8,0,0,0,0,0] for most sample presets', () => {
    const DEFAULT = [8, 8, 8, 8, 0, 0, 0, 0, 0];
    let defaultCount = 0;
    for (const name of fixtures()) {
      const prog = decodeNe5(load(name));
      if (prog.organ.upper.bars.join(',') === DEFAULT.join(',')) defaultCount++;
    }
    // 11/13 fixtures have this default (only VCS3 Organ and Walk of Life differ)
    expect(defaultCount).toBeGreaterThanOrEqual(10);
  });

  it('organ.lower default is [8,8,8,8,0,0,0,0,0] for most sample presets', () => {
    const DEFAULT = [8, 8, 8, 8, 0, 0, 0, 0, 0];
    let defaultCount = 0;
    for (const name of fixtures()) {
      const prog = decodeNe5(load(name));
      if (prog.organ.lower.bars.join(',') === DEFAULT.join(',')) defaultCount++;
    }
    expect(defaultCount).toBeGreaterThanOrEqual(10);
  });

  // --- Confirmed field: lowerDrawbarsB (body[45-49]) ---

  it('organ.lower trailing nibble is a small integer (0-15)', () => {
    for (const name of fixtures()) {
      const prog = decodeNe5(load(name));
      expect(prog.organ.lower._trailing).toBeGreaterThanOrEqual(0);
      expect(prog.organ.lower._trailing).toBeLessThanOrEqual(15);
    }
  });

  // --- Candidate field: programTypeFlags ---

  it('programTypeFlags is a valid uint8', () => {
    for (const name of fixtures()) {
      const { programTypeFlags } = decodeNe5(load(name));
      expect(programTypeFlags).toBeGreaterThanOrEqual(0);
      expect(programTypeFlags).toBeLessThanOrEqual(255);
    }
  });

  it('programTypeFlags has at least 5 unique values across the corpus', () => {
    const values = new Set(fixtures().map(n => decodeNe5(load(n)).programTypeFlags));
    // Analysis found 9 unique values; we assert conservatively (≥5) in case corpus changes
    expect(values.size).toBeGreaterThanOrEqual(5);
  });

  // --- Candidate field: pedal drawbars ---

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
      expect(typeof prog.flagByte13).toBe('number');
      expect(typeof prog.sectionFlags17).toBe('number');
      expect(typeof prog.flagByte19).toBe('number');
    }
  });
});
