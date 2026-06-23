import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNw1 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/wave');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nwp'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNw1', () => {
  it('decodes every fixture without warnings', () => {
    // Sample 50 files to keep test runtime manageable (1018 total fixtures)
    const sample = fixtures().slice(0, 50);
    for (const name of sample) {
      const prog = decodeNw1(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('exposes two correctly-sized slots and a global block', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    expect(prog.slot1._raw).toHaveLength(116);
    expect(prog.slot2._raw).toHaveLength(116);
    expect(prog.global._raw).toHaveLength(10);
  });

  it('body length is 306 bytes', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    expect(prog._rawBody).toHaveLength(306);
  });

  it('version is a formatted decimal string', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    expect(prog.version).toMatch(/^\d+\.\d{2}$/);
  });

  it('decodes slot enum fields within their documented ranges', () => {
    const sample = fixtures().slice(0, 50);
    for (const name of sample) {
      const prog = decodeNw1(load(name));
      for (const slot of [prog.slot1, prog.slot2]) {
        // oscSelect: enum 0-9
        expect(slot.oscSelect, `${name} oscSelect`).toBeGreaterThanOrEqual(0);
        expect(slot.oscSelect, `${name} oscSelect`).toBeLessThanOrEqual(9);
        // enumParam: 0-7
        expect(slot.enumParam, `${name} enumParam`).toBeGreaterThanOrEqual(0);
        expect(slot.enumParam, `${name} enumParam`).toBeLessThanOrEqual(7);
        // steppedParam: even-only {0,2,4,6,8,10}
        expect(slot.steppedParam % 2, `${name} steppedParam even`).toBe(0);
        expect(slot.steppedParam, `${name} steppedParam`).toBeLessThanOrEqual(10);
      }
    }
  });

  it('reads slot fields from the documented body offsets', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    const body = prog._rawBody;
    // Slot 1 at offset 0, slot 2 at stride +140.
    expect(prog.slot1.oscSelect).toBe(body[0]);
    expect(prog.slot1.steppedParam).toBe(body[39]);
    expect(prog.slot1.enumParam).toBe(body[45]);
    expect(prog.slot2.oscSelect).toBe(body[140]);
    expect(prog.slot2.steppedParam).toBe(body[179]);
    expect(prog.slot2.enumParam).toBe(body[185]);
  });

  it('decodes the global block fields and a uint16 checksum', () => {
    const prog = decodeNw1(load(fixtures()[0]));
    const body = prog._rawBody;
    expect(prog.global.mode).toBe(body[280] & 0x0f);
    expect(prog.global.flags).toBe(body[289]);
    expect(prog.checksum).toBe(body[304] | (body[305] << 8));
  });

  it('confirms the dual-slot architecture: slots frequently mirror across the corpus', () => {
    // Per RE: 199/1018 files have slot1 == slot2 exactly. Over a sample we
    // expect at least some files where the two 116-byte slots are byte-identical.
    const sample = fixtures().slice(0, 200);
    let identical = 0;
    for (const name of sample) {
      const prog = decodeNw1(load(name));
      const a = prog.slot1._raw;
      const b = prog.slot2._raw;
      if (a.length === b.length && a.every((v, i) => v === b[i])) identical++;
    }
    expect(identical).toBeGreaterThan(0);
  });
});
