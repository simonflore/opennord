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
export const SAMPLE_CATEGORY: Record<number, string> = {
  // Confirmed from labeled NSE exports (.nsmpproj m_categoryCategory):
  2: 'Drums',            // Teenage Dirtbag Drums → 2
  3: 'Accordion/Harm',   // Teenage Dirtbag Acc → 3
  12: 'Brass',           // Teenage Dirtbag Brass → 12 (sub 2 = Ensemble)
  13: 'Orchestral',      // Teenage Dirtbag Orchestral → 13
  15: 'User',            // default for user-created instruments → 15
  // Weak-labeled from the factory fixture corpus (cat id + embedded name):
  1: 'Bass',             // "BassGit"
  5: 'Guitar/Plucked',   // "12 String Guitar", "E Guitar", "LuteHarp"
  6: 'Organ',            // "Cathedral Organ"
  7: 'Percussion',       // "Vibes" (sub 1 = Tuned)
  8: 'Piano',            // "Clavinet5", "ElGrand CP80", "Wurlitzer", "Epiano4", "Grandmas Upright"
  9: 'Strings',          // "ARP Quadra Str", "Spitfire String Quintet", "SymphStr"
  11: 'Choir',           // "Men+Women Mm", "Men+Women Oh Soft"
  // Not represented in the corpus (unconfirmed): 0, 4, 10, 14, 16, 17, 18.
  // Address-order in the SampLib initializer suggests 4=Effects, 10=Synth,
  // 16=Mellotron, 17=Rhythmic, 18=Wind, 0=None — pin each from a labeled export
  // before adding (an unmapped id just gets no chip). See sample-category-is-stored.
};

/** Resolve a sample main-category id to its name, or `undefined` if unconfirmed. */
export function sampleCategoryName(id: number | undefined): string | undefined {
  return id == null ? undefined : SAMPLE_CATEGORY[id];
}
