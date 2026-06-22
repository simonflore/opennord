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

  describe('active organ drawbars (confirmed — corpus RE 2026-06-22)', () => {
    it('decodes "Infectd Square 1 FS" as 888000000', () => {
      const prog = decodeNe4(load('Infectd Square 1 FS.ne4p'));
      expect(prog.organ.active.bars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    });

    it('decodes "Freddie Smith Nord Samples" as 888800000', () => {
      const prog = decodeNe4(load('Freddie Smith Nord Samples.ne4p'));
      expect(prog.organ.active.bars).toEqual([8, 8, 8, 8, 0, 0, 0, 0, 0]);
    });

    it('keeps `upper` as a backward-compat alias of `active`', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog.organ.upper.bars, name).toEqual(prog.organ.active.bars);
      }
    });

    it('returns exactly 9 drawbar values for every fixture', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog.organ.active.bars, name).toHaveLength(9);
      }
    });

    it('all drawbar values are in range 0-8 for every fixture', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        for (const bar of prog.organ.active.bars) {
          expect(bar, `${name} bar value`).toBeGreaterThanOrEqual(0);
          expect(bar, `${name} bar value`).toBeLessThanOrEqual(8);
        }
      }
    });

    it('exposes _vibPercFlags (and its _extraNibs alias) as a 3-tuple', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog.organ._vibPercFlags, name).toHaveLength(3);
        expect(prog.organ._extraNibs, name).toEqual(prog.organ._vibPercFlags);
      }
    });
  });

  describe('default organ drawbar slots (confirmed — corpus RE 2026-06-22)', () => {
    // body[4-8] and body[25-29] are the factory-default 8,8,0,0,0,0,0,8,8 block,
    // byte-identical and constant across all 16 corpus files.
    const DEFAULT = [8, 8, 0, 0, 0, 0, 0, 8, 8];

    it('decodes presetDefault1 (body[4-8]) as the factory default for all fixtures', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog.organ.presetDefault1.bars, name).toEqual(DEFAULT);
      }
    });

    it('decodes presetDefault2 (body[25-29]) identical to presetDefault1 for all fixtures', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect(prog.organ.presetDefault2.bars, name).toEqual(DEFAULT);
        expect(prog.organ.presetDefault2.bars, name).toEqual(prog.organ.presetDefault1.bars);
      }
    });
  });

  describe('section flags (candidate — Stage oracle 084-5/6/7)', () => {
    it('reads body[0] as sectionFlags (default 0x04)', () => {
      const prog = decodeNe4(load('Infectd Square 1 FS.ne4p'));
      expect(prog.sectionFlags).toBe(0x04);
      expect(prog._byte0).toBe(prog.sectionFlags); // backward-compat alias
    });

    it('reads the non-default 0x38 / 0xf6 values on Lead Samples files', () => {
      expect(decodeNe4(load('Nord Stage Electro Lead Samples.ne4p')).sectionFlags).toBe(0x38);
      expect(decodeNe4(load('Nord Stage Electro Lead Samples (2).ne4p')).sectionFlags).toBe(0xf6);
    });

    it('only ever observes 0x04 / 0x38 / 0xf6 across the corpus', () => {
      for (const name of fixtures()) {
        const prog = decodeNe4(load(name));
        expect([0x04, 0x38, 0xf6], name).toContain(prog.sectionFlags);
      }
    });
  });

  describe('sample reference + voice params (candidate — Stage piano model ID)', () => {
    it('exposes refId as 5 bytes and voiceParams as 2 bytes', () => {
      const prog = decodeNe4(load('Infectd Square 1 FS.ne4p'));
      expect(prog.sample.refId).toHaveLength(5);
      expect(prog.sample.voiceParams).toHaveLength(2);
    });

    it('reads the known refId for "Infectd Square 1 FS" (a941cb3d51)', () => {
      const prog = decodeNe4(load('Infectd Square 1 FS.ne4p'));
      expect(Array.from(prog.sample.refId)).toEqual([0xa9, 0x41, 0xcb, 0x3d, 0x51]);
      expect(Array.from(prog.sample.voiceParams)).toEqual([0x0c, 0x23]);
    });

    it('sq1 vs sq2: same sample set shares refId tail, differs in voiceParams', () => {
      // "Infected Squ 2FS" is the sibling sound on the same sample set:
      // refId differs only in the low bytes (a9→a5, 41→81); the sound-level
      // voiceParams change (0c/23 → 0d/a3).
      const sq2 = decodeNe4(load('Infected Squ 2FS.ne4p'));
      expect(Array.from(sq2.sample.refId)).toEqual([0xa5, 0x81, 0xcb, 0x3d, 0x51]);
      expect(Array.from(sq2.sample.voiceParams)).toEqual([0x0d, 0xa3]);
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
