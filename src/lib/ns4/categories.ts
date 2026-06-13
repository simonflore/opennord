/**
 * Program category id → name (CBIN header byte 0x10).
 *
 * PARTIAL and community-extendable, exactly like the sample-name table: the full
 * Stage 4 category enum isn't published, so we resolve what's *verified* against
 * real files and otherwise expose the raw id rather than guess. Add entries here
 * as each is confirmed (export a program in a known category from Nord Sound
 * Manager and read byte 0x10). See docs/FORMAT.md.
 *
 * Verified: 6 = Organ (docs/FORMAT.md, three-file cross-check).
 */
export const PROGRAM_CATEGORY: Record<number, string> = {
  6: 'Organ',
};

/** Resolve a category id to its name, or `undefined` if not yet known. */
export function programCategoryName(id: number): string | undefined {
  return PROGRAM_CATEGORY[id];
}
