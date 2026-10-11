import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '../errors';
import { useSamplesState } from './SamplesContext';

/** The sample a route names, as the detail shows it. */
export type OpenSample =
  | { state: 'none' }
  /** Named but not in the list right now (not loaded yet, removed, or gone with its Nord). */
  | { state: 'missing' }
  /** `pct` only for a Nord pull; a file or backup reads without progress. */
  | { state: 'reading'; pct: number | null }
  | { state: 'failed'; error: string; retry: () => void }
  /** `listed` false: its bytes are in hand, but the entry isn't in the list right
   *  now (a rescan in progress, or removed), so the inspector stays and says so. */
  | { state: 'open'; sample: { id: string; bytes: Uint8Array; name: string }; factory: boolean; listed: boolean };

type Read = { id: string; key: string; name: string; factory: boolean; pct: number | null; bytes?: Uint8Array; error?: string };

/**
 * The open sample's bytes, read once per sample, source and retry: when the
 * route names another sample, a retry, a new Nord session for a Nord sample, or
 * a sample named before it's listed (a deep link while the folder scans)
 * arriving. If the entry leaves the list once read (removed, or gone with its
 * Nord), the sample stays open and says so. A read in flight is let go when the
 * route moves on or the entry leaves the list (SamplesContext then drops a Nord
 * pull still waiting for the session).
 */
export function useOpenSample(id: string | undefined): OpenSample {
  const { entryById, readSample, readKey } = useSamplesState();
  const entry = id ? entryById(id) : undefined;
  // A local sample (a folder file, an import) has its bytes in hand: it opens
  // straight away, and new bytes (a refresh, a save) open as they arrive.
  const inHand = entry?.source === 'local' ? entry.bytes : undefined;
  const [attempt, setAttempt] = useState(0);
  const key = entry && !inHand ? `${readKey(entry)}\n${attempt}` : null;
  const [read, setRead] = useState<Read | null>(null);

  // The lookup and reader change identity often; the effect reads them here.
  const io = useRef({ entryById, readSample });
  useEffect(() => { io.current = { entryById, readSample }; });

  const current = useRef<{ id: string; key: string; stop: AbortController; settled: boolean } | null>(null);
  const letGo = useCallback(() => { current.current?.stop.abort(); current.current = null; }, []);
  useEffect(() => letGo, [letGo]);
  useEffect(() => {
    if (current.current && current.current.id !== id) { letGo(); setRead(null); }
    if (!id) return;
    if (!key) { // not in the list right now (or in hand): keep what was read, stop what wasn't
      if (current.current && !current.current.settled) letGo();
      return;
    }
    if (current.current?.key === key) return; // this read has already started
    const e = io.current.entryById(id);
    if (!e) return;
    letGo();
    const reading = { id, key, stop: new AbortController(), settled: false };
    current.current = reading;
    const live = () => !reading.stop.signal.aborted;
    const base = { id, key, name: e.name, factory: !!e.factory };
    setRead({ ...base, pct: e.source === 'nord' ? 0 : null });
    io.current.readSample(e, (pct) => { if (live()) setRead({ ...base, pct }); }, reading.stop.signal).then(
      (bytes) => { if (live()) { reading.settled = true; setRead({ ...base, pct: null, bytes }); } },
      (err) => {
        if (!live()) return;
        reading.settled = true;
        setRead({ ...base, pct: null, error: `Could not read ${e.name}: ${getErrorMessage(err)}` });
      },
    );
  }, [id, key, letGo]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  // This read's result: for the current key, or (while the entry is unlisted) the last one for this sample.
  const mine = read && read.id === id && (key === null || read.key === key) ? read : null;
  // One object per read, so the inspector loads it once.
  const sample = useMemo(
    () => (mine?.bytes ? { id: mine.id, bytes: mine.bytes, name: mine.name } : null),
    [mine?.id, mine?.bytes, mine?.name],
  );

  const name = entry?.name;
  const handed = useMemo(() => (id && inHand && name ? { id, bytes: inHand, name } : null), [id, inHand, name]);

  if (!id) return { state: 'none' };
  if (handed) return { state: 'open', sample: handed, factory: !!entry?.factory, listed: true };
  // The factory tag as the entry has it now (a backup's origin can resolve after
  // its bytes do), or as it was when read while the entry is unlisted.
  if (sample) return { state: 'open', sample, factory: entry ? !!entry.factory : !!mine?.factory, listed: !!entry };
  if (!entry) return { state: 'missing' };
  if (mine?.error) return { state: 'failed', error: mine.error, retry };
  return { state: 'reading', pct: mine?.pct ?? null };
}
