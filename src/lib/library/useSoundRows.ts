import { useMemo, useRef } from 'react';
import { countFoundOn, memberIds, mergeBySound, sourceFacets, type Mergeable, type MergeOptions } from './found-on';
import { useFingerprints } from './useFingerprints';

/**
 * One row per sound for a list: its entries here and on the Nord (`all`, kept
 * as it is for backup and the share picker) plus its cloud entries, merged where
 * the bytes are the same. Every member id resolves to its row (`byId`), so a
 * link or a selection made through any of them keeps working as rows merge.
 * `opts` must keep its functions' identity across renders (module-level
 * functions), or the rows are rebuilt on every render; `fingerprint` picks which
 * entries are worth hashing (all that have bytes, by default).
 */
export function useSoundRows<E extends Mergeable & { bytes?: Uint8Array }>(
  all: E[], cloudEntries: E[] = NONE as E[],
  opts?: MergeOptions<E> & { fingerprint?: (entries: E[]) => E[] },
) {
  const toHash = opts?.fingerprint;
  const hashed = useMemo(() => (toHash ? toHash(all) : all), [all, toHash]);
  const localPrints = useFingerprints(hashed);
  const typeOf = opts?.typeOf;
  const last = useRef(new Map<string, E>());
  const rows = useMemo(() => {
    const merged = mergeBySound([...all, ...cloudEntries], localPrints, { typeOf });
    // A merged row is a new object on every rebuild (and rows rebuild as hashes
    // and cloud files arrive): keep the previous one while nothing in it changed,
    // so memoised list rows re-render only for the rows that did.
    const next = new Map<string, E>();
    const stable = merged.map((r) => {
      if (!r.fingerprint) return r;
      const before = last.current.get(r.fingerprint);
      const row = before && sameRow(before, r) ? before : r;
      next.set(r.fingerprint, row);
      return row;
    });
    last.current = next;
    return stable;
  }, [all, cloudEntries, localPrints, typeOf]);
  const byId = useMemo(() => {
    const m = new Map<string, E>(all.map((e) => [e.id, e]));   // a plain entry, when it is in no row yet
    for (const r of rows) for (const id of memberIds(r)) m.set(id, r);
    return m;
  }, [all, rows]);
  const found = useMemo(() => countFoundOn(rows), [rows]);
  const facets = useMemo(() => sourceFacets(rows), [rows]);
  return { rows, byId, found, ...facets };
}

const NONE: never[] = [];

/** Whether two rows show the same: every field the same value, members and sources alike. */
function sameRow<E extends Mergeable>(a: E, b: E): boolean {
  const keys = Object.keys(b) as (keyof E)[];
  if (keys.length !== Object.keys(a).length) return false;
  return keys.every((k) => {
    if (k === 'members') {
      return !!a.members && !!b.members && a.members.length === b.members.length
        && a.members.every((m, i) => m.id === b.members![i].id && m.name === b.members![i].name && m.source === b.members![i].source && m.slot === b.members![i].slot);
    }
    if (k === 'sources') return a.sources?.join() === b.sources?.join();
    return a[k] === b[k];
  });
}

/** The entries whose bytes are as long as another's: without anything else to
 *  match against, only those can be the same file. */
export function sameSizeOnly<E extends { bytes?: Uint8Array }>(all: E[]): E[] {
  const sizes = new Map<number, number>();
  for (const e of all) if (e.bytes) sizes.set(e.bytes.length, (sizes.get(e.bytes.length) ?? 0) + 1);
  return all.filter((e) => e.bytes && sizes.get(e.bytes.length)! > 1);
}
