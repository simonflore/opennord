import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useCapabilities } from '../capabilities/CapabilitiesContext';
import type { CloudItem, CloudSnapshot } from '../capabilities/types';
import { getErrorMessage } from '../errors';

export type CloudStatus = 'absent' | 'signed-out' | 'loading' | 'ready' | 'empty' | 'failed';

/** The latest cloud snapshot as a Library source: its items, and the files fetched from it so far. */
export interface CloudSnapshotState {
  status: CloudStatus;
  takenAt?: string;
  /** Empty unless the status is 'ready'. */
  items: CloudItem[];
  /** Fingerprint → bytes, for every file fetched this session. */
  files: ReadonlyMap<string, Uint8Array>;
  /** Fingerprints being fetched now. */
  reading: ReadonlySet<string>;
  /** Fingerprint → why its fetch failed. Fetched again only when `read` is called again. */
  failed: ReadonlyMap<string, string>;
  /** Fetch one file, once: a call while it is being fetched, or after it arrived, does nothing. */
  read: (fingerprint: string) => void;
  /** Load the snapshot again (after a backup made a new one). */
  refresh: () => void;
}

const noop = () => {};
const EMPTY_FETCHED = { files: new Map<string, Uint8Array>(), reading: new Set<string>(), failed: new Map<string, string>() };
// One empty list, so a status without items doesn't rebuild every list's cloud entries.
const NO_ITEMS: CloudItem[] = [];
const ABSENT: CloudSnapshotState = Object.freeze({ status: 'absent' as const, items: NO_ITEMS, ...EMPTY_FETCHED, read: noop, refresh: noop });

const Ctx = createContext<CloudSnapshotState>(ABSENT);

/**
 * The user's latest snapshot, loaded when someone is signed in, again when the
 * user changes and when `refresh` is called. Everything here belongs to the user
 * it was loaded for: after a sign-out or a different sign-in, none of it shows.
 */
export function CloudSnapshotProvider({ children }: { children: ReactNode }) {
  const { cloud, auth } = useCapabilities();
  const canRead = !!cloud.latestSnapshot && !!cloud.fetchItem;
  // Compared by id: getUser() may hand back a fresh object every call.
  const userId = useSyncExternalStore(
    useCallback((onChange: () => void) => auth.subscribe(onChange), [auth]),
    () => auth.getUser()?.id ?? null,
  );

  const [refreshes, setRefreshes] = useState(0);
  const [load, setLoad] = useState<{ for: string; snapshot?: CloudSnapshot | null; error?: boolean } | null>(null);
  useEffect(() => {
    if (!canRead || !userId) return;
    let live = true;
    cloud.latestSnapshot!().then(
      (snapshot) => { if (live) setLoad({ for: userId, snapshot }); },
      () => { if (live) setLoad({ for: userId, error: true }); },
    );
    return () => { live = false; };
  }, [cloud, canRead, userId, refreshes]);
  const refresh = useCallback(() => setRefreshes((n) => n + 1), []);

  const [fetched, setFetched] = useState<{ for: string | null; files: ReadonlyMap<string, Uint8Array>; reading: ReadonlySet<string>; failed: ReadonlyMap<string, string> }>(
    () => ({ for: null, ...EMPTY_FETCHED }));
  // Whose files are kept, and which are here or on their way: read synchronously,
  // so two calls in one tick share one fetch and a file already here is never
  // fetched again. Another user's (a sign-out and a sign-in) start over.
  const kept = useRef<{ for: string | null; here: Set<string>; busy: Set<string> }>({ for: null, here: new Set(), busy: new Set() });

  const read = useCallback((fingerprint: string) => {
    const fetchItem = cloud.fetchItem;
    if (!fetchItem || !userId) return;
    if (kept.current.for !== userId) kept.current = { for: userId, here: new Set(), busy: new Set() };
    const mine = kept.current;
    if (mine.busy.has(fingerprint) || mine.here.has(fingerprint)) return;
    mine.busy.add(fingerprint);
    const user = userId;
    setFetched((prev) => {
      const base = prev.for === user ? prev : { for: user, ...EMPTY_FETCHED };
      return { ...base, reading: new Set(base.reading).add(fingerprint), failed: without(base.failed, fingerprint) };
    });
    // One update when the fetch settles (every list provider reads this context),
    // and none when it settles for a user who is no longer the one signed in.
    const settle = (change: (f: typeof fetched) => Partial<typeof fetched>) => {
      mine.busy.delete(fingerprint);
      setFetched((prev) => (prev.for === user ? { ...prev, ...change(prev), reading: without(prev.reading, fingerprint) } : prev));
    };
    fetchItem(fingerprint).then(
      (bytes) => {
        mine.here.add(fingerprint);
        settle((f) => ({ files: new Map(f.files).set(fingerprint, bytes) }));
      },
      (e: unknown) => settle((f) => ({ failed: new Map(f.failed).set(fingerprint, getErrorMessage(e)) })),
    );
  }, [cloud, userId]);

  const value = useMemo<CloudSnapshotState>(() => {
    if (!canRead) return ABSENT;
    const mine = fetched.for === userId ? fetched : EMPTY_FETCHED;
    const base = { files: mine.files, reading: mine.reading, failed: mine.failed, read, refresh, items: NO_ITEMS };
    if (!userId) return { ...base, status: 'signed-out' };
    // A refresh keeps showing the snapshot it replaces until the new one is here.
    if (load?.for !== userId) return { ...base, status: 'loading' };
    if (load.error) return { ...base, status: 'failed' };
    if (!load.snapshot) return { ...base, status: 'empty' };
    return { ...base, status: 'ready', takenAt: load.snapshot.takenAt, items: load.snapshot.items };
  }, [canRead, userId, load, fetched, read, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function without<K, V>(from: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V>;
function without<K>(from: ReadonlySet<K>, key: K): ReadonlySet<K>;
function without<K, V>(from: ReadonlyMap<K, V> | ReadonlySet<K>, key: K) {
  if (!from.has(key)) return from;
  if (from instanceof Map) { const m = new Map(from); m.delete(key); return m; }
  const s = new Set(from as ReadonlySet<K>); s.delete(key); return s;
}

/** The cloud source. Without a provider, or in a build without cloud reads, it is absent. */
export function useCloudSnapshot(): CloudSnapshotState {
  return useContext(Ctx);
}

/**
 * Fetch a cloud-only entry's file when it is shown, as a Nord slot is read when
 * it is opened. A fetch that failed waits for `retry`. `fingerprint` is set
 * while the entry is cloud-only and its bytes aren't here.
 */
export function useCloudRead(
  entry: { source: string; bytes?: Uint8Array; fingerprint?: string } | undefined,
  cloud: Pick<CloudSnapshotState, 'read' | 'failed'> | undefined,
): { fingerprint?: string; failed?: string; retry: () => void } {
  const fingerprint = entry && entry.source === 'cloud' && !entry.bytes ? entry.fingerprint : undefined;
  const failed = fingerprint ? cloud?.failed.get(fingerprint) : undefined;
  const read = cloud?.read;
  // `read` itself skips a file that is being fetched or is here already.
  useEffect(() => {
    if (fingerprint && read && failed === undefined) read(fingerprint);
  }, [fingerprint, read, failed]);
  const retry = useCallback(() => { if (fingerprint) read?.(fingerprint); }, [fingerprint, read]);
  return { fingerprint, failed, retry };
}
