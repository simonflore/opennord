/**
 * Send one sample (or, once its gate opens, one piano) to an empty place on the Nord,
 * as NSM's download queue does:
 * read the partition list (block size, alignment, erase flag), then in one begin…end:
 * state and banks, the file list, the fit check, an erase when short, the streamed
 * write. Nothing is replaced: a taken name is numbered (`deviceFreeName`), and only an
 * empty place is used. Runs under the session lock with a 60 s bound per reply.
 */
import type { NordSession } from './session';
import { NordError } from './protocol';
import { readPartitionList, type PartitionInfo } from './partition-list';
import { readPartitionCapacity } from './capacity';
import { enumerateFiles } from './transfer';
import { noFreePlaceReason, planFit } from './fit';
import { firstFreeLocation } from './locations';
import {
  NoRoomError, StreamWriteError, createFileStreamed, deviceFreeName, eraseBlocks, markAfterErase, writeChunkBytes,
} from './stream-write';
import { LIBRARY_PARTITION, LIBRARY_PARTITION_NAME, libraryFileRefusal } from './library-file';
import {
  LIBRARY_READ_ONLY_REASON, NotStage4Error, NotYetTriedError, WriteBlockedError, libraryWritesOn, type LibraryKind,
} from './write-guard';
import { cbinFraming } from '../clavia/cbin';
import { TransportTimeoutError } from './transport';

/** NSM's bound on each reply (60 s per request). */
export const REQUEST_TIMEOUT_MS = 60_000;

export interface SendProgress { step: 'making-room' | 'sending'; done: number; total: number }
/** Where the file went, and the name the Nord keeps for it. */
export interface SentFile { bank: number; slot: number; name: string }
export interface SendOptions {
  onProgress?: (p: SendProgress) => void;
  /** The hardware gate; defaults to {@link libraryWritesOn}. */
  enabled?: boolean;
  /** For tests: how the erase poll waits. */
  sleep?: (ms: number) => Promise<void>;
  /**
   * The place the player chose. Used when it is still empty when the send starts; a place
   * filled meanwhile refuses the send (nothing is replaced) rather than going elsewhere.
   * Absent: the first empty place, as before.
   */
  at?: { bank: number; slot: number };
}

/**
 * The library's partition record, checked: at the expected index, under its own name.
 * The list carries no writable flag (partition-list.ts); write permission is
 * `session.canWrite`, checked before any frame by {@link sendLibraryFile}.
 */
export function libraryPartitionInfo(list: PartitionInfo[], kind: LibraryKind): PartitionInfo {
  const info = list[LIBRARY_PARTITION[kind]];
  if (!info || info.name !== LIBRARY_PARTITION_NAME[kind]) {
    throw new NordError(`OpenNord couldn’t find your Nord’s ${kind} memory where it expected it, so nothing was changed.`);
  }
  return info;
}

/**
 * `session.bracket`, for a library write: a reply that never came (a streamed write
 * whose abort close the Nord never answered, or any other reply timeout, the begin's
 * too) leaves the replies out of step. The session is then abandoned and marked dead,
 * so the bracket sends no end and nothing queued behind this runs on it; a stream
 * error is marked `sessionLost`, for the UI to ask the player to reconnect. Shared
 * with the restore (backup.ts) and the hardware checks (hw-checks.ts).
 */
export async function bracketUnlessLost<T>(session: NordSession, partition: number, fn: () => Promise<T>): Promise<T> {
  const loseOn = (e: unknown) => {
    const lostClose = e instanceof StreamWriteError && e.closeStatus === undefined;
    if (!lostClose && !(e instanceof TransportTimeoutError)) return;
    if (lostClose) e.sessionLost = true;
    session.abandon();
    session.markDead();
  };
  try {
    return await session.bracket(partition, () => fn().catch((e: unknown) => { loseOn(e); throw e; }));
  } catch (e) {
    loseOn(e); // the begin's own timeout (fn's already did it; doing it twice is harmless)
    throw e;
  }
}

export function sendLibraryFile(
  session: NordSession, kind: LibraryKind, bytes: Uint8Array, name: string, opts: SendOptions = {},
): Promise<SentFile> {
  return session.exclusive(async () => {
    // Every refusal below comes before the first frame.
    if (!(opts.enabled ?? libraryWritesOn(kind))) throw new NotYetTriedError(kind);
    // Tried on a Stage 4 only: another model whose libraries are confirmed writable
    // (a Stage 2 on a current OS, connect-probe.ts) never gets a library write.
    if (!session.stage4Layout) throw new NotStage4Error(kind);
    const refused = libraryFileRefusal(kind, bytes);
    if (refused) throw new NordError(refused);
    const partition = LIBRARY_PARTITION[kind];
    if (!session.canWrite(partition)) throw new WriteBlockedError(LIBRARY_READ_ONLY_REASON[kind]);
    return session.withReplyTimeout(REQUEST_TIMEOUT_MS, async () => {
      // A reply that never came, before the bracket too: the replies are out of step.
      const list = await readPartitionList(session).catch((e: unknown) => {
        if (e instanceof TransportTimeoutError) session.markDead();
        throw e;
      });
      const info = libraryPartitionInfo(list, kind);
      // A piece size larger than one transfer refuses here, before anything is erased.
      const chunkBytes = writeChunkBytes(info.writeAlign);
      return bracketUnlessLost(session, partition, async () => {
        const cap = await readPartitionCapacity(session, partition, { blockBytes: info.blockBytes });
        // Strict: a file that can't be read must not leave its place looking empty.
        const onNord = await enumerateFiles(session, Infinity, { strict: true });
        const fit = planFit(cap, info, [cbinFraming(bytes).recordBytes], { label: kind });
        // An unreadable layout (no block size) is not "no room": it stays a plain refusal.
        if (!fit.fits) throw info.blockBytes > 0 ? new NoRoomError(fit.reason) : new NordError(fit.reason);
        const at = firstFreeLocation(onNord, cap.banks, opts.at && { prefer: opts.at });
        if (!at) throw new NoRoomError(noFreePlaceReason(kind));
        if (opts.at && (at.bank !== opts.at.bank || at.slot !== opts.at.slot)) {
          throw new NordError(`The place you chose on your Nord isn’t empty any more, so nothing was sent. Pick another.`);
        }
        // Before any erase: a name the Nord has (as it keeps names, cut at 128 bytes) is numbered.
        const sendName = deviceFreeName(name, onNord.map((e) => e.name));
        try {
          await eraseBlocks(session, fit.eraseBlocks, {
            sleep: opts.sleep,
            onProgress: (done, total) => opts.onProgress?.({ step: 'making-room', done, total }),
          });
          const where = await createFileStreamed(session, { bytes, name: sendName, ...at }, {
            chunkBytes,
            onProgress: (done, total) => opts.onProgress?.({ step: 'sending', done, total }),
          });
          return { ...where, name: sendName };
        } catch (e) {
          // Making room (even part of it) changed the Nord's free space, if not its samples.
          if (fit.eraseBlocks > 0) markAfterErase(e);
          throw e;
        }
      });
    });
  });
}
