/**
 * Writing a large file (a sample or a piano) the way Nord Sound Manager 9.22 does
 *:
 *   [CReqEraseBlock(n) → poll CQryEraseStatus every 750 ms until not busy]
 *   CReqFileCreate → its reply names the place actually used
 *   CReqFileWrite × chunks, streamed (no reply read between chunks) → one ack
 *   CReqFileClose (commits)
 * All inside the caller's begin…end on a partition confirmed writable. Programs keep
 * `pushFile` (transfer.ts): one chunk, the same frames either way.
 */
import type { NordSession } from './session';
import type { Addr } from './reorg';
import {
  CQryEraseStatus, CReqEraseBlock, CReqFileClose, CReqFileCreate, CReqFileWrite, ext2Type,
} from './opcodes';
import { NordError, NordStatus } from './protocol';
import { cbinRecord, readCbinHeader } from '../clavia/cbin';
import { TransportTimeoutError } from './transport';

/** Largest frame the USB port takes, as NSM sizes its buffer (`OnOpen`). */
export const MAX_FRAME_BYTES = 0xffe8;
/** Frame header (16) + CRC (2). */
const FRAME_OVERHEAD = 18;
/**
 * NSM's margin below the port's limit when it sizes a write chunk. It covers the
 * FileWrite frame's four words (bank, slot, offset, length = 16 bytes) plus 8
 * spare, so a full chunk's frame stays within {@link MAX_FRAME_BYTES}.
 */
const NSM_CHUNK_MARGIN = 0x18;
const MAX_CHUNK = 1 << 20;
/** NSM polls the erase status this often (`OnTimeoutSecond`). */
export const ERASE_POLL_MS = 750;
/** How long an erase may take before OpenNord gives up. */
export const ERASE_TIMEOUT_MS = 300_000;
/**
 * The bound on each reply read when the caller set none: NSM gives every request
 * 60 s. A caller's own {@link NordSession.withReplyTimeout} wins.
 */
export const WRITE_REPLY_TIMEOUT_MS = 60_000;
/**
 * The final FileWrite ack comes once the Nord has stored the whole record. NSM
 * puts no timer on it (`Download_SendNextChunkAsyncNoTimeout`); we
 * keep a bound so a dead Nord can't hang the app, but size it to the record:
 * {@link WRITE_REPLY_TIMEOUT_MS} plus 1 s per 256 KiB, i.e. a Nord that stores
 * slower than 256 KiB/s after the last chunk left still gets its ack read.
 */
export const ACK_BYTES_PER_SECOND = 256 * 1024;
/** Short bound for each read while draining replies after a failed write. */
export const DRAIN_MS = 2_000;
/** Most stray replies read while draining or waiting for the abort close. */
const MAX_STRAY_REPLIES = 64;
/** The value a create reply would carry for "no place" (u32 -1). */
const NO_PLACE = 0xffffffff;
/** Names are cut at 0x80 bytes, as NSM's create frame does. */
const MAX_NAME_BYTES = 0x80;

/** Run `fn` with every reply read bounded: the caller's bound, else {@link WRITE_REPLY_TIMEOUT_MS}. */
function bounded<T>(session: NordSession, fn: () => Promise<T>): Promise<T> {
  return session.replyTimeout === undefined ? session.withReplyTimeout(WRITE_REPLY_TIMEOUT_MS, fn) : fn();
}

/** Bytes per FileWrite: the frame room, capped at 1 MiB, rounded down to the partition's alignment (w2). */
export function writeChunkBytes(align: number, maxFrame = MAX_FRAME_BYTES): number {
  const room = Math.min(maxFrame - FRAME_OVERHEAD - NSM_CHUNK_MARGIN, MAX_CHUNK);
  const unit = align > 0 ? align : 1;
  const bytes = Math.floor(room / unit) * unit;
  if (bytes <= 0) throw new NordError(`This Nord’s memory writes in pieces of ${unit} bytes, larger than one transfer. Nothing was written.`);
  return bytes;
}

export interface EraseOptions {
  onProgress?: (done: number, total: number) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Erase `count` dirty blocks so a write fits (`EraseBlocksAsync`). The
 * ack only means "started": the erase status (`status, total, done, busy`,
 * `OnReply(CRpyEraseStatus)`) is polled until `busy` is 0.
 */
export async function eraseBlocks(session: NordSession, count: number, opts: EraseOptions = {}): Promise<void> {
  session.assertWritable();
  if (!Number.isInteger(count)) throw new NordError(`bad erase block count ${count}. Nothing was written.`);
  if (count <= 0) return;
  return bounded(session, async () => {
    const sleep = opts.sleep ?? wait;
    const now = opts.now ?? Date.now;
    const deadline = now() + (opts.timeoutMs ?? ERASE_TIMEOUT_MS);
    const started = await session.request(CReqEraseBlock, [count]);
    if (started.status !== 0) throw new NordError(`The Nord couldn’t make room (code ${started.status}). Nothing was written.`);
    for (;;) {
      await sleep(ERASE_POLL_MS);
      const st = await session.request(CQryEraseStatus, []);
      if (st.status !== 0) throw new NordError(`The Nord couldn’t make room (code ${st.status}). Nothing was written.`);
      // A short reply must not read as "not busy": that would write onto blocks still being erased.
      if (st.words.length < 4) throw new NordError(`erase status reply too short (${st.words.length} words). Nothing was written.`);
      const [, total, done, busy] = st.words;
      opts.onProgress?.(done, total);
      if (busy === 0) return;
      if (now() > deadline) {
        throw new NordError('Making room on your Nord took too long, so nothing was written. Switch the Nord off and on, then try again.');
      }
    }
  });
}

export interface NewFile {
  /** A complete CBIN file; the record behind its header is what is stored. */
  bytes: Uint8Array;
  /** The name it gets on the Nord. */
  name: string;
  /** An empty place (see locations.ts). */
  bank: number;
  slot: number;
}

export interface StreamOptions {
  chunkBytes: number;
  onProgress?: (done: number, total: number) => void;
}

/** `name` as UTF-8, cut at `maxBytes` (the Nord's 128) on a character boundary. */
export function deviceNameBytes(name: string, maxBytes = MAX_NAME_BYTES): Uint8Array {
  const enc = new TextEncoder();
  let out = '';
  let used = 0;
  for (const ch of name) {
    const n = enc.encode(ch).length;
    if (used + n > maxBytes) break;
    out += ch;
    used += n;
  }
  return enc.encode(out);
}

/** The name the Nord keeps for `name`: cut at 128 bytes on a character boundary. */
export function deviceName(name: string, maxBytes = MAX_NAME_BYTES): string {
  return new TextDecoder().decode(deviceNameBytes(name, maxBytes));
}

/**
 * A name the Nord doesn't have yet, compared as the Nord keeps names (cut at 128
 * bytes): `name` itself, else `name (1)`, `name (2)`, … with the base cut so the
 * number always fits. Returns the name as the Nord will keep it.
 */
export function deviceFreeName(name: string, taken: Iterable<string>): string {
  const used = new Set([...taken].map((t) => deviceName(t)));
  const whole = deviceName(name);
  if (!used.has(whole)) return whole;
  const enc = new TextEncoder();
  for (let n = 1; ; n++) {
    const suffix = ` (${n})`;
    const candidate = deviceName(name, MAX_NAME_BYTES - enc.encode(suffix).length) + suffix;
    if (!used.has(candidate)) return candidate;
  }
}

/**
 * A streamed write failed after the Nord opened the file. `mayBeKept` is false only
 * when the abort close confirmed a discard; otherwise the file may be on the Nord
 * (the close committed it, or it never answered), so a retry can clash by name.
 * `closeStatus` is the abort close's status, or undefined when the Nord never
 * answered it: the reply stream is then out of step, and a strict `end()` would
 * read some other reply and fail with an opcode mismatch that hides this error.
 */
export class StreamWriteError extends NordError {
  /**
   * Set by a caller that left the session without an end because the close never
   * answered (send-library.ts): the player must reconnect before anything else.
   */
  sessionLost = false;

  constructor(
    message: string, readonly mayBeKept: boolean, readonly reason: unknown, readonly closeStatus: number | undefined,
  ) {
    super(message);
    this.name = 'StreamWriteError';
  }
}

/**
 * Marks an error thrown after OpenNord asked the Nord to make room (an erase), so the
 * player isn't told "nothing was changed". Making room only clears space the Nord had
 * already freed, so the samples and pianos themselves are unchanged.
 */
export function markAfterErase(e: unknown): void {
  if (typeof e === 'object' && e !== null) (e as { afterErase?: boolean }).afterErase = true;
}

/** Whether {@link markAfterErase} marked `e`. */
export function afterErase(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { afterErase?: boolean }).afterErase === true;
}

/** The Nord (or the fit check before it) has no room for the file: nothing was written. */
export class NoRoomError extends NordError {
  constructor(message: string) {
    super(message);
    this.name = 'NoRoomError';
  }
}

/** The Nord already keeps a file under this name: nothing was written. */
export class NameTakenError extends NordError {
  constructor(message: string) {
    super(message);
    this.name = 'NameTakenError';
  }
}

/** How far a streamed write got, for the abort after a failure. */
export interface WriteProgress {
  /** Every chunk left (the Nord had the whole record). */
  sentAll: boolean;
  /** The one FileWrite ack was read (whatever its status). */
  acked: boolean;
}

/** The ack bound for a record of `bytes`: the caller's bound or 60 s, plus time for the Nord to store it. */
export function writeAckTimeoutMs(bytes: number, callerBound?: number): number {
  const sized = WRITE_REPLY_TIMEOUT_MS + Math.ceil(bytes / ACK_BYTES_PER_SECOND) * 1000;
  return Math.max(sized, callerBound ?? 0);
}

async function create(session: NordSession, file: NewFile, record: Uint8Array): Promise<Addr> {
  if (record.length === 0) throw new NordError('This file is empty, so it wasn’t sent.');
  const header = readCbinHeader(file.bytes);
  const name = deviceNameBytes(file.name);
  const reply = await session.request(
    CReqFileCreate,
    [file.bank, file.slot, record.length, ext2Type(header.tag), 0xffffffff, header.category, name.length],
    name,
  );
  if (reply.status === NordStatus.fileExists) {
    throw new NameTakenError(`The Nord already has a file called “${file.name}”, and it keeps one per name.`);
  }
  if (reply.status === NordStatus.notEnoughSpace) throw new NoRoomError('Your Nord ran out of room for this file. Nothing was written.');
  if (reply.status !== 0) throw new NordError(`The Nord refused the new file (code ${reply.status}). Nothing was written.`);
  if (reply.words.length < 3) return { bank: file.bank, slot: file.slot };
  const at = { bank: reply.words[1], slot: reply.words[2] };
  if (at.bank === NO_PLACE || at.slot === NO_PLACE) {
    // The Nord opened a file but named no place for it. A FileClose commits, so closing
    // at a guessed place could keep an empty file, or reach a place the Nord didn't
    // mean; nothing more is sent. No close went out (closeStatus undefined), so the
    // caller treats the session as lost and the player replugs, which drops the open file.
    throw new StreamWriteError(
      `The Nord opened the file without naming a place (bank 0x${at.bank.toString(16)}, slot 0x${at.slot.toString(16)}), `
      + 'so OpenNord stopped. Nothing was written, but the file may still be open on the Nord.',
      true, undefined, undefined,
    );
  }
  return at;
}

async function stream(session: NordSession, at: Addr, record: Uint8Array, opts: StreamOptions, progress: WriteProgress): Promise<void> {
  if (record.length === 0) throw new NordError('This file is empty, so it wasn’t sent.');
  if (!Number.isInteger(opts.chunkBytes) || opts.chunkBytes <= 0) throw new NordError(`bad write chunk size ${opts.chunkBytes}`);
  let offset = 0;
  while (offset < record.length) {
    const chunk = record.subarray(offset, Math.min(offset + opts.chunkBytes, record.length));
    await session.send(CReqFileWrite, [at.bank, at.slot, offset, chunk.length], chunk);
    offset += chunk.length;
    opts.onProgress?.(offset, record.length);
  }
  progress.sentAll = true;
  const ack = await session.withReplyTimeout(
    writeAckTimeoutMs(record.length, session.replyTimeout),
    () => session.receive(CReqFileWrite),
  );
  progress.acked = true;
  if (ack.status !== 0) throw new NordError(`The Nord couldn’t store the file (code ${ack.status}).`);
}

/** FileCreate at an empty place; returns where the Nord put it (`OnReply(CAckFileCreate)`). */
export async function openNewFile(session: NordSession, file: NewFile): Promise<Addr> {
  session.assertWritable();
  return bounded(session, () => create(session, file, cbinRecord(file.bytes)));
}

/** Stream `record` in chunks without waiting between them, then read the one acknowledgement. */
export async function streamRecord(session: NordSession, at: Addr, record: Uint8Array, opts: StreamOptions): Promise<void> {
  session.assertWritable();
  return bounded(session, () => stream(session, at, record, opts, { sentAll: false, acked: false }));
}

/** FileClose: this is what commits the file. */
export async function closeNewFile(session: NordSession, at: Addr): Promise<void> {
  session.assertWritable();
  return bounded(session, async () => {
    const close = await session.request(CReqFileClose, [at.bank, at.slot]);
    if (close.status !== 0) throw new NordError(`The Nord didn’t keep the file (code ${close.status}).`);
  });
}

/**
 * Read whatever replies are still on their way (a late FileWrite ack, or acks for
 * chunks the Nord refused), each read bounded by {@link DRAIN_MS}, until none comes.
 */
async function drain(session: NordSession): Promise<void> {
  await session.withReplyTimeout(DRAIN_MS, async () => {
    for (let i = 0; i < MAX_STRAY_REPLIES; i++) {
      try {
        await session.receiveRaw();
      } catch {
        return; // nothing more came (or the Nord is gone): done draining
      }
    }
  });
}

/**
 * Abort an open file after a failed write so the session stays in step: drain
 * late replies, send FileClose, and read until its own reply (0x0F) comes,
 * skipping any FileWrite ack still arriving. Returns the close's status, or
 * undefined when the Nord never answered it. Shared with the hardware session's
 * two-piece write (hw-checks.ts).
 */
export async function abortOpenFile(session: NordSession, at: Addr, progress: WriteProgress): Promise<number | undefined> {
  if (!progress.acked) await drain(session);
  try {
    await session.send(CReqFileClose, [at.bank, at.slot]);
    for (let i = 0; i < MAX_STRAY_REPLIES; i++) {
      const r = await session.receiveRaw();
      if (r.msgId === (CReqFileClose | 1)) return r.status;
    }
  } catch {
    // the close went unanswered: the outcome is unknown
  }
  return undefined;
}

/** Create, stream and commit one file at an empty place. Returns the place the Nord used. */
export async function createFileStreamed(session: NordSession, file: NewFile, opts: StreamOptions): Promise<Addr> {
  session.assertWritable();
  return bounded(session, async () => {
    const record = cbinRecord(file.bytes);
    let at: Addr;
    try {
      at = await create(session, file, record);
    } catch (e) {
      // No create reply: the Nord may have opened the file, but nothing was written to it.
      if (e instanceof TransportTimeoutError) {
        throw new StreamWriteError('The Nord didn’t answer the new file. Nothing was written.', false, e, undefined);
      }
      throw e;
    }
    const progress: WriteProgress = { sentAll: false, acked: false };
    try {
      await stream(session, at, record, opts, progress);
    } catch (e) {
      const closeStatus = await abortOpenFile(session, at, progress);
      // A close that answers OK (or not at all) may have committed what the Nord got.
      const mayBeKept = closeStatus === undefined || closeStatus === 0;
      console.warn(
        `[stream-write] write to ${at.bank}/${at.slot} failed (sent all: ${progress.sentAll}, acked: ${progress.acked}); `
        + `abort close status: ${closeStatus ?? 'no answer'}`, e,
      );
      const cause = e instanceof Error ? e.message : String(e);
      const outcome = mayBeKept
        ? closeStatus === undefined
          ? 'The Nord didn’t answer the abort, so the file may have been kept on the Nord.'
          : `The file may have been kept on the Nord${progress.sentAll ? '' : ', incomplete'} (the abort close answered OK).`
        : `Nothing was kept (the abort close answered code ${closeStatus}).`;
      throw new StreamWriteError(`${cause} ${outcome}`, mayBeKept, e, closeStatus);
    }
    try {
      await closeNewFile(session, at);
    } catch (e) {
      // Every chunk was acknowledged, so an unanswered close has likely committed the file.
      if (e instanceof TransportTimeoutError) {
        throw new StreamWriteError('The Nord didn’t answer the close, so the file may have been kept on the Nord.', true, e, undefined);
      }
      throw e;
    }
    return at;
  });
}
