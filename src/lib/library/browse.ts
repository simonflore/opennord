/** Generic, model-agnostic browse helpers shared by the Library and Samples
 *  screens. Pure — no React, no DOM. */

/** Case-insensitive trimmed substring match; an empty query matches anything. */
export function matchesQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === '' || name.toLowerCase().includes(q);
}

/**
 * Case-insensitive substring match across several fields (name, category,
 * engine summary…); an empty query matches anything. Lets a search for "pad"
 * surface a program whose *category* is Pad even when its name isn't.
 */
export function matchesAny(fields: Array<string | undefined>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return fields.some((f) => f != null && f.toLowerCase().includes(q));
}

/**
 * Order entries for display: favorites always float to the top, then `byKey`
 * within each group. Stable — equal keys keep input order. Non-mutating.
 */
export function sortWithFavorites<T extends { id: string }>(
  entries: T[], favorites: ReadonlySet<string>, byKey: (a: T, b: T) => number,
): T[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((x, y) => {
      const fx = favorites.has(x.e.id) ? 0 : 1;
      const fy = favorites.has(y.e.id) ? 0 : 1;
      if (fx !== fy) return fx - fy;          // favorites first
      return byKey(x.e, y.e) || x.i - y.i;     // then key, stable
    })
    .map((w) => w.e);
}
