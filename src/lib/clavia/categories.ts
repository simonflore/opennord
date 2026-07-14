/**
 * Program category id → name (CBIN header byte 0x10).
 *
 * Ported from Nord Sound Manager's authoritative category table
 * (a 54-entry string table;
 * category value `n` maps to table index `n+1`). Cross-checked against a real
 * Stage 4 corpus over USB (e.g. "Lyle Lead J3" = cat 6 = Lead; most synth
 * programs = cat 45 = Synth Classic). See the maintainers’ notes, the maintainers’ notes.
 *
 * Note: this corrects an earlier table that had 6 = Organ — it is **Lead**
 * (Organ is 7). Values 47+ are unnamed in firmware 3.40 (reserved); the raw id
 * is exposed for those.
 */
export const PROGRAM_CATEGORY: Record<number, string> = {
  0: 'Acoustic',
  1: 'Bass',
  2: 'Wind',
  3: 'Drum/Perc',
  4: 'Fantasy',
  5: 'FX',
  6: 'Lead',
  7: 'Organ',
  8: 'Pad',
  9: 'Piano',
  10: 'Guitar/Plucked',
  11: 'String',
  12: 'Synth',
  13: 'Vocal',
  14: 'User',
  15: 'User 2',
  16: 'User 3',
  17: 'None',
  18: 'B3',
  19: 'Farf',
  20: 'Vx',
  21: 'Grand',
  22: 'Upright',
  23: 'EPiano',
  24: 'Wurl',
  25: 'Clav/Hps',
  26: 'Pipe',
  27: 'Clavinet',
  28: 'Harpsichord',
  29: 'EGrand',
  30: 'Arpeggio',
  31: 'Pedal',
  32: 'Split',
  33: 'ClkSync',
  34: 'Brass',
  35: 'Sequence',
  36: 'Accordion/Harm',
  37: 'Wind',
  38: 'Orchestral',
  39: 'Keys',
  40: 'Misc',
  41: 'Combi',
  42: 'Guitar',
  43: 'User',
  44: 'Synth Bass',
  45: 'Synth Classic',
  46: 'Synth Pad',
};

/** Resolve a category id to its name, or `undefined` if not yet known. */
export function programCategoryName(id: number): string | undefined {
  return PROGRAM_CATEGORY[id];
}

/**
 * Electro 5 bank → category-id set.
 *
 * The Electro 5 bank → category mapping is a switch on bank number.
 * It receives (ECategoryIntrumentType=0 for
 * keyboard sounds, bank, out-vector) and push_backs CategoryID enum values.
 *
 * Mapping (bank → CategoryID[]):
 *   bank 0 → 5, 1, 16, 8, 0  (FX, Bass, User3, Pad, Acoustic) — oracle lines 51/56/136/216/296
 *   bank 1 → 6                (Lead)                            — oracle line 451
 *   bank 2 → 3, 2             (Drum/Perc, Wind)                 — oracle lines 524/603
 *   bank 3 → 14, 15           (User, User2)                     — oracle lines 672/751
 *   bank 4 → 4                (Fantasy)                         — oracle line 819
 *   bank 5 → 7                (Organ)                           — oracle line 888
 *   default → (no entry stored) — the sentinel 0xffffffff is NOT kept in this map;
 *             unknown banks return `undefined` from `electroBankCategoryIds()`.
 *             Oracle line 957 documents the raw firmware default; we expose it as
 *             undefined rather than storing the raw 32-bit sentinel.
 *
 * The CategoryID enum values resolve directly through PROGRAM_CATEGORY above.
 */
// Electro 5: bank → CategoryID[]
export const ELECTRO5_BANK_CATEGORIES: Record<number, number[]> = {
  0: [5, 1, 16, 8, 0],
  1: [6],
  2: [3, 2],
  3: [14, 15],
  4: [4],
  5: [7],
};

/**
 * Return the CategoryID set for a given Electro bank number, or `undefined`
 * if the bank is not mapped.
 *
 * See ELECTRO5_BANK_CATEGORIES above.
 */
export function electroBankCategoryIds(bank: number): number[] | undefined {
  return ELECTRO5_BANK_CATEGORIES[bank];
}

/**
 * Piano-family (Nord Piano 5 / Piano 6 / Grand 2) — program bank → CategoryID set.
 *
 * These three models share ONE identical `BankToCategories` switch table (the
 * program path, `ECategoryInstrumentType == 0`). Transcribed from the
 * NSM `switch(bank)` bodies with inline `*p = <id>` stores:
 *   - Piano 5
 *   - Piano 6
 *   - Grand 2
 * The extractor was cross-validated by reproducing the already-hand-transcribed
 * Electro 5 table byte-for-byte, then applied to these three. Values resolve
 * through PROGRAM_CATEGORY above. The `0xffffffff` sentinel seen in these
 * functions belongs to the SAMPLE path (`type == 1` → Stage 4 sample-bank categories),
 * not the program switch, and is excluded.
 *
 * Note: Electro 6 and Piano 4 do NOT share this — they delegate to a Stage 3
 * shared implementation (which also merges woodwind and brass) that isn't
 * covered here, so their bank tables are not mapped yet.
 */
// Piano 5 / Piano 6 / Grand 2 — shared switch table
export const PIANO_FAMILY_BANK_CATEGORIES: Record<number, number[]> = {
  0: [5, 1],      // FX, Bass
  1: [6],         // Lead
  2: [3, 2],      // Drum/Perc, Wind
  3: [4, 7],      // Fantasy, Organ
  4: [14, 15],    // User, User 2
  5: [16, 8, 0],  // User 3, Pad, Acoustic
};

/** Models that share the piano-family bank→category table (NSM-confirmed). */
const PIANO_FAMILY_MODELS = new Set(['piano-5', 'piano-6', 'grand-2']);

/**
 * Return the CategoryID set for a program bank on a model whose bank→category
 * map is NSM-recovered, or `undefined` when the model/bank isn't mapped.
 * Covers Electro 5 and the piano-family trio (Piano 5 / Piano 6 / Grand 2).
 */
export function bankCategoryIds(model: string, bank: number): number[] | undefined {
  if (model === 'electro-5') return ELECTRO5_BANK_CATEGORIES[bank];
  if (PIANO_FAMILY_MODELS.has(model)) return PIANO_FAMILY_BANK_CATEGORIES[bank];
  return undefined;
}

/**
 * Nord Wave 2 — program-partition category whitelist.
 *
 * The Wave 2 program partition's categories come from a fixed 19-entry list.
 * The constructor iterates in 4-byte steps for 0x4c bytes (19
 * entries) and calls `SPartition::Category_Add` on the program partition. The
 * data table is a baked-in array of CategoryID values; the
 * 19 values below are the full set validated against 26 real `.nw2p` fixtures
 * (all observed categories — 1=Bass, 4=Fantasy, 6=Lead, 8=Pad, 9=Piano,
 * 10=Guitar/Plucked, 11=String, 12=Synth, 13=Vocal — are members of this set).
 *
 * Note: `BankToCategories` for the Wave 2 (``) handles ONLY the
 * sample partition (ECategoryInstrumentType == 1, delegating to
 * the shared Stage 4 sample-bank categories). For programs (ECategoryInstrumentType != 1)
 * it returns 1 (unhandled) immediately. The program partition's categories are
 * set directly in the constructor via `Category_Add`, not via BankToCategories.
 *
 * Validated vs 26 real .nw2p fixtures (2026-06-20); not HW-tested.
 *
 * CategoryID values (indices into PROGRAM_CATEGORY):
 *   0=Acoustic, 1=Bass, 2=Wind, 3=Drum/Perc, 4=Fantasy, 5=FX, 6=Lead,
 *   7=Organ, 8=Pad, 9=Piano, 10=Guitar/Plucked, 11=String, 12=Synth,
 *   13=Vocal, 14=User, 15=User 2, 16=User 3, 17=None, 44=Synth Bass
 */
// Wave 2 — 19-entry program category whitelist
export const WAVE2_PROGRAM_CATEGORIES: number[] = [
  0,  // Acoustic
  1,  // Bass
  2,  // Wind
  3,  // Drum/Perc
  4,  // Fantasy
  5,  // FX
  6,  // Lead
  7,  // Organ
  8,  // Pad
  9,  // Piano
  10, // Guitar/Plucked
  11, // String
  12, // Synth
  13, // Vocal
  14, // User
  15, // User 2
  16, // User 3
  17, // None
  44, // Synth Bass
];

/**
 * Return true if the given CategoryID is valid for a Wave 2 program partition.
 *
 * See WAVE2_PROGRAM_CATEGORIES above.
 */
export function isWave2ProgramCategory(id: number): boolean {
  return WAVE2_PROGRAM_CATEGORIES.includes(id);
}
