import type { NordTransport } from './transport';
import { encodeMessage, decodeReply, NordError, type NordReply } from './protocol';
import { CReqBegin, CReqEnd } from './opcodes';

/** Largest single reply we expect (program bodies are < 1 KB; windowed reads keep chunks small). */
const READ_BUFFER = 8192;

/** A live FileTransfer session over a transport. Correlates each request to its reply. */
export class NordSession {
  constructor(private readonly transport: NordTransport) {}

  /** Send a request and return its decoded reply, without asserting the reply opcode.
   *  For queries whose reply-opcode convention isn't confirmed yet (e.g. GetFocus). */
  async requestRaw(msgId: number, words: number[], trailing?: Uint8Array): Promise<NordReply> {
    await this.transport.bulkOut(encodeMessage(msgId, words, trailing));
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
  async withSession<T>(partition: number, fn: () => Promise<T>): Promise<T> {
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
  }
}
