/**
 * Checks for the hardware session. Not used
 * by the product: only the dev-only /dev/hardware page calls them.
 *
 * W3: write a program in two pieces to an empty program slot and see whether the Nord
 * answers after the first piece (NSM streams every chunk and reads one answer, after
 * the last: `Download_SendNextChunkAsyncNoTimeout`). Either way the file
 * is completed and committed, so the slot ends up with a whole program called
 * "OPENNORD 2PIECE" (numbered if that name is taken). Nothing is ever replaced: the
 * slot is the first one the program list shows empty, read in the same begin…end.
 *
 * A failure follows the streamed writer's path (stream-write.ts): drain late replies,
 * abort with FileClose, and throw {@link StreamWriteError}; an abort close the Nord
 * never answers leaves the session dead and the error `sessionLost`
 * (`bracketUnlessLost`), for the page to forget the Nord.
 */
import type { NordSession } from './session';
import type { Addr } from './reorg';
import { NordError } from './protocol';
import { TransportTimeoutError } from './transport';
import { CReqFileClose, CReqFileWrite } from './opcodes';
import { readPartitionList, PART_FLAG } from './partition-list';
import { readPartitionCapacity } from './capacity';
import { enumerateFiles, pushRefusal } from './transfer';
import { firstFreeLocation } from './locations';
import {
  StreamWriteError, WRITE_REPLY_TIMEOUT_MS, abortOpenFile, openNewFile, writeAckTimeoutMs, type NewFile, type WriteProgress,
} from './stream-write';
import { REQUEST_TIMEOUT_MS, bracketUnlessLost } from './send-library';
import { WriteBlockedError, type LibraryKind } from './write-guard';
import { cbinRecord } from '../clavia/cbin';
import { freeName } from '../clavia/name';

export type ChunkAcks = 'one-answer' | 'answer-per-piece';

/** The name the two-piece write gives its program (numbered when taken). */
export const TWO_PIECE_NAME = 'OPENNORD 2PIECE';

/** Most replies read after the last piece's answer, or before the close's own reply. */
const MAX_LATE = 8;

export interface ChunkAckObservation {
  /** The place the Nord used (its create reply). */
  at: Addr;
  acks: ChunkAcks;
  /** Bytes in each piece. */
  pieces: [number, number];
  /** What was seen, for the session record. */
  observed: string;
}

const msSince = (t0: number) => `${Math.round(Date.now() - t0)} ms after piece 2`;

/** A FileWrite answer read after the first one following piece 2: counted as late, its status checked. */
function lateAnswer(status: number, when: string, seen: string[]): void {
  seen.push(`late answer ${when} (status ${status})`);
  if (status !== 0) throw new NordError(`The Nord refused a piece (code ${status}).`);
}

/**
 * Commit with FileClose, reading past any FileWrite answer still on its way until the
 * close's own reply (as `abortOpenFile` does), each read bounded by the 60 s request
 * bound. Returns how many late answers came. A close that never answers throws
 * {@link StreamWriteError} with no close status, so the bracket marks the session lost.
 */
async function commitClose(session: NordSession, at: Addr, seen: string[], t0: number): Promise<number> {
  session.assertWritable();
  let late = 0;
  let refused: NordError | undefined;
  try {
    await session.send(CReqFileClose, [at.bank, at.slot]);
    await session.withReplyTimeout(WRITE_REPLY_TIMEOUT_MS, async () => {
      for (let i = 0; i < MAX_LATE; i++) {
        const r = await session.receiveRaw();
        if (r.msgId === (CReqFileWrite | 1)) {
          late++;
          try { lateAnswer(r.status, `during the close, ${msSince(t0)}`, seen); } catch (e) { refused ??= e as NordError; }
          continue;
        }
        if (r.msgId !== (CReqFileClose | 1)) throw new TransportTimeoutError(0); // out of step: treat as no answer
        seen.push(`closed (status ${r.status})`);
        if (refused) throw new StreamWriteError(`${refused.message} (${seen.join('; ')})`, r.status === 0, refused, r.status);
        if (r.status !== 0) throw new StreamWriteError(`The Nord didn’t keep the file (code ${r.status}). (${seen.join('; ')})`, false, undefined, r.status);
        return;
      }
      throw new TransportTimeoutError(0);
    });
  } catch (e) {
    if (e instanceof StreamWriteError) throw e;
    // Every piece was sent, so an unanswered close may have committed the file.
    seen.push('close: no answer');
    throw new StreamWriteError(`The Nord didn’t answer the close (${seen.join('; ')}).`, true, e, undefined);
  }
  return late;
}

/**
 * Inside a begin on a writable partition: create, send piece 1, wait `ackWaitMs` for an
 * answer, send piece 2, read the first answer after it, then keep reading for answers
 * still on their way (the first such read bounded like the last ack when piece 1's
 * answer wasn't seen, else by `ackWaitMs`), each one's status checked. Then commit with
 * a close that skips any later answer. A create reply naming another place than the one
 * asked for aborts before any piece: OpenNord only writes to a place it found empty.
 */
export async function probeChunkAcks(session: NordSession, file: NewFile, align: number, ackWaitMs = 1500): Promise<ChunkAckObservation> {
  const record = cbinRecord(file.bytes);
  const unit = Math.max(1, align);
  const first = Math.floor((record.length - 1) / unit) * unit;
  if (first <= 0) {
    throw new NordError(`This file is ${record.length} bytes, too small to split at this memory's write size (${unit} bytes). Pick a bigger file.`);
  }
  const pieces: [number, number] = [first, record.length - first];
  const at = await openNewFile(session, file);
  const progress: WriteProgress = { sentAll: false, acked: false };
  const seen: string[] = [`created at ${at.bank}/${at.slot}`, `pieces ${pieces[0]} + ${pieces[1]} bytes (align ${unit})`];
  const ackBound = writeAckTimeoutMs(record.length, session.replyTimeout);
  let afterFirst = false;
  let late = 0;
  let t0 = Date.now();
  try {
    if (at.bank !== file.bank || at.slot !== file.slot) {
      seen.push(`asked for ${file.bank}/${file.slot}`);
      throw new NordError(`The Nord opened the file at another place (${at.bank}/${at.slot}, asked for ${file.bank}/${file.slot}); nothing was written to it.`);
    }
    session.assertWritable();
    await session.send(CReqFileWrite, [at.bank, at.slot, 0, first], record.subarray(0, first));
    try {
      const early = await session.withReplyTimeout(ackWaitMs, () => session.receive(CReqFileWrite));
      seen.push(`after piece 1: answer (status ${early.status})`);
      if (early.status !== 0) throw new NordError(`The Nord refused the first piece (code ${early.status}).`);
      afterFirst = true;
    } catch (e) {
      if (!(e instanceof TransportTimeoutError)) throw e;
      seen.push(`after piece 1: no answer within ${ackWaitMs} ms`);
    }
    session.assertWritable();
    t0 = Date.now();
    await session.send(CReqFileWrite, [at.bank, at.slot, first, pieces[1]], record.subarray(first));
    progress.sentAll = true;
    const last = await session.withReplyTimeout(ackBound, () => session.receive(CReqFileWrite));
    progress.acked = true;
    seen.push(`${afterFirst ? 'after piece 2' : 'first answer after piece 2'}: status ${last.status}, ${msSince(t0)}`);
    if (last.status !== 0) throw new NordError(`The Nord refused ${afterFirst ? 'the second piece' : 'a piece'} (code ${last.status}).`);
    for (let i = 0; i < MAX_LATE; i++) {
      // Piece 1's answer not seen: the second answer, if any, may take as long as the last ack.
      const bound = i === 0 && !afterFirst ? ackBound : ackWaitMs;
      let r;
      try {
        r = await session.withReplyTimeout(bound, () => session.receiveRaw());
      } catch (e) {
        if (e instanceof TransportTimeoutError) break;
        throw e;
      }
      if (r.msgId !== (CReqFileWrite | 1)) throw new NordError(`An unexpected reply (0x${r.msgId.toString(16)}) came after the second piece.`);
      late++;
      lateAnswer(r.status, msSince(t0), seen);
    }
  } catch (e) {
    const closeStatus = await abortOpenFile(session, at, progress);
    const mayBeKept = closeStatus === undefined || closeStatus === 0;
    seen.push(`failed: ${e instanceof Error ? e.message : String(e)}; abort close: ${closeStatus ?? 'no answer'}`);
    console.warn(`[hw-checks] two-piece write: ${seen.join('; ')}`, e);
    throw new StreamWriteError(
      `${e instanceof Error ? e.message : String(e)} (${seen.join('; ')})`, mayBeKept, e, closeStatus,
    );
  }
  late += await commitClose(session, at, seen, t0);
  seen.push(`late answers: ${late}`);
  return { at, acks: afterFirst || late > 0 ? 'answer-per-piece' : 'one-answer', pieces, observed: seen.join('; ') };
}

export interface TwoPieceResult extends ChunkAckObservation {
  name: string;
}

/** W3: the two-piece write of `bytes` (a program) to the first empty program slot. */
export function runTwoPieceWrite(session: NordSession, bytes: Uint8Array, ackWaitMs = 1500): Promise<TwoPieceResult> {
  return session.exclusive(async () => {
    // Every refusal here comes before the first frame.
    const refused = pushRefusal(bytes);
    if (refused) throw new NordError(refused);
    const partition = session.programPartition;
    if (!session.canWrite(partition)) throw new WriteBlockedError();
    return session.withReplyTimeout(REQUEST_TIMEOUT_MS, async () => {
      const list = await readPartitionList(session).catch((e: unknown) => {
        if (e instanceof TransportTimeoutError) session.markDead();
        throw e;
      });
      const info = list[partition];
      if (!info) throw new NordError(`The partition list has no partition ${partition}.`);
      return bracketUnlessLost(session, partition, async () => {
        const cap = await readPartitionCapacity(session, partition, { blockBytes: info.blockBytes });
        // Strict: a program that can't be read must not leave its slot looking empty.
        const entries = await enumerateFiles(session, Infinity, { strict: true });
        const at = firstFreeLocation(entries, cap.banks);
        if (!at) throw new NordError('No empty program slot: free one first. Nothing was written.');
        const name = freeName(TWO_PIECE_NAME, entries.map((e) => e.name));
        const probe = await probeChunkAcks(session, { bytes, name, ...at }, info.writeAlign, ackWaitMs);
        return { name, ...probe };
      });
    });
  });
}

/** The flag positions NSM gives a meaning (partition-list.ts), for the W0 record. */
export const FLAG_LABELS: Readonly<Record<number, string>> = {
  0: 'unresolved (start bank?)',
  [PART_FLAG.matchByLocation]: 'match (0 = by name)',
  [PART_FLAG.eraseBelowV5]: 'erase below v5 (0 = yes)',
  [PART_FLAG.eraseSupported]: 'erase',
  11: 'dependencies',
};

export interface FlagCell { index: number; hex: string; label?: string }

/** Each raw flag byte in hex, with its NSM meaning where one is known. */
export function describeFlags(flags: number[]): FlagCell[] {
  return flags.map((v, index) => {
    const cell: FlagCell = { index, hex: v.toString(16).padStart(2, '0') };
    if (FLAG_LABELS[index] !== undefined) cell.label = FLAG_LABELS[index];
    return cell;
  });
}

/** The untested-write kinds after switching `kind` on or off. */
export function nextAllowed(allowed: LibraryKind[], kind: LibraryKind, on: boolean): LibraryKind[] {
  return on ? [...new Set([...allowed, kind])] : allowed.filter((k) => k !== kind);
}
