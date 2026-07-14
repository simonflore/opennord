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
  2: 'Drums',            // Teenage Dirtbag Drums.nsmpproj → 2
  3: 'Accordion/Harm',   // Teenage Dirtbag Acc.nsmpproj → 3
  12: 'Brass',           // Teenage Dirtbag Brass.nsmpproj → 12 (sub 2 = Ensemble)
  13: 'Orchestral',      // Teenage Dirtbag Orchestral.nsmpproj → 13
  15: 'User',            // default for user-created instruments → 15
};

/** Resolve a sample main-category id to its name, or `undefined` if unconfirmed. */
export function sampleCategoryName(id: number | undefined): string | undefined {
  return id == null ? undefined : SAMPLE_CATEGORY[id];
}
