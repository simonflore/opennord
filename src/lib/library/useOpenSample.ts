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
  | { state: 'open'; sample: { id: string; bytes: Uint8Array; name: string }; factory: boolean };

type Read = { key: string; pct: number | null; bytes?: Uint8Array; error?: string };

/**
 * The open sample's bytes, read once per sample, source and retry: when the
 * route names another sample, a retry, a new Nord session for a Nord sample, or
 * a sample named before it's listed (a deep link while the folder scans)
 * arriving. A rescan that drops and re-adds the open entry keeps its bytes.
 * The read in flight is let go when the route moves on (SamplesContext then
 * drops a Nord pull still waiting for the session).
 */
export function useOpenSample(id: string | undefined): OpenSample {
  const { entryById, readSample, readKey } = useSamplesState();
  const entry = id ? entryById(id) : undefined;
  const [attempt, setAttempt] = useState(0);
  const key = entry ? `${readKey(entry)}\n${attempt}` : null;
  const [read, setRead] = useState<Read | null>(null);

  // The lookup and reader change identity often; the effect reads them here.
  const io = useRef({ entryById, readSample });
  useEffect(() => { io.current = { entryById, readSample }; });

  const current = useRef<{ id: string; key: string; stop: AbortController } | null>(null);
  const letGo = useCallback(() => { current.current?.stop.abort(); current.current = null; }, []);
  useEffect(() => letGo, [letGo]);
  useEffect(() => {
    if (current.current && current.current.id !== id) { letGo(); setRead(null); }
    // Not listed right now (keep what was read), or this read has already started.
    if (!id || !key || current.current?.key === key) return;
    const e = io.current.entryById(id);
    if (!e) return;
    letGo();
    const stop = new AbortController();
    current.current = { id, key, stop };
    const live = () => !stop.signal.aborted;
    setRead({ key, pct: e.source === 'nord' ? 0 : null });
    io.current.readSample(e, (pct) => { if (live()) setRead({ key, pct }); }, stop.signal).then(
      (bytes) => { if (live()) setRead({ key, pct: null, bytes }); },
      (err) => { if (live()) setRead({ key, pct: null, error: `Could not read ${e.name}: ${getErrorMessage(err)}` }); },
    );
  }, [id, key, letGo]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const bytes = read?.key === key ? read?.bytes : undefined;
  const name = entry?.name;
  // One object per read, so the inspector loads it once.
  const sample = useMemo(() => (id && bytes && name ? { id, bytes, name } : null), [id, bytes, name]);

  if (!id) return { state: 'none' };
  if (!entry) return { state: 'missing' };
  if (sample) return { state: 'open', sample, factory: !!entry.factory };
  if (read?.key === key && read.error) return { state: 'failed', error: read.error, retry };
  return { state: 'reading', pct: read?.key === key ? read.pct : null };
}
