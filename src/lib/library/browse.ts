/** Generic, model-agnostic browse helpers shared by the Library and Samples
 *  screens. Pure — no React, no DOM. */

import { isFavoriteRow } from './found-on';


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
 * A merged row is a favourite through any of its keys (isFavoriteRow).
 */
export function sortWithFavorites<T extends { id: string; fingerprint?: string; members?: { id: string }[] }>(
  entries: T[], favorites: ReadonlySet<string>, byKey: (a: T, b: T) => number,
): T[] {
  return entries
    .map((e, i) => ({ e, i, fav: isFavoriteRow(favorites, e) }))
    .sort((x, y) => {
      const fx = x.fav ? 0 : 1;
      const fy = y.fav ? 0 : 1;
      if (fx !== fy) return fx - fy;          // favorites first
      return byKey(x.e, y.e) || x.i - y.i;     // then key, stable
    })
    .map((w) => w.e);
}
