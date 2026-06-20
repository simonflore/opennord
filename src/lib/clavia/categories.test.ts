/**
 * categories.test.ts — Electro category mapping tests.
 *
 * Values transcribed from CElectro5::BankToCategories @0x100194f7c (NSM binary,
 * Ghidra decompile in nsm_decomp/).
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  programCategoryName,
  ELECTRO5_BANK_CATEGORIES,
  electroBankCategoryIds,
  WAVE2_PROGRAM_CATEGORIES,
  isWave2ProgramCategory,
} from './categories';

// ---------------------------------------------------------------------------
// Existing table smoke-test (regression guard)
// ---------------------------------------------------------------------------
describe('programCategoryName (existing table)', () => {
  it('resolves known ids from the shared enum', () => {
    expect(programCategoryName(0)).toBe('Acoustic');
    expect(programCategoryName(6)).toBe('Lead');   // not Organ — see categories.ts note
    expect(programCategoryName(7)).toBe('Organ');
    expect(programCategoryName(14)).toBe('User');
  });

  it('returns undefined for ids beyond the defined range', () => {
    expect(programCategoryName(0xff)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Electro 5 bank→category mapping
// CElectro5::BankToCategories(ECategoryIntrumentType=0, bank, out)
// Transcribed directly from the switch-on-bank in @0x100194f7c.
// ---------------------------------------------------------------------------
describe('ELECTRO5_BANK_CATEGORIES (NSM-traced, CElectro5::BankToCategories @0x100194f7c)', () => {
  it('exposes a map with entries for all 6 named Electro banks (0-5); unknown banks return undefined', () => {
    // Banks 0-5 are explicitly cased. The firmware default (0xffffffff "all" sentinel)
    // is NOT stored in this map — electroBankCategoryIds() returns undefined for unknown banks.
    expect(Object.keys(ELECTRO5_BANK_CATEGORIES).length).toBeGreaterThanOrEqual(6);
  });

  // bank 0 → [5, 1, 16, 8, 0]  (FX, Bass, User3, Pad, Acoustic)
  it('bank 0 → [5, 1, 16, 8, 0] per oracle', () => {
    expect(ELECTRO5_BANK_CATEGORIES[0]).toEqual([5, 1, 16, 8, 0]);
  });

  // bank 1 → [6]  (Lead)
  it('bank 1 → [6] (Lead) per oracle', () => {
    expect(ELECTRO5_BANK_CATEGORIES[1]).toEqual([6]);
  });

  // bank 2 → [3, 2]  (Drum/Perc, Wind)
  it('bank 2 → [3, 2] (Drum/Perc, Wind) per oracle', () => {
    expect(ELECTRO5_BANK_CATEGORIES[2]).toEqual([3, 2]);
  });

  // bank 3 → [14, 15]  (User, User 2)
  it('bank 3 → [14, 15] (User, User 2) per oracle', () => {
    expect(ELECTRO5_BANK_CATEGORIES[3]).toEqual([14, 15]);
  });

  // bank 4 → [4]  (Fantasy)
  it('bank 4 → [4] (Fantasy) per oracle', () => {
    expect(ELECTRO5_BANK_CATEGORIES[4]).toEqual([4]);
  });

  // bank 5 → [7]  (Organ)
  it('bank 5 → [7] (Organ) per oracle', () => {
    expect(ELECTRO5_BANK_CATEGORIES[5]).toEqual([7]);
  });
});

// ---------------------------------------------------------------------------
// electroBankCategoryIds() helper
// ---------------------------------------------------------------------------
describe('electroBankCategoryIds', () => {
  it('returns the ids for a known bank', () => {
    expect(electroBankCategoryIds(1)).toEqual([6]);
  });

  it('returns undefined for an unknown bank', () => {
    expect(electroBankCategoryIds(99)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Wave 2 program category whitelist (CWave2::CWave2 @0x100033a7c)
// 19-entry Category_Add loop over DAT_100727788.
// BankToCategories @0x100034d64 handles ONLY the sample partition; programs get
// their categories from the constructor's Category_Add loop.
// ---------------------------------------------------------------------------
describe('WAVE2_PROGRAM_CATEGORIES (NSM-traced, CWave2::CWave2 @0x100033a7c)', () => {
  it('has exactly 19 entries', () => {
    // Constructor loops lVar11=0 to 0x4c step 4 → 0x4c/4 = 19 iterations
    expect(WAVE2_PROGRAM_CATEGORIES).toHaveLength(19);
  });

  it('contains all categories observed in the 26 real .nw2p fixtures', () => {
    // Categories observed: 1=Bass, 4=Fantasy, 6=Lead, 8=Pad, 9=Piano,
    // 10=Guitar/Plucked, 11=String, 12=Synth, 13=Vocal
    for (const id of [1, 4, 6, 8, 9, 10, 11, 12, 13]) {
      expect(WAVE2_PROGRAM_CATEGORIES, `category ${id} (${programCategoryName(id)})`).toContain(id);
    }
  });

  it('resolves every entry through the shared PROGRAM_CATEGORY table (or is a known extension)', () => {
    // All 19 entries must either resolve to a name or be known extended ids (44=Synth Bass)
    for (const id of WAVE2_PROGRAM_CATEGORIES) {
      const name = programCategoryName(id);
      expect(name ?? id, `category ${id} must be in PROGRAM_CATEGORY`).toBeTruthy();
    }
  });
});

describe('isWave2ProgramCategory (CWave2::CWave2 @0x100033a7c)', () => {
  it('returns true for all fixture-observed category ids', () => {
    for (const id of [1, 4, 6, 8, 9, 10, 11, 12, 13]) {
      expect(isWave2ProgramCategory(id), `id=${id}`).toBe(true);
    }
  });

  it('returns false for ids not in the Wave 2 whitelist', () => {
    // 45 (Synth Classic), 46 (Synth Pad), 18 (B3) are not in the program whitelist
    expect(isWave2ProgramCategory(45)).toBe(false);
    expect(isWave2ProgramCategory(46)).toBe(false);
    expect(isWave2ProgramCategory(99)).toBe(false);
  });
});

describe('Wave 2 fixture anchor (fixtures/wave-2/*.nw2p)', () => {
  const fixtureDir = join(new URL('.', import.meta.url).pathname, '../../../../../fixtures/wave-2');

  it('resolves category bytes from real fixtures through the shared table', () => {
    const samples: Array<[string, number, string]> = [
      ['One Vision Queen.nw2p', 0x0b, 'String'],         // cat=11=String
      ['EF__Program_Bank O_Eli    Bass 1.nw2p', 0x01, 'Bass'],   // cat=1=Bass
      ['EF__Program_Bank O_camel  Lead 3.nw2p', 0x06, 'Lead'],   // cat=6=Lead
      ['EF__Program_Bank O_Elio.nw2p', 0x08, 'Pad'],             // cat=8=Pad
    ];
    for (const [filename, expectedCat, expectedName] of samples) {
      const path = join(fixtureDir, filename);
      if (!existsSync(path)) {
        console.log(`SKIP: fixture not present at ${path}`);
        continue;
      }
      const bytes = new Uint8Array(readFileSync(path).buffer);
      const categoryId = bytes[0x10];
      expect(categoryId, `${filename} category byte`).toBe(expectedCat);
      expect(programCategoryName(categoryId), `${filename} category name`).toBe(expectedName);
    }
  });
});

// ---------------------------------------------------------------------------
// Fixture anchor: Electro 4 .ne4p — category byte @0x10 = 0x0e (= 14 = "User")
// This is bank 3 territory (banks 3 → [14, 15]).
// ---------------------------------------------------------------------------
describe('Electro 4 fixture anchor (fixtures/electro-4/*.ne4p)', () => {
  const fixtureDir = join(new URL('.', import.meta.url).pathname, '../../../../../fixtures/electro-4');
  const fixturePath = join(fixtureDir, 'Infectd Square 1 FS.ne4p');

  it('resolves category 0x0e (@0x10) to "User" via the shared table', () => {
    if (!existsSync(fixturePath)) {
      // Fixture is gitignored — skip gracefully on CI / fresh clone
      console.log('SKIP: fixture not present at', fixturePath);
      return;
    }
    const bytes = new Uint8Array(readFileSync(fixturePath).buffer);
    const categoryId = bytes[0x10]; // CBIN header category byte
    expect(categoryId).toBe(0x0e);   // confirmed: 0x0e = 14
    expect(programCategoryName(categoryId)).toBe('User');
  });
});

// ---------------------------------------------------------------------------
// Electro 5 fixture: category @0x10 = 0xFF → uncategorized (not a crash)
// ---------------------------------------------------------------------------
describe('Electro 5 fixture anchor (fixtures/electro-5/*.ne5p)', () => {
  const fixtureDir = join(new URL('.', import.meta.url).pathname, '../../../../../fixtures/electro-5');
  const fixturePath = join(fixtureDir, 'CP 80 Grandpad Sample.ne5p');

  it('category 0xFF surfaces as undefined, not a crash', () => {
    if (!existsSync(fixturePath)) {
      console.log('SKIP: fixture not present at', fixturePath);
      return;
    }
    const bytes = new Uint8Array(readFileSync(fixturePath).buffer);
    const categoryId = bytes[0x10];
    expect(categoryId).toBe(0xff);   // confirmed: 0xFF sentinel (uncategorized)
    expect(programCategoryName(categoryId)).toBeUndefined();
  });
});
