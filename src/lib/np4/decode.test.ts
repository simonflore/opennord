import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNp4 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/piano-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));

import { readdirSync, existsSync } from 'fs';
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.np4p') && !f.startsWith('BUNDLE__'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNp4', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNp4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.00 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNp4(load(name)).version, name).toBe('1.00');
    }
  });

  it('exposes correctly-sized raw sections', () => {
    const prog = decodeNp4(load(fixtures()[0]));
    expect(prog._soundSection).toHaveLength(9);  // body[17-25]
    expect(prog._pianoParams).toHaveLength(13);  // body[35-47]
    expect(prog._fxSection).toHaveLength(14);    // body[59-72]
  });

  // ── Confirmed fields ───────────────────────────────────────────────────────

  it('correctly identifies EP programs (body[25]=0x80)', () => {
    const epFixtures = ['Funky Suitcase.np4p', 'George Model E.np4p', 'Jazz Suitcase 2.np4p', 'Tea Phaser.np4p'];
    for (const name of epFixtures) {
      expect(decodeNp4(load(name)).pianoFamily, name).toBe('EP');
    }
  });

  it('correctly identifies Grand programs (body[25]=0x00)', () => {
    const grandFixtures = ['Nord Corea.np4p', 'Utility Stage.np4p'];
    for (const name of grandFixtures) {
      expect(decodeNp4(load(name)).pianoFamily, name).toBe('Grand');
    }
  });

  it('pianoFamilyCheck agrees with pianoFamily for all fixtures', () => {
    for (const name of fixtures()) {
      const prog = decodeNp4(load(name));
      const checkIsEP = prog.pianoFamilyCheck === 0x0c;
      const checkIsGrand = prog.pianoFamilyCheck === 0x90;
      if (prog.pianoFamily === 'EP') {
        expect(checkIsEP, `${name}: b72 should be 0x0c for EP`).toBe(true);
      } else {
        expect(checkIsGrand, `${name}: b72 should be 0x90 for Grand`).toBe(true);
      }
    }
  });

  it('George Model E and Tea Phaser share the same model ID (same model, different program)', () => {
    const george = decodeNp4(load('George Model E.np4p'));
    const tea = decodeNp4(load('Tea Phaser.np4p'));
    expect(Array.from(george.pianoModelId)).toEqual(Array.from(tea.pianoModelId));
    expect(Array.from(george.pianoModelId)).toEqual([0x44, 0x19, 0x33, 0x46, 0x12]);
  });

  it('all programs have piano category prefix 0x4 in model ID high nibble', () => {
    for (const name of fixtures()) {
      const prog = decodeNp4(load(name));
      const highNibble = (prog.pianoModelId[0] ?? 0) >>> 4;
      expect(highNibble, `${name}: upper nibble of pianoModelId[0] should be 0x4`).toBe(0x4);
    }
  });

  it('model-family selector (body[19] low nibble) matches corpus evidence', () => {
    // Stage oracle alignment: 4=Wurl, 4=Wurl(EP), 7=FunkySuitcase, 5=Suitcase2, 3=Grand2, 0=Grand1
    expect(decodeNp4(load('George Model E.np4p')).pianoModelFamily).toBe(0x4);
    expect(decodeNp4(load('Tea Phaser.np4p')).pianoModelFamily).toBe(0x4);
    expect(decodeNp4(load('Funky Suitcase.np4p')).pianoModelFamily).toBe(0x7);
    expect(decodeNp4(load('Jazz Suitcase 2.np4p')).pianoModelFamily).toBe(0x5);
    expect(decodeNp4(load('Nord Corea.np4p')).pianoModelFamily).toBe(0x3);
    expect(decodeNp4(load('Utility Stage.np4p')).pianoModelFamily).toBe(0x0);
  });

  // ── Candidate fields ────────────────────────────────────────────────────────

  it('pianoLevel is in the observed corpus range (71-95) for all fixtures', () => {
    for (const name of fixtures()) {
      const { pianoLevel } = decodeNp4(load(name));
      expect(pianoLevel, name).toBeGreaterThanOrEqual(71);
      expect(pianoLevel, name).toBeLessThanOrEqual(95);
    }
  });

  it('pianoLevel matches known corpus values', () => {
    expect(decodeNp4(load('Funky Suitcase.np4p')).pianoLevel).toBe(95);
    expect(decodeNp4(load('George Model E.np4p')).pianoLevel).toBe(83);
    expect(decodeNp4(load('Jazz Suitcase 2.np4p')).pianoLevel).toBe(80);
    expect(decodeNp4(load('Nord Corea.np4p')).pianoLevel).toBe(75);
    expect(decodeNp4(load('Utility Stage.np4p')).pianoLevel).toBe(74);
    expect(decodeNp4(load('Tea Phaser.np4p')).pianoLevel).toBe(71);
  });

  it('velocity curve is Heavy for Funky Suitcase and George Model E', () => {
    expect(decodeNp4(load('Funky Suitcase.np4p')).velocityCurve).toBe('Heavy');
    expect(decodeNp4(load('George Model E.np4p')).velocityCurve).toBe('Heavy');
  });

  it('velocity curve is Medium for Jazz Suitcase 2 and Nord Corea', () => {
    expect(decodeNp4(load('Jazz Suitcase 2.np4p')).velocityCurve).toBe('Medium');
    expect(decodeNp4(load('Nord Corea.np4p')).velocityCurve).toBe('Medium');
  });

  it('velocity curve is Soft for Tea Phaser and Utility Stage', () => {
    expect(decodeNp4(load('Tea Phaser.np4p')).velocityCurve).toBe('Soft');
    expect(decodeNp4(load('Utility Stage.np4p')).velocityCurve).toBe('Soft');
  });

  // fxModWord: per-program FX-mod region head word. NOTE 0x0202 is NOT an "off"
  // sentinel — Tea Phaser is an active phaser yet also reads 0x0202. We only pin
  // the raw decoded values from the corpus, not an on/off interpretation.
  it('fxModWord matches the per-program corpus values', () => {
    expect(decodeNp4(load('George Model E.np4p')).fxModWord).toBe(0x0202);
    expect(decodeNp4(load('Nord Corea.np4p')).fxModWord).toBe(0x0202);
    expect(decodeNp4(load('Tea Phaser.np4p')).fxModWord).toBe(0x0202);
    expect(decodeNp4(load('Funky Suitcase.np4p')).fxModWord).toBe(0x90f0);
    expect(decodeNp4(load('Jazz Suitcase 2.np4p')).fxModWord).toBe(0x8d7a);
    expect(decodeNp4(load('Utility Stage.np4p')).fxModWord).toBe(0x94c8);
  });

  it('Tea Phaser has distinctly non-zero fxModParams (active phaser)', () => {
    const prog = decodeNp4(load('Tea Phaser.np4p'));
    expect(Array.from(prog.fxModParams)).toEqual([0x3f, 0x8d, 0x70, 0xf2]);
  });
});
