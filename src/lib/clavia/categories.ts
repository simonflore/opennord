/**
 * Program category id → name (CBIN header byte 0x10).
 *
 * Ported from Nord Sound Manager's authoritative category table
 * (`Ymer::Product::SPartition::S_Category_GetName`, a 54-entry string table;
 * category value `n` maps to table index `n+1`). Cross-checked against a real
 * Stage 4 corpus over USB (e.g. "Lyle Lead J3" = cat 6 = Lead; most synth
 * programs = cat 45 = Synth Classic). See docs/FORMAT.md, docs/NSM-TEARDOWN.md.
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
 * Transcribed from CElectro5::BankToCategories @0x100194f7c (NSM binary,
 * Ghidra decompile). The function receives (ECategoryIntrumentType=0 for
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
// CElectro5::BankToCategories @0x100194f7c
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
 * Source: CElectro5::BankToCategories @0x100194f7c
 */
export function electroBankCategoryIds(bank: number): number[] | undefined {
  return ELECTRO5_BANK_CATEGORIES[bank];
}
