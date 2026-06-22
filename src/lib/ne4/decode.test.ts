import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe4 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.ne4p'));

describe('decodeNe4', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNe4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.03 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNe4(load(name)).version, name).toBe('1.03');
    }
  });

  it('exposes correctly-sized clusters (backward compat)', () => {
    const prog = decodeNe4(load(fixtures()[0]));
    expect(prog._clusterA).toHaveLength(6);
    expect(prog._clusterB).toHaveLength(9);
    expect(prog._clusterC).toHaveLength(13);
    expect(prog._tail).toHaveLength(4);
  });

  it('exposes correctly-sized new fields', () => {
    const prog = decodeNe4(load(fixtures()[0]));
    expect(prog._organSection).toHaveLength(9);
    expect(prog._sampleSection).toHaveLength(13);
    expect(prog._tail23).toHaveLength(2);
  });

  describe('upper drawbars (confirmed — corpus RE 2026-06-22)', () => {
    it('decodes "Infectd Square 1 FS" as 888000000', () => {
      const prog = decodeNe4(load('Infectd Square 1 FS.ne4p'));
      expect(prog.organ.upper.bars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    });

    it('decodes "Freddie Smith Nord Samples" as 888800000', () => {
      const prog = decodeNe4(load('Freddie Smith Nord Samples.ne4p'));
      expect(prog.organ.upper.bars).toEqual([8, 8, 8, 8, 0, 0, 0, 0, 0]);
    });

    it('returns exactly 9 drawbar values for every fixture', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog.organ.upper.bars, name).toHaveLength(9);
      }
    });

    it('all drawbar values are in range 0-8 for every fixture', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        for (const bar of prog.organ.upper.bars) {
          expect(bar, `${name} bar value`).toBeGreaterThanOrEqual(0);
          expect(bar, `${name} bar value`).toBeLessThanOrEqual(8);
        }
      }
    });

    it('exposes _extraNibs as a 3-tuple', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog.organ._extraNibs, name).toHaveLength(3);
      }
    });
  });

  describe('tail bytes', () => {
    it('_tail0 and _tail1 low nibble is always 0 or 8 (bit-3 flag pattern)', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        const lo0 = prog._tail0 & 0xf;
        const lo1 = prog._tail1 & 0xf;
        expect([0, 8], `${name} _tail0 lo nibble`).toContain(lo0);
        expect([0, 8], `${name} _tail1 lo nibble`).toContain(lo1);
      }
    });

    it('_tail and _tail0/_tail1/_tail23 are consistent', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog._tail[0], `${name} _tail[0] = _tail0`).toBe(prog._tail0);
        expect(prog._tail[1], `${name} _tail[1] = _tail1`).toBe(prog._tail1);
        expect(prog._tail[2], `${name} _tail[2] = _tail23[0]`).toBe(prog._tail23[0]);
        expect(prog._tail[3], `${name} _tail[3] = _tail23[1]`).toBe(prog._tail23[1]);
      }
    });
  });

  describe('_organSection and _sampleSection aliases', () => {
    it('_organSection bytes match _clusterB bytes', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(Array.from(prog._organSection), name).toEqual(Array.from(prog._clusterB));
      }
    });

    it('_sampleSection bytes match _clusterC bytes', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(Array.from(prog._sampleSection), name).toEqual(Array.from(prog._clusterC));
      }
    });
  });
});
