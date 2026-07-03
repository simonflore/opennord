import type { NordTransport } from './transport';
import { encodeMessage, decodeReply, NordError, type NordReply } from './protocol';
import { CReqBegin, CReqEnd, PARTITION_PROGRAM, PROTOCOL_ID, PROTOCOL_VERSION } from './opcodes';
import { PROTOCOL_NEGOTIATE, MSG_QRY_VERSIONS, parseVersionReply } from './negotiate';

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
   *  via `resolveProgramPartition(productId)` so program transfer/organize address the
   *  right partition on non-Stage-4 devices. See program-partition.ts. */
  programPartition = PARTITION_PROGRAM;

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

  /**
   * Ask the device which protocol versions it supports and adopt its FileTransfer
   * version for all later frames (the pre-FileTransfer handshake, protocolId `0x07`).
   * If the device doesn't advertise FileTransfer (`0x0c`), the default `0x0a` stands.
   * Returns the adopted version. See docs/PROTOCOL-RE.md (issue #31).
   */
  negotiateVersion(): Promise<number> {
    return this.exclusive(async () => {
      await this.transport.bulkOut(
        encodeMessage(MSG_QRY_VERSIONS, [], undefined, { protocolId: PROTOCOL_NEGOTIATE, version: 0 }),
      );
      const reply = decodeReply(await this.transport.bulkIn(READ_BUFFER));
      const advertised = parseVersionReply(reply.payload).get(PROTOCOL_ID);
      if (advertised !== undefined) this.version = advertised;
      return this.version;
    });
  }

  /** Send a request and return its decoded reply, without asserting the reply opcode.
   *  For queries whose reply-opcode convention isn't confirmed yet (e.g. GetFocus). */
  async requestRaw(msgId: number, words: number[], trailing?: Uint8Array): Promise<NordReply> {
    await this.transport.bulkOut(encodeMessage(msgId, words, trailing, { version: this.version }));
    return decodeReply(await this.transport.bulkIn(READ_BUFFER));
  }

  /** Send a request and return its decoded reply (verifies opcode = request | 1). */
  async request(msgId: number, words: number[], trailing?: Uint8Array): Promise<NordReply> {
    const reply = await this.requestRaw(msgId, words, trailing);
    if (reply.msgId !== (msgId | 1)) {
      throw new NordError(`unexpected reply opcode 0x${reply.msgId.toString(16)} for request 0x${msgId.toString(16)}`);
    }
    return reply;
  }

  begin(partition: number): Promise<NordReply> {
    return this.request(CReqBegin, [partition]);
  }

  end(): Promise<NordReply> {
    return this.request(CReqEnd, []);
  }

  /**
   * Run `fn` inside a `begin(partition)` … `end()` session, always ending it.
   * The device only shows "synchronizing" while a session is open, so callers
   * should bracket each operation rather than hold a session open at idle.
   */
  withSession<T>(partition: number, fn: () => Promise<T>): Promise<T> {
    return this.exclusive(async () => {
      const begun = await this.begin(partition);
      if (begun.status !== 0) throw new NordError(`could not open a transfer session (status ${begun.status})`);
      try {
        return await fn();
      } finally {
        try {
          await this.end();
        } catch {
          // ignore end failures — don't mask the operation's own error / result
        }
      }
    });
  }
}
