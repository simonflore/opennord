import type { NordTransport } from './transport';
import { encodeMessage, decodeReply, NordError, type NordReply } from './protocol';
import { CReqBegin, CReqEnd } from './opcodes';

/** Largest single reply we expect (program bodies are < 1 KB; windowed reads keep chunks small). */
const READ_BUFFER = 8192;

/** A live FileTransfer session over a transport. Correlates each request to its reply. */
export class NordSession {
  constructor(private readonly transport: NordTransport) {}

  /** Send a request and return its decoded reply (verifies opcode = request | 1). */
  async request(msgId: number, words: number[], trailing?: Uint8Array): Promise<NordReply> {
    await this.transport.bulkOut(encodeMessage(msgId, words, trailing));
    const reply = decodeReply(await this.transport.bulkIn(READ_BUFFER));
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
}
