import type { NordTransport } from './transport';
import { encodeMessage, decodeReply, NordError, NordStatus, SessionRefusedError, type NordReply } from './protocol';
import { CReqBegin, CReqEnd, PARTITION_PROGRAM, PROTOCOL_ID, PROTOCOL_VERSION } from './opcodes';
import { PROTOCOL_NEGOTIATE, MSG_QRY_VERSIONS, isKnownFileTransferVersion, parseVersionReply } from './negotiate';
import { WriteBlockedError } from './write-guard';

/** Largest single reply we expect (program bodies are < 1 KB; windowed reads keep chunks small). */
const READ_BUFFER = 8192;

/** A live FileTransfer session over a transport. Correlates each request to its reply. */
export class NordSession {
  /** FileTransfer protocol version this session's frames carry. Defaults to the NS4
   *  value (`0x0a`); `negotiateVersion()` adopts whatever the connected device reports
   *  (e.g. NS2 = `0x08`). A frame sent with the wrong version is silently ignored. */
  private version = PROTOCOL_VERSION;

  /** Tail of the operation queue — see {@link exclusive}. */
  private lock: Promise<unknown> = Promise.resolve();

  /** Protocol partition index of the connected device's user Programs. Defaults to
   *  the Stage-4 index (`PARTITION_PROGRAM` = 6); the connect flow sets it per model
   *  via `resolveDeviceAccess` (connect-probe.ts) so program transfer/organize address
   *  the right partition on non-Stage-4 devices. See program-partition.ts. */
  programPartition = PARTITION_PROGRAM;

  /** True when the device has the Stage 4 partition layout (programs, presets,
   *  Live, Settings at partitions 6–11). Set by the connect flow. On any other
   *  model those indices are different partitions, so a backup there holds the
   *  programs only (see backup.ts) and its presets are not listed. */
  stage4Layout = false;

  /** Partitions this session may write to. Empty by default, so a session that
   *  never had its layout confirmed refuses every write; the connect flow fills
   *  it from `resolveDeviceAccess` (connect-probe.ts). */
  private writable: ReadonlySet<number> = new Set();

  /** Partition of the currently open `begin`…`end` bracket, if any. Writes are
   *  checked against it, since a write frame itself carries only {bank, slot}. */
  private openPartition: number | undefined;

  /** Bound on each reply read, while {@link withReplyTimeout} runs. */
  private replyTimeoutMs: number | undefined;

  constructor(private readonly transport: NordTransport) {}

  /**
   * Run `fn` with exclusive use of the transport. The device pairs each request
   * with one reply on a single bulk pipe, so two operations in flight at once
   * read each other's frames (silent desync). Every top-level device operation
   * — `withSession`, `negotiateVersion`, and manual `begin`…`end` brackets like
   * backup/restore — must run inside one `exclusive` block; `request`/`begin`/
   * `end` themselves stay unlocked so they can be composed within it.
   */
  exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.lock.then(fn, fn);
    this.lock = run.catch(() => undefined); // a failed op must not jam the queue
    return run;
  }

  /**
   * Release the underlying transport (WebUSB: releaseInterface + device.close).
   * Queued behind in-flight operations so an active transfer isn't cut mid-frame.
   * Without this a disconnect leaks the claimed interface and the next connect
   * fails "busy" — looking like Nord Sound Manager holds the device.
   */
  close(): Promise<void> {
    return this.exclusive(() => this.transport.close());
  }

  /** Call `cb` once the transport finds the Nord gone (unplugged, switched off).
   *  Nothing is called on a transport that can't tell. */
  onLost(cb: () => void): void {
    this.transport.onLost?.(cb);
  }

  /**
   * Frame later FileTransfer requests with `version` — the connected model's own
   * version from the registry (`initialFileTransferVersion`, negotiate.ts), set
   * before negotiating. {@link negotiateVersion} still replaces it with whatever
   * the device advertises.
   */
  useFileTransferVersion(version: number): void {
    this.version = version;
  }

  /** The FileTransfer version this session's frames carry (the device's, once negotiated). */
  get fileTransferVersion(): number {
    return this.version;
  }

  /**
   * Ask the device which protocol versions it supports and adopt its FileTransfer
   * version for all later frames (the pre-FileTransfer handshake, protocolId `0x07`).
   * If the device doesn't advertise FileTransfer (`0x0c`), or advertises a
   * version outside the 3–10 NSM speaks, the current version stands (the
   * model's own via {@link useFileTransferVersion}, else `0x0a`).
   * The reply read is bounded only inside {@link withReplyTimeout}: a model that
   * ignores the query would otherwise never return. Returns the adopted version.
   * See docs/PROTOCOL-RE.md (issue #31).
   */
  negotiateVersion(): Promise<number> {
    return this.exclusive(async () => {
      await this.transport.bulkOut(
        encodeMessage(MSG_QRY_VERSIONS, [], undefined, { protocolId: PROTOCOL_NEGOTIATE, version: 0 }),
      );
      const reply = decodeReply(await this.transport.bulkIn(READ_BUFFER, this.replyTimeoutMs));
      const advertised = parseVersionReply(reply.payload).get(PROTOCOL_ID);
      if (advertised !== undefined && isKnownFileTransferVersion(advertised)) this.version = advertised;
      return this.version;
    });
  }

  /** Send a request and return its decoded reply, without asserting the reply opcode.
   *  For queries whose reply-opcode convention isn't confirmed yet (e.g. GetFocus). */
  async requestRaw(msgId: number, words: number[], trailing?: Uint8Array): Promise<NordReply> {
    await this.transport.bulkOut(encodeMessage(msgId, words, trailing, { version: this.version }));
    return decodeReply(await this.transport.bulkIn(READ_BUFFER, this.replyTimeoutMs));
  }

  /** Send a request and return its decoded reply (verifies opcode = request | 1). */
  async request(msgId: number, words: number[], trailing?: Uint8Array): Promise<NordReply> {
    const reply = await this.requestRaw(msgId, words, trailing);
    if (reply.msgId !== (msgId | 1)) {
      throw new NordError(`unexpected reply opcode 0x${reply.msgId.toString(16)} for request 0x${msgId.toString(16)}`);
    }
    return reply;
  }

  /**
   * Run `fn` with every reply read bounded to `ms`: a reply that doesn't come
   * rejects with `TransportTimeoutError` instead of waiting forever. For the
   * connect-time probe, which asks questions an unfamiliar Nord may never answer;
   * it runs before anything else uses the session, so the bound covers only it.
   */
  async withReplyTimeout<T>(ms: number, fn: () => Promise<T>): Promise<T> {
    const previous = this.replyTimeoutMs;
    this.replyTimeoutMs = ms;
    try {
      return await fn();
    } finally {
      this.replyTimeoutMs = previous;
    }
  }

  /**
   * Allow writes (create/write/delete) to exactly these partitions — those whose
   * index is confirmed: hardware-confirmed in the registry, or found by the
   * connect probe to hold the model's program files. Replaces any earlier set.
   */
  allowWrites(partitions: Iterable<number>): void {
    this.writable = new Set(partitions);
  }

  /** True when writes to `partition` are allowed (see {@link allowWrites}). */
  canWrite(partition: number): boolean {
    return this.writable.has(partition);
  }

  /**
   * Throw {@link WriteBlockedError} unless a session is open on a partition this
   * session may write to. Every write path (push, delete, organize, restore,
   * sample/piano removal) goes through `pushFile`/`deleteProgram`, which call
   * this before sending anything — so an unconfirmed partition is never written.
   */
  assertWritable(): void {
    if (this.openPartition === undefined || !this.canWrite(this.openPartition)) {
      throw new WriteBlockedError();
    }
  }

  /**
   * Open a transfer session on `partition`. A refused begin (non-zero status)
   * leaves no session behind: the Nord takes its session lock before it checks
   * the partition, so this sends the end itself, else every later begin would
   * come back {@link NordStatus.sessionBusy}. A busy reply means a session an
   * earlier run never ended still holds the device; that one is ended and the
   * begin asked once more.
   */
  async begin(partition: number): Promise<NordReply> {
    this.openPartition = undefined;
    let reply = await this.request(CReqBegin, [partition]);
    if (reply.status === NordStatus.sessionBusy) {
      await this.endQuietly();
      reply = await this.request(CReqBegin, [partition]);
    }
    if (reply.status === 0) this.openPartition = partition;
    else if (reply.status !== NordStatus.sessionBusy) await this.endQuietly();
    return reply;
  }

  async end(): Promise<NordReply> {
    try {
      return await this.request(CReqEnd, []);
    } finally {
      this.openPartition = undefined;
    }
  }

  /**
   * Run `fn` inside a `begin(partition)` … `end()` session, always ending it.
   * The device only shows "synchronizing" while a session is open, so callers
   * should bracket each operation rather than hold a session open at idle.
   * `wanted`, asked when the operation's turn comes, drops it (rejecting with an
   * AbortError) if nobody wants it any more; one that has begun runs to its end,
   * so the device isn't left mid-transfer.
   */
  withSession<T>(partition: number, fn: () => Promise<T>, wanted?: () => boolean): Promise<T> {
    return this.exclusive(async () => {
      if (wanted && !wanted()) throw new DOMException('Nobody wants this operation any more', 'AbortError');
      return this.bracket(partition, fn);
    });
  }

  /**
   * `begin(partition)` … `fn` … `end()`, for a caller already inside
   * {@link exclusive} (the lock is not re-entrant; {@link withSession} is this
   * plus the lock). A refused begin throws {@link SessionRefusedError}.
   */
  async bracket<T>(partition: number, fn: () => Promise<T>): Promise<T> {
    const begun = await this.begin(partition);
    if (begun.status !== 0) throw new SessionRefusedError(partition, begun.status);
    try {
      return await fn();
    } finally {
      // don't let an end failure mask the operation's own error / result
      await this.endQuietly();
    }
  }

  private async endQuietly(): Promise<void> {
    try {
      await this.end();
    } catch {
      // nothing to do: the device didn't answer the end
    }
  }
}
