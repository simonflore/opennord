import { useCallback, useEffect, useRef, useState } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { sendLibraryFile, type SendProgress } from '@/lib/device/send-library';
import { STOPPED_ANSWERING, SessionLostError } from '@/lib/device/session';
import { SessionRefusedError } from '@/lib/device/protocol';
import { libraryFileRefusal } from '@/lib/device/library-file';
import {
  LIBRARY_READ_ONLY_REASON, NOT_YET_TRIED, NotStage4Error, NotYetTriedError, STAGE4_ONLY, WriteBlockedError, type LibraryKind,
} from '@/lib/device/write-guard';
import { NameTakenError, NoRoomError, StreamWriteError, afterErase, deviceName } from '@/lib/device/stream-write';
import { TransportLostError, TransportTimeoutError } from '@/lib/device/transport';
import { PARTITION_SAMP_LIB } from '@/lib/device/opcodes';
import { enumerateSampleLibrary } from '@/lib/device/samples';
import { useLibraryWrites } from './useLibraryWrites';

export const CONNECT_TO_SEND = 'Connect your Nord to send it.';

export interface SendSample {
  connected: boolean;
  busy: boolean;
  /** Progress or outcome of the last send, in plain words; '' when none. */
  status: string;
  /** Why Send is greyed for these bytes (or for any sample, without bytes); undefined when it can go. */
  refusal: (bytes?: Uint8Array) => string | undefined;
  send: (bytes: Uint8Array, name: string) => Promise<void>;
  clear: () => void;
}

export function sendProgressText(p: SendProgress): string {
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  return p.step === 'making-room' ? `Making room on your Nord… ${pct}%` : `Sending to your Nord… ${pct}%`;
}

/** The name a sample gets on the Nord: its file name without the sample extension, trimmed; never empty. */
export function sendNameFor(fileOrSampleName: string): string {
  return fileOrSampleName.replace(/\.nsmp[34]?$/i, '').trim() || 'Sample';
}

/** Said when the Nord refused to open its memory: something else holds it. */
export const NORD_BUSY = 'Your Nord is busy (a menu is open, or Nord Sound Manager is connected). Close it and try again.';

/**
 * Whether the session can't be trusted after `e`: the Nord stopped answering a
 * write (`sessionLost`), a reply never came (the next reply read could be a late
 * one for this request), or the session was already marked dead. Either way the
 * player reconnects before anything else.
 */
export function stoppedAnswering(e: unknown): boolean {
  return (e instanceof StreamWriteError && e.sessionLost) || e instanceof TransportTimeoutError || e instanceof SessionLostError;
}

/**
 * One plain sentence for a failed send (R5): no codes, places or sizes. The raw
 * error goes to the console (the caller's job). A file the Nord may have kept is
 * said honestly, since sending again could then make a second copy.
 */
export function sendFailureText(kind: LibraryKind, e: unknown): string {
  const what = kind === 'sample' ? 'sample' : 'piano';
  const mayBeKept = `The ${what} may be on your Nord now; check it there before sending again.`;
  // Making room cleared space the Nord had already freed: its samples are as they were, but not "nothing".
  const unchanged = afterErase(e) ? `Your ${what}s are unchanged.` : 'Nothing was changed.';
  if (stoppedAnswering(e)) {
    return e instanceof StreamWriteError && e.mayBeKept ? `${STOPPED_ANSWERING} ${mayBeKept}` : STOPPED_ANSWERING;
  }
  if (e instanceof TransportLostError) return 'Your Nord was disconnected.';
  if (e instanceof NotStage4Error) return STAGE4_ONLY[e.kind];
  if (e instanceof WriteBlockedError) return LIBRARY_READ_ONLY_REASON[kind];
  if (e instanceof NotYetTriedError) return NOT_YET_TRIED[e.kind];
  if (e instanceof SessionRefusedError) return NORD_BUSY;
  if (e instanceof NoRoomError) {
    return `There isn’t room for this ${what} on your Nord. Remove some ${what}s there, then try again. ${unchanged}`;
  }
  if (e instanceof NameTakenError) {
    return `Your Nord already has a ${what} with this name. Rename it, then try again. ${unchanged}`;
  }
  if (e instanceof StreamWriteError && e.mayBeKept) return mayBeKept;
  return `The Nord didn’t accept the ${what}. ${unchanged}`;
}

/**
 * The status after a failed send. A refusal sentence (the gate, the model) stands
 * alone; anything else follows "Couldn’t send:".
 */
export function sendFailureStatus(kind: LibraryKind, e: unknown): string {
  const text = sendFailureText(kind, e);
  return e instanceof NotYetTriedError || e instanceof NotStage4Error ? text : `Couldn’t send: ${text}`;
}

/**
 * Send a sample to the connected Nord (spec §11): an empty place only, a taken name
 * numbered, the fit checked first. One send at a time; afterwards the Nord's sample
 * list is read again. Callers show the button only while `connected`, but should
 * keep `status` in view after a send: a Nord that stopped answering is forgotten
 * at once (`connected` turns false) and `status` says what to do.
 */
export function useSendSample(): SendSample {
  const { session, setSampleEntries, isCurrent, markLost } = useDevice();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const busyRef = useRef(false); // a double click lands before the re-render that disables the button
  const writes = useLibraryWrites(); // follows the /dev/hardware switch, so the refusal re-renders

  // What was said about one Nord doesn't carry over to the next. Losing the Nord
  // (no session) keeps it: that is when "unplug it and plug it back in" matters.
  const saidAbout = useRef(session);
  useEffect(() => {
    if (!session || session === saidAbout.current) return;
    saidAbout.current = session;
    setStatus('');
  }, [session]);

  const refusal = useCallback((bytes?: Uint8Array): string | undefined => {
    if (!session) return CONNECT_TO_SEND;
    if (!writes.sample) return NOT_YET_TRIED.sample;
    if (!session.stage4Layout) return STAGE4_ONLY.sample;
    if (!session.canWrite(PARTITION_SAMP_LIB)) return LIBRARY_READ_ONLY_REASON.sample;
    return bytes ? libraryFileRefusal('sample', bytes) : undefined;
  }, [session, writes]);

  const send = useCallback(async (bytes: Uint8Array, name: string) => {
    if (!session || busyRef.current) return;
    const refused = refusal(bytes);
    if (refused) { setStatus(refused); return; }
    busyRef.current = true;
    setBusy(true);
    setStatus('Getting your Nord ready…');
    try {
      const sent = await sendLibraryFile(session, 'sample', bytes, name, { onProgress: (p) => setStatus(sendProgressText(p)) });
      // The Nord keeps a long name cut short; only a numbered name means it had one already.
      setStatus(sent.name === deviceName(name)
        ? `Sent “${sent.name}” to your Nord.`
        : `Sent to your Nord as “${sent.name}”: it already had a sample called “${name}”.`);
      enumerateSampleLibrary(session)
        .then((list) => { if (isCurrent(session)) setSampleEntries(list); })
        .catch(() => undefined); // the list just stays as it was
    } catch (e) {
      console.warn('[send] sending a sample failed', e);
      // Before anything else can read from it: the replies are out of step.
      if (stoppedAnswering(e)) markLost(session, STOPPED_ANSWERING);
      setStatus(sendFailureStatus('sample', e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [session, refusal, isCurrent, setSampleEntries, markLost]);

  const clear = useCallback(() => setStatus(''), []);

  return { connected: !!session, busy, status, refusal, send, clear };
}
