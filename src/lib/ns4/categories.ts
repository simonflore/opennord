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
