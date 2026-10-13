import { useEffect, useMemo, useRef, useState } from 'react';

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource); // the view itself: no copy of a file that can be 20 MB
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Remembered against the bytes object itself: a re-render never rehashes, and a
// rescan (new byte arrays) does. Not keyed by name and size — every program of a
// type has the same size, so an edited file would keep a stale fingerprint.
const known = new WeakMap<Uint8Array, string>();
const running = new WeakMap<Uint8Array, Promise<string>>();

/** The fingerprint of these bytes, hashed once however many ask. */
export function fingerprintOf(bytes: Uint8Array): Promise<string> {
  let p = running.get(bytes);
  if (!p) {
    p = sha256Hex(bytes).then((hex) => { known.set(bytes, hex); return hex; });
    running.set(bytes, p);
  }
  return p;
}

/** How long hashes are gathered before the list re-renders with them: a folder of a thousand files merges in a few steps, not a thousand. */
const FLUSH_MS = 60;

/**
 * The fingerprint of every entry whose bytes are here, by entry id, filled in as
 * hashes complete. The list it feeds never waits: an entry is a row of its own
 * until its fingerprint arrives, then merges.
 */
export function useFingerprints(entries: readonly { id: string; bytes?: Uint8Array }[]): ReadonlyMap<string, string> {
  // Bumped when hashes finish, so the map below is rebuilt from `known`.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flushSoon = () => { timer ??= setTimeout(() => { timer = undefined; if (live) setTick((n) => n + 1); }, FLUSH_MS); };
    (async () => {
      // One at a time: a sample or piano can be tens of megabytes.
      for (const e of entries) {
        if (!live) return;
        if (!e.bytes || known.has(e.bytes)) continue;
        try { await fingerprintOf(e.bytes); flushSoon(); } catch { /* unreadable bytes stay a row of their own */ }
      }
    })();
    return () => { live = false; if (timer) clearTimeout(timer); };
  }, [entries]);

  // Read from what is known now, so it is always in step with `entries`; only
  // when the entries change or hashes land, not on every render of the list. The
  // same Map is returned while nothing changed: consumers memoise on it.
  const last = useRef<ReadonlyMap<string, string>>(new Map());
  return useMemo(() => {
    void tick;
    const next = new Map<string, string>();
    for (const e of entries) {
      const hex = e.bytes && known.get(e.bytes);
      if (hex) next.set(e.id, hex);
    }
    const same = next.size === last.current.size && [...next].every(([id, hex]) => last.current.get(id) === hex);
    if (!same) last.current = next;
    return last.current;
  }, [entries, tick]);
}
