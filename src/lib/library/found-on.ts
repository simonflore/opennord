/** One row per sound: the same bytes found in several places are one row,
 *  shown as one of its entries and badged with every source it is found on.
 *  Pure — no React, no DOM. */
import { isImported, type LibrarySource } from './types';

/** What a merged row carries on top of its own entry. Absent on a plain entry. */
export interface FoundOn {
  /** Every source this sound is found on. */
  sources?: LibrarySource[];
  /** Every entry in the row, the shown one first, with its slot where it has one. */
  members?: { id: string; source: LibrarySource; name: string; slot?: string }[];
  /** SHA-256 of the bytes, when known. */
  fingerprint?: string;
  /** The slot of an unread Nord entry with this row's name and type. A hint: it claims nothing about the bytes. */
  sameNameOnNord?: string;
}
export interface Mergeable extends FoundOn { id: string; name: string; source: LibrarySource; slot?: string }
export interface MergeOptions<E> {
  /** The file type an entry is, for the same-name hint. Entries of different types never hint each other. */
  typeOf?: (e: E) => string | undefined;
}

/** Badges read in this order, whatever order the entries came in. */
const SOURCE_ORDER: LibrarySource[] = ['nord', 'local', 'backup', 'cloud'];
/** Which entry a row is shown as: a copy on this computer (a file inside a backup after a loose one), else the Nord's, else the cloud's. */
const SHOWN_ORDER: LibrarySource[] = ['local', 'backup', 'nord', 'cloud'];

const nameKey = (name: string, type: string | undefined) => `${type ?? ''}\u0000${name.trim().toLowerCase()}`;

export function mergeBySound<E extends Mergeable>(
  entries: E[], fingerprints: ReadonlyMap<string, string>, opts: MergeOptions<E> = {},
): E[] {
  // A cloud entry comes with its fingerprint; a file's is in `fingerprints` once it has been hashed.
  const printOf = (e: E) => fingerprints.get(e.id) ?? e.fingerprint;
  const groups = new Map<string, E[]>();
  // A Nord slot is a place of its own: the same program in a second slot keeps its row.
  const ownRow = new Set<E>();
  for (const e of entries) {
    const print = printOf(e);
    if (print === undefined) continue;
    const group = groups.get(print);
    if (!group) groups.set(print, [e]);
    else if (e.source === 'nord' && group.some((m) => m.source === 'nord')) ownRow.add(e);
    else group.push(e);
  }

  // An unread Nord slot says only its name and type: enough for a hint, never for a merge.
  const unreadNord = new Map<string, string>();
  for (const e of entries) {
    if (e.source === 'nord' && printOf(e) === undefined && e.slot && !unreadNord.has(nameKey(e.name, opts.typeOf?.(e)))) {
      unreadNord.set(nameKey(e.name, opts.typeOf?.(e)), e.slot);
    }
  }
  const hintFor = (e: E) => (e.source === 'nord' ? undefined : unreadNord.get(nameKey(e.name, opts.typeOf?.(e))));

  const done = new Set<string>();
  const rows: E[] = [];
  for (const e of entries) {
    const print = printOf(e);
    if (print === undefined || ownRow.has(e)) {
      const hint = hintFor(e);
      rows.push(hint ? { ...e, sameNameOnNord: hint } : e);
      continue;
    }
    if (done.has(print)) continue;
    done.add(print);
    const group = groups.get(print)!;
    const shown = SHOWN_ORDER.map((s) => group.find((m) => m.source === s)).find((m) => m !== undefined) ?? group[0];
    const members = [shown, ...group.filter((m) => m !== shown)];
    const hint = hintFor(shown);
    rows.push({
      ...shown,
      fingerprint: print,
      sources: SOURCE_ORDER.filter((s) => group.some((m) => m.source === s)),
      members: members.map((m) => ({ id: m.id, source: m.source, name: m.name, ...(m.slot ? { slot: m.slot } : {}) })),
      ...(hint ? { sameNameOnNord: hint } : {}),
    });
  }
  return rows;
}

/** Every source a row is found on; a plain entry is found on its own. */
export function foundOn(e: { source: LibrarySource; sources?: LibrarySource[] }): LibrarySource[] {
  return e.sources ?? [e.source];
}

/** How many rows are found on each source. A row on two sources counts under both. */
export function countFoundOn(rows: { source: LibrarySource; sources?: LibrarySource[] }[]): Record<LibrarySource, number> {
  const n: Record<LibrarySource, number> = { nord: 0, local: 0, backup: 0, cloud: 0 };
  for (const r of rows) for (const s of foundOn(r)) n[s]++;
  return n;
}

/** What a list's header and source facet say: rows on the Nord, rows on this
 *  computer (a loose file, a file inside a backup, or both: counted once), whether
 *  any is in the cloud, and whether there is more than one place to filter by. */
export function sourceFacets(rows: { source: LibrarySource; sources?: LibrarySource[] }[]) {
  let nordCount = 0, localCount = 0, cloudCount = 0;
  for (const r of rows) {
    const on = foundOn(r);
    if (on.includes('nord')) nordCount++;
    if (on.includes('local') || on.includes('backup')) localCount++;
    if (on.includes('cloud')) cloudCount++;
  }
  return { nordCount, localCount, showCloud: cloudCount > 0, showSourceFacet: [nordCount, localCount, cloudCount].filter((n) => n > 0).length > 1 };
}

/** Every id that names this row: its own first. A link or a selection made through any of them finds it. */
export function memberIds(e: Mergeable): string[] {
  return e.members ? e.members.map((m) => m.id) : [e.id];
}

/** Favourites were stored per entry before rows existed, and are stored by fingerprint and entry id since. Any of them marks the row. */
export function isFavoriteRow(favorites: ReadonlySet<string>, e: { id: string; fingerprint?: string; members?: { id: string }[] }): boolean {
  // Checked key by key, with nothing allocated: it runs per row on every sort.
  if (favorites.has(e.id) || (e.fingerprint !== undefined && favorites.has(e.fingerprint))) return true;
  return !!e.members?.some((m) => favorites.has(m.id));
}
/** Every key a row is marked by: its fingerprint, which survives the row being
 *  shown as another entry, and each entry's id, which survives the fingerprint
 *  going (a Nord slot unread again after a reconnect). Unmarking clears them all. */
export function favoriteKeysFor(e: Mergeable): string[] {
  const ids = memberIds(e);
  return e.fingerprint ? [e.fingerprint, ...ids] : ids;
}

/** The copy of this sound on this computer, if there is one. */
export function localMember(e: Mergeable): { id: string } | undefined {
  if (e.members) return e.members.find((m) => m.source === 'local');
  return e.source === 'local' ? e : undefined;
}

/** The copy of this sound on this computer: the local one, or the entry itself
 *  when it is shown as a file inside a backup.
 *  What can be shared; a row without one can be kept. */
export function copyHere(e: Mergeable): { id: string } | undefined {
  return localMember(e) ?? (e.source === 'backup' ? e : undefined);
}

/** The id of the copy imported into OpenNord's own storage, the one copy that can be removed. */
export function importedMember(e: Mergeable): string | undefined {
  return memberIds(e).find(isImported);
}

/** Where this sound is on the Nord now, whichever entry the row is shown as. A
 *  cloud item's slot is where it was when backed up, so it doesn't count. */
export function nordSlotOf(e: Mergeable): string | undefined {
  if (e.source === 'nord') return e.slot;
  return e.members?.find((m) => m.source === 'nord')?.slot;
}
