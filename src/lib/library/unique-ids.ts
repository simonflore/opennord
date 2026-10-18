/**
 * The Library keys a Nord's files by an id built from their slot, and a list that
 * holds one id twice opens the wrong file: lookups keep one entry, the read takes
 * another, and the read never lands (#186, two Stage 2 slots that shared a label).
 * Slot labels are unique now, so this is the net under them: a later entry that
 * repeats an id gets `~2`, `~3`… so each file still opens as itself, and
 * {@link repeatedIds} lets the list report that it happened. Pure.
 */
export function withUniqueIds<E extends { id: string }>(entries: E[]): E[] {
  const seen = new Map<string, number>();
  let out: E[] | null = null;
  entries.forEach((e, i) => {
    const n = (seen.get(e.id) ?? 0) + 1;
    seen.set(e.id, n);
    if (n > 1) (out ??= entries.slice())[i] = { ...e, id: `${e.id}~${n}` };
  });
  return out ?? entries; // the same list when nothing repeated, so memoised rows keep it
}

/** The ids {@link withUniqueIds} found repeated, each once. */
export function repeatedIds(entries: readonly { id: string }[]): string[] {
  const ids = new Set<string>();
  for (const e of entries) {
    const m = /^(.*)~\d+$/.exec(e.id);
    if (m) ids.add(m[1]);
  }
  return [...ids];
}
