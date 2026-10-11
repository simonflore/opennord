import { describe, it, expect } from 'vitest';
import { NordSession } from './session';
import { MockTransport, TransportTimeoutError } from './transport';
import { encodeMessage, NordError, SessionRefusedError } from './protocol';
import { CReqBegin, CReqEnd, CQryFileInfo } from './opcodes';

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

  // The opcode of each frame the session sent (big-endian u32 at byte 12).
  const sentOps = (t: MockTransport) => t.sent.map((f) => new DataView(f.buffer, f.byteOffset).getUint32(12));

  it('reports a refused Begin as SessionRefusedError and still ends, releasing the device', async () => {
    // The Nord takes its session lock before checking the partition: a Begin past the
    // last partition (status 2) holds the lock until an End.
    const t = new MockTransport([encodeMessage(CReqBegin | 1, [2]), encodeMessage(CReqEnd | 1, [0])]);
    const session = new NordSession(t);
    const err = await session.withSession(13, async () => 'unreached').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SessionRefusedError);
    expect(err).toBeInstanceOf(NordError); // existing catch-all handlers still apply
    expect(err).toMatchObject({ partition: 13, status: 2 });
    expect(sentOps(t)).toEqual([CReqBegin, CReqEnd]);
  });

  it('drops a queued operation nobody wants when its turn comes, without touching the device', async () => {
    const t = new MockTransport([]);
    const session = new NordSession(t);
    let wanted = true;
    const queued = session.withSession(7, async () => 'unreached', () => wanted);
    wanted = false;
    await expect(queued).rejects.toMatchObject({ name: 'AbortError' });
    expect(t.sent).toHaveLength(0);
  });

  it('ends a session left open by an earlier run, then begins again', async () => {
    const t = new MockTransport([
      encodeMessage(CReqBegin | 1, [18]), // busy: the lock is still held
      encodeMessage(CReqEnd | 1, [0]),
      encodeMessage(CReqBegin | 1, [0]),
      encodeMessage(CReqEnd | 1, [0]),
    ]);
    const session = new NordSession(t);
    expect(await session.withSession(7, async () => 'ran')).toBe('ran');
    expect(sentOps(t)).toEqual([CReqBegin, CReqEnd, CReqBegin, CReqEnd]);
  });

  it('gives up after one retry when the Nord stays busy, without ending its session', async () => {
    // Still busy after our End: someone else (e.g. Nord Sound Manager) holds the session.
    const t = new MockTransport([
      encodeMessage(CReqBegin | 1, [18]),
      encodeMessage(CReqEnd | 1, [18]),
      encodeMessage(CReqBegin | 1, [18]),
    ]);
    const session = new NordSession(t);
    const err = await session.withSession(7, async () => 'unreached').catch((e: unknown) => e);
    expect(err).toMatchObject({ partition: 7, status: 18 });
    expect(sentOps(t)).toEqual([CReqBegin, CReqEnd, CReqBegin]);
  });

  it('defaults programPartition to the Stage-4 index and adopts a device-specific one', () => {
    const session = new NordSession(new MockTransport([]));
    expect(session.programPartition).toBe(6); // PARTITION_PROGRAM default
    session.programPartition = 7;
    expect(session.programPartition).toBe(7);
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

  it('serializes concurrent withSession operations so replies stay correlated', async () => {
    // Two flows fire at once (e.g. the auto capacity read racing a user action).
    // Without serialization the second flow's Begin goes out before the first
    // flow's reply is read, so it consumes the wrong frame and the opcode
    // check trips — exactly the on-wire desync this guards against.
    const t = new MockTransport([
      encodeMessage(CReqBegin | 1, [0]),
      encodeMessage(CQryFileInfo | 1, [0]),
      encodeMessage(CReqEnd | 1, [0]),
      encodeMessage(CReqBegin | 1, [0]),
      encodeMessage(CQryFileInfo | 1, [0]),
      encodeMessage(CReqEnd | 1, [0]),
    ]);
    const session = new NordSession(t);
    const op = () => session.request(CQryFileInfo, [0, 0]);
    const [a, b] = await Promise.all([
      session.withSession(6, op),
      session.withSession(6, op),
    ]);
    expect(a.msgId).toBe(CQryFileInfo | 1);
    expect(b.msgId).toBe(CQryFileInfo | 1);
  });

  it('close() releases the underlying transport, after in-flight operations finish', async () => {
    let closed = false;
    const order: string[] = [];
    class ClosableTransport extends MockTransport {
      override async close() { closed = true; order.push('close'); }
    }
    const session = new NordSession(new ClosableTransport([]));
    // An in-flight operation must complete before the pipe is torn down.
    const op = session.exclusive(async () => { await Promise.resolve(); order.push('op'); });
    await session.close();
    await op;
    expect(closed).toBe(true);
    expect(order).toEqual(['op', 'close']);
  });

  it('exclusive() runs operations one at a time, releasing the lock on failure', async () => {
    const t = new MockTransport([]);
    const session = new NordSession(t);
    const order: string[] = [];
    const a = session.exclusive(async () => {
      order.push('a:start');
      await Promise.resolve(); // yield so an unserialized b could interleave
      order.push('a:end');
      throw new Error('a failed');
    });
    const b = session.exclusive(async () => {
      order.push('b:start');
      await Promise.resolve();
      order.push('b:end');
      return 'ok';
    });
    await expect(a).rejects.toThrow('a failed');
    await expect(b).resolves.toBe('ok');
    expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });

  it('frames requests with the model\'s own version, and keeps it when negotiation names none', async () => {
    // A Lead 4 speaks FileTransfer 8 and drops 0x0a frames.
    const negReply = encodeMessage(0x03, [], new Uint8Array([0x01, 0x0a, 0x02])); // no 0x0c entry
    const t = new MockTransport([negReply, encodeMessage(CReqBegin | 1, [0])]);
    const session = new NordSession(t);
    session.useFileTransferVersion(8);

    expect(await session.negotiateVersion()).toBe(8);
    await session.begin(1);
    expect([...t.sent[1].slice(8, 12)]).toEqual([0, 0, 0, 0x08]);
  });

  it('lets the negotiated version replace the model\'s version', async () => {
    const negReply = encodeMessage(0x03, [], new Uint8Array([0x01, 0x0c, 0x07])); // FileTransfer 7
    const t = new MockTransport([negReply, encodeMessage(CReqBegin | 1, [0])]);
    const session = new NordSession(t);
    session.useFileTransferVersion(8);

    expect(await session.negotiateVersion()).toBe(7);
    await session.begin(1);
    expect([...t.sent[1].slice(8, 12)]).toEqual([0, 0, 0, 0x07]);
  });

  it('keeps the default version 0x0a when the device does not advertise FileTransfer', async () => {
    const negReply = encodeMessage(0x03, [], new Uint8Array([0x01, 0x0a, 0x02])); // only proto 0x0a, no 0x0c
    const t = new MockTransport([negReply, encodeMessage(CReqBegin | 1, [0])]);
    const session = new NordSession(t);

    expect(await session.negotiateVersion()).toBe(0x0a);
    await session.begin(6);
    expect([...t.sent[1].slice(8, 12)]).toEqual([0, 0, 0, 0x0a]);
  });

  it('bounds the negotiation read inside withReplyTimeout; on silence the model\'s version stands', async () => {
    // A Nord that ignores the 0x07 query: the read only ends when it is bounded.
    const t = new MockTransport([encodeMessage(CReqBegin | 1, [0])]);
    const timeouts: (number | undefined)[] = [];
    let silent = true;
    t.bulkIn = (max: number, timeoutMs?: number) => {
      timeouts.push(timeoutMs);
      if (!silent) return MockTransport.prototype.bulkIn.call(t, max);
      silent = false;
      return timeoutMs === undefined ? new Promise(() => {}) : Promise.reject(new TransportTimeoutError(timeoutMs));
    };
    const session = new NordSession(t);
    session.useFileTransferVersion(4);

    const err = await session.withReplyTimeout(50, () => session.negotiateVersion()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TransportTimeoutError);
    await session.begin(4);
    expect(timeouts).toEqual([50, undefined]); // the bound covers the handshake only
    expect([...t.sent[1].slice(8, 12)]).toEqual([0, 0, 0, 0x04]);
  });
});
