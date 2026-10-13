import { useCallback, useMemo, useRef, useState } from 'react';
import type { NordSession } from '../device/session';
import { pullProgram, type ProgramEntry } from '../device/transfer';
import { getErrorMessage } from '../errors';
import { nordEntryWithProgram } from './entries';
import type { LibraryEntry } from './types';

/** What `useNordReads` hands the Library: the Nord's entries with every program
 *  read so far, and the read of one more. */
export interface NordReads {
  entries: LibraryEntry[];
  /** The entry being read from the Nord now, if any. */
  reading: string | null;
  /** The last read that failed, and why; a reconnect or a refresh forgets it. */
  failed: { id: string; message: string } | null;
  /** Read the program in entry `id` from the Nord. Does nothing while another read runs. */
  read: (id: string) => void;
}

/**
 * The Nord's programs, read into the Library as they're opened, so a slot shows
 * and sends like any file. What was read belongs to the list it was read for:
 * the Nord re-enumerates after a send, a delete or a reconnect, and a slot may
 * hold something else then, so the reads (and a failure) go with the old list.
 */
export function useNordReads(session: NordSession | null, deviceEntries: ProgramEntry[], base: LibraryEntry[]): NordReads {
  const [reads, setReads] = useState<{ for: ProgramEntry[]; read: ReadonlyMap<ProgramEntry, LibraryEntry> }>(
    () => ({ for: deviceEntries, read: new Map() }));
  const [reading, setReading] = useState<{ for: ProgramEntry[]; id: string } | null>(null);
  const [failed, setFailed] = useState<{ for: ProgramEntry[]; id: string; message: string } | null>(null);
  // One read at a time: the Nord answers one request at a time anyway, and a
  // read queued behind it would be for a program the user has already left.
  // Per list, so a read that never came back (a Nord that stopped answering)
  // doesn't hold up the next Nord's.
  const busy = useRef<ProgramEntry[] | null>(null);

  const read = useCallback((id: string) => {
    const at = base.findIndex((e) => e.id === id); // base lines up with deviceEntries
    if (!session || at < 0 || busy.current === deviceEntries) return;
    const list = deviceEntries;
    const entry = list[at];
    busy.current = list;
    setReading({ for: list, id });
    setFailed(null);
    void session.withSession(session.programPartition, () => pullProgram(session, entry))
      .then((bytes) => {
        const opened = nordEntryWithProgram(base[at], bytes);
        setReads((prev) => ({ for: list, read: new Map(prev.for === list ? prev.read : []).set(entry, opened) }));
      })
      .catch((e: unknown) => setFailed({ for: list, id, message: getErrorMessage(e) }))
      .finally(() => {
        if (busy.current === list) busy.current = null;
        setReading((r) => (r?.for === list ? null : r));
      });
  }, [session, deviceEntries, base]);

  // Only the entries that were read change, so the rest keep their identity
  // (and their memoised table rows).
  const current = reads.for === deviceEntries ? reads.read : null;
  const entries = useMemo(() => (current?.size
    ? base.map((e, i) => current.get(deviceEntries[i]) ?? e)
    : base), [base, current, deviceEntries]);

  return {
    entries,
    reading: reading?.for === deviceEntries ? reading.id : null,
    // As it is (the same object across renders), so effects that read it don't rerun.
    failed: failed?.for === deviceEntries ? failed : null,
    read,
  };
}
