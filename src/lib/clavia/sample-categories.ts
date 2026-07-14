/**
 * Sample-instrument **main** category id → name (the `.nsmp` `cat` section, byte
 * 0 = `m_categoryCategory`). This is the sample product's own 19-entry enum
 * (ids 0–18), DISTINCT from the program category table in {@link ./categories}
 * (there 14 = User; here 15 = User). Reverse-engineered from the Nord Sample
 * Editor: the `SampLib` static initializer builds a descriptor array (base
 * 0x7378, stride 0x18) where `descriptor[i].id = i` for i = 0–18, so the id
 * space is fixed at 0–18; the display names are built at runtime, so each is
 * pinned empirically from a labeled `.nsmp` export rather than read from the
 * binary. See memory `sample-category-is-stored`.
 *
 * Unmapped ids resolve to `undefined` (the entry simply gets no category), so
 * the table can grow one confirmed export at a time without guessing.
 */
// The full sample main-category enum (ids 1–18), every entry confirmed from a
// labeled NSE export (.nsmpproj m_categoryCategory) or the factory fixture
// corpus (cat id + embedded name). Id 0 is the internal "None"/unset value
// (not user-selectable) and stays unmapped → no facet chip.
export const SAMPLE_CATEGORY: Record<number, string> = {
  1: 'Bass',             // fixtures: "BassGit"
  2: 'Drums',            // export: Teenage Dirtbag Drums
  3: 'Accordion/Harm',   // export: Teenage Dirtbag Acc
  4: 'Effects',          // export: Teenage Dirtbag FX
  5: 'Guitar/Plucked',   // fixtures: "12 String Guitar", "E Guitar", "LuteHarp"
  6: 'Organ',            // fixtures: "Cathedral Organ"
  7: 'Percussion',       // fixtures: "Vibes" (sub 1 = Tuned)
  8: 'Piano',            // fixtures: "ElGrand CP80", "Wurlitzer", "Clavinet5", "Epiano4"
  9: 'Strings',          // fixtures: "Spitfire String Quintet", "ARP Quadra Str"
  10: 'Synth',           // export: Teenage Dirtbag Synth Bass (sub 3)
  11: 'Choir',           // fixtures: "Men+Women Mm/Oh"
  12: 'Brass',           // export: Teenage Dirtbag Brass (sub 2 = Ensemble)
  13: 'Orchestral',      // export: Teenage Dirtbag Orchestral
  14: 'Misc',            // export: Teenage Dirtbag Misc
  15: 'User',            // export: default for user-created instruments
  16: 'Mellotron',       // export: Teenage Dirtbag Mellotron
  17: 'Rhythmic',        // export: Teenage Dirtbag Rhythmic
  18: 'Wind',            // export: Teenage Dirtbag Wind Ensemble (sub 2)
};

/** Resolve a sample main-category id to its name, or `undefined` if unconfirmed. */
export function sampleCategoryName(id: number | undefined): string | undefined {
  return id == null ? undefined : SAMPLE_CATEGORY[id];
}
