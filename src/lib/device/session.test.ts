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

  it('negotiates and adopts the device FileTransfer version (NS2 = 0x08)', async () => {
    // 0x03 reply carrying the captured NS2 version table (byte-packed payload).
    const negReply = encodeMessage(0x03, [], new Uint8Array([0x05, 0x06, 0x01, 0x07, 0x00, 0x0a, 0x02, 0x0c, 0x08, 0x0d, 0x00]));
    const t = new MockTransport([negReply, encodeMessage(CReqBegin | 1, [0])]);
    const session = new NordSession(t);

    expect(await session.negotiateVersion()).toBe(0x08);
    // the query went out as protocolId 0x07, version 0x00, msgId 0x02
    expect([...t.sent[0].slice(4, 16)]).toEqual([0, 0, 0, 0x07, 0, 0, 0, 0x00, 0, 0, 0, 0x02]);

    // subsequent FileTransfer frames now carry the negotiated version 0x08
    await session.begin(6);
    expect([...t.sent[1].slice(8, 12)]).toEqual([0, 0, 0, 0x08]);
  });

  it('keeps the default version 0x0a when the device does not advertise FileTransfer', async () => {
    const negReply = encodeMessage(0x03, [], new Uint8Array([0x01, 0x0a, 0x02])); // only proto 0x0a, no 0x0c
    const t = new MockTransport([negReply, encodeMessage(CReqBegin | 1, [0])]);
    const session = new NordSession(t);

    expect(await session.negotiateVersion()).toBe(0x0a);
    await session.begin(6);
    expect([...t.sent[1].slice(8, 12)]).toEqual([0, 0, 0, 0x0a]);
  });
});
