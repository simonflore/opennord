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

  it('reads a known version (1.00 or 1.01) from every fixture', () => {
    // 204/212 factory-restore fixtures are 1.00; 8 are 1.01. The 6-file corpus
    // only saw 1.00 — the version field decodes fine, the claim was overfit.
    for (const name of fixtures()) {
      expect(['1.00', '1.01'], name).toContain(decodeNp4(load(name)).version);
    }
  });

  it('exposes correctly-sized raw sections', () => {
    const prog = decodeNp4(load(fixtures()[0]));
    expect(prog._soundSection).toHaveLength(9);   // body[17-25]
    expect(prog._sampleSection).toHaveLength(13); // body[35-47]
    expect(prog._fxSection).toHaveLength(14);     // body[59-72]
  });

  // ── Confirmed fields (bundle-validated; survive the 212-file re-census) ──────
  //
  // NOTE: the earlier "pianoFamily" (body[25] bit7), "pianoFamilyCheck"
  // (body[72]), "pianoLevel" (body[35]) and "velocityCurve" (body[36]) fields
  // were 6-file artifacts — the 212-file corpus falsified all four (see
  // decode.ts re-census notes) and they were removed.

  // Ground truth: the Ondre bundle's meta.xml declares each program's .npno
  // dependency. Expected ids/names below are transcribed from resolving the
  // decoded ids through the Stage 4 PIANO_NAMES table (2026-07-04):
  //   Utility Stage   → 3456736737 = EP1 Deep Timbre Lrg
  //   Nord Corea      →   27369483 = EP4 Mk5 80s Lrg
  //   George / Tea    → 1691162699 = EP5 BrightTines XL
  //   Jazz Suitcase 2 → 3490565097 = EP6 Sparkletop XL
  //   Funky Suitcase  →  401488166 = EP8 Nefertiti XL
  it('decodes the family-wide piano model id for every bundle program', () => {
    expect(decodeNp4(load('Utility Stage.np4p')).pianoModelId).toBe(3456736737);
    expect(decodeNp4(load('Nord Corea.np4p')).pianoModelId).toBe(27369483);
    expect(decodeNp4(load('George Model E.np4p')).pianoModelId).toBe(1691162699);
    expect(decodeNp4(load('Tea Phaser.np4p')).pianoModelId).toBe(1691162699);
    expect(decodeNp4(load('Jazz Suitcase 2.np4p')).pianoModelId).toBe(3490565097);
    expect(decodeNp4(load('Funky Suitcase.np4p')).pianoModelId).toBe(401488166);
  });

  it('George Model E and Tea Phaser share the same piano (same model id, different program)', () => {
    const george = decodeNp4(load('George Model E.np4p'));
    const tea = decodeNp4(load('Tea Phaser.np4p'));
    expect(george.pianoModelId).toBe(tea.pianoModelId);
  });

  it('pianoSlot (body[19] low nibble) matches each paired .npno CBIN slot byte', () => {
    // meta.xml pairing → npno header slot @0x0e: EP1=0, EP4=3, EP5=4, EP6=5, EP8=7
    expect(decodeNp4(load('Utility Stage.np4p')).pianoSlot).toBe(0);
    expect(decodeNp4(load('Nord Corea.np4p')).pianoSlot).toBe(3);
    expect(decodeNp4(load('George Model E.np4p')).pianoSlot).toBe(4);
    expect(decodeNp4(load('Tea Phaser.np4p')).pianoSlot).toBe(4);
    expect(decodeNp4(load('Jazz Suitcase 2.np4p')).pianoSlot).toBe(5);
    expect(decodeNp4(load('Funky Suitcase.np4p')).pianoSlot).toBe(7);
  });

  // ── Candidate fields ────────────────────────────────────────────────────────

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
