import { describe, it, expect } from 'vitest';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { encodeMessage, NordError } from './protocol';
import { CReqBegin } from './opcodes';

describe('NordSession', () => {
  it('sends a request and returns the decoded reply', async () => {
    const t = new MockTransport([encodeMessage(CReqBegin | 1, [0])]); // Begin ack, status 0
    const session = new NordSession(t);
    const reply = await session.begin(6);
    expect(reply.status).toBe(0);
    expect(reply.msgId).toBe(CReqBegin | 1);
    // it actually transmitted a Begin(6) frame
    expect(t.sent).toHaveLength(1);
    expect([...t.sent[0].slice(12, 20)]).toEqual([0, 0, 0, 0x04, 0, 0, 0, 0x06]);
  });

  it('throws when the reply opcode is not request|1', async () => {
    const t = new MockTransport([encodeMessage(0x99, [0])]);
    const session = new NordSession(t);
    await expect(session.request(CReqBegin, [6])).rejects.toThrow(NordError);
  });
});
