import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeReply, encodeMessage, NordError } from './protocol';
import {
  CQryEraseStatus, CReqBegin, CReqEnd, CReqEraseBlock, CReqFileClose, CReqFileCreate, CReqFileWrite, ext2Type,
} from './opcodes';
import { cbinRecord, readCbinHeader } from '../clavia/cbin';
import { WriteBlockedError } from './write-guard';
import { MockTransport } from './transport';
import { NordSession } from './session';
import { ScriptedTransport, TIMEOUT, ack, openSession, sentIds, status } from './wire-replies';
import {
  createFileStreamed, deviceName, deviceNameBytes, DRAIN_MS, eraseBlocks, ERASE_POLL_MS, MAX_FRAME_BYTES, NameTakenError, NoRoomError,
  StreamWriteError,
  WRITE_REPLY_TIMEOUT_MS, writeAckTimeoutMs, writeChunkBytes,
} from './stream-write';

const program = new Uint8Array(readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))));
const record = cbinRecord(program); // 824 bytes

describe('writeChunkBytes', () => {
  it('is the frame room rounded down to the alignment unit', () => {
    expect(writeChunkBytes(1)).toBe(65470);
    expect(writeChunkBytes(0)).toBe(65470);
    expect(writeChunkBytes(512)).toBe(65024);
    expect(writeChunkBytes(4096)).toBe(61440);
  });

  it('a full chunk at the largest size still fits one frame', () => {
    const n = writeChunkBytes(1);
    expect(encodeMessage(CReqFileWrite, [0, 0, 0, n], new Uint8Array(n)).length).toBeLessThanOrEqual(MAX_FRAME_BYTES);
  });

  it('refuses an alignment larger than a frame', () => {
    expect(() => writeChunkBytes(1 << 17)).toThrow(NordError);
  });
});

describe('createFileStreamed', () => {
  it('creates, streams every chunk, reads one write ack, then closes', async () => {
    const { t, s } = await openSession([ack(CReqFileCreate, 2, 5), ack(CReqFileWrite), ack(CReqFileClose)], { partition: 6 });
    const seen: number[] = [];
    const at = await createFileStreamed(s, { bytes: program, name: 'Two Chunk', bank: 2, slot: 5 }, { chunkBytes: 300, onProgress: (d) => seen.push(d) });
    expect(at).toEqual({ bank: 2, slot: 5 });
    expect(sentIds(t)).toEqual([CReqFileCreate, CReqFileWrite, CReqFileWrite, CReqFileWrite, CReqFileClose]);
    const create = decodeReply(t.sent[0]);
    expect(create.words.slice(0, 7)).toEqual([2, 5, record.length, ext2Type('ns4p'), 0xffffffff, readCbinHeader(program).category, 9]);
    expect([1, 2, 3].map((i) => decodeReply(t.sent[i]).words.slice(0, 4))).toEqual([
      [2, 5, 0, 300], [2, 5, 300, 300], [2, 5, 600, record.length - 600],
    ]);
    expect([...decodeReply(t.sent[3]).payload.subarray(16)]).toEqual([...record.subarray(600)]);
    expect(seen).toEqual([300, 600, record.length]);
  });

  it('follows the place the create reply names', async () => {
    const { t, s } = await openSession([ack(CReqFileCreate, 3, 9), ack(CReqFileWrite), ack(CReqFileClose)]);
    const at = await createFileStreamed(s, { bytes: program, name: 'Moved', bank: 0, slot: 1 }, { chunkBytes: 65024 });
    expect(at).toEqual({ bank: 3, slot: 9 });
    expect(decodeReply(t.sent[1]).words.slice(0, 2)).toEqual([3, 9]);
    expect(decodeReply(t.sent[2]).words.slice(0, 2)).toEqual([3, 9]);
  });

  it('keeps the asked place when the create reply carries none', async () => {
    const { s } = await openSession([ack(CReqFileCreate), ack(CReqFileWrite), ack(CReqFileClose)]);
    expect(await createFileStreamed(s, { bytes: program, name: 'x', bank: 1, slot: 2 }, { chunkBytes: 65024 })).toEqual({ bank: 1, slot: 2 });
  });

  it('says so when the Nord already has the name, and writes nothing', async () => {
    const { t, s } = await openSession([status(CReqFileCreate, 4)]);
    const err = await createFileStreamed(s, { bytes: program, name: 'Pad', bank: 0, slot: 1 }, { chunkBytes: 65024 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NameTakenError);
    expect((err as Error).message).toBe('The Nord already has a file called “Pad”, and it keeps one per name.');
    expect(sentIds(t)).toEqual([CReqFileCreate]);
  });

  it('says the Nord ran out of room when the create says so, and writes nothing', async () => {
    const { t, s } = await openSession([status(CReqFileCreate, 25)]);
    const err = await createFileStreamed(s, { bytes: program, name: 'Pad', bank: 0, slot: 1 }, { chunkBytes: 65024 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NoRoomError);
    expect(sentIds(t)).toEqual([CReqFileCreate]);
  });

  it('no answer to the create: a stream error, nothing kept, the close status unknown', async () => {
    const scripted = new NordSession(new ScriptedTransport([ack(CReqBegin), TIMEOUT]));
    scripted.allowWrites([5]);
    await scripted.begin(5);
    const err = await createFileStreamed(scripted, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 65024 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as StreamWriteError).mayBeKept).toBe(false);
    expect((err as StreamWriteError).closeStatus).toBeUndefined();
  });

  it('every chunk acknowledged, no answer to the close: a stream error that says it may be kept', async () => {
    const scripted = new NordSession(new ScriptedTransport([ack(CReqBegin), ack(CReqFileCreate, 0, 1), ack(CReqFileWrite), TIMEOUT]));
    scripted.allowWrites([5]);
    await scripted.begin(5);
    const err = await createFileStreamed(scripted, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 65024 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as StreamWriteError).mayBeKept).toBe(true);
    expect((err as StreamWriteError).closeStatus).toBeUndefined();
  });

  it('closes the file to abort when the write ack is not OK', async () => {
    const { t, s } = await openSession([ack(CReqFileCreate, 0, 1), status(CReqFileWrite, 9), ack(CReqFileClose)]);
    const err = await createFileStreamed(s, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 400 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as Error).message).toMatch(/code 9.*may have been kept on the Nord/);
    expect(sentIds(t)).toEqual([CReqFileCreate, CReqFileWrite, CReqFileWrite, CReqFileWrite, CReqFileClose]);
  });

  it('a create reply that names no place: sends nothing more, and the file may be open on the Nord (a lost session)', async () => {
    const { t, s } = await openSession([ack(CReqFileCreate, 0xffffffff, 0xffffffff)]);
    const err = await createFileStreamed(s, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 65024 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as Error).message).toMatch(/without naming a place/);
    // No close went out, so its status is unknown: callers treat the session as lost.
    expect((err as StreamWriteError).closeStatus).toBeUndefined();
    expect((err as StreamWriteError).mayBeKept).toBe(true);
    expect(sentIds(t)).toEqual([CReqFileCreate]);
  });

  it('refuses before any frame on a partition not confirmed writable', async () => {
    const { t, s } = await openSession([], { partition: 5, writable: [] });
    await expect(createFileStreamed(s, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 400 })).rejects.toBeInstanceOf(WriteBlockedError);
    expect(t.sent).toHaveLength(0);
  });

  it('a reply for another request is an error, not a silent mismatch', async () => {
    const { s } = await openSession([ack(CReqFileCreate, 0, 1), ack(CReqFileClose), ack(CReqFileClose)]);
    await expect(createFileStreamed(s, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 65024 })).rejects.toThrow(/unexpected reply opcode 0xf for request 0x10/);
  });
});

describe('deviceNameBytes', () => {
  it('cuts a name to 128 bytes without splitting a character', () => {
    expect(deviceNameBytes('Pad').length).toBe(3);
    expect(deviceNameBytes('x'.repeat(200)).length).toBe(128);
    expect(new TextDecoder().decode(deviceNameBytes(`${'x'.repeat(127)}é`))).toBe('x'.repeat(127));
  });

  it('cuts to a smaller byte budget on a character boundary', () => {
    expect(new TextDecoder().decode(deviceNameBytes('aéb', 2))).toBe('a');
    expect(deviceName('x'.repeat(200))).toBe('x'.repeat(128));
  });
});

describe('eraseBlocks', () => {
  it('asks for the erase, then polls every 750 ms until the Nord is no longer busy', async () => {
    const { t, s } = await openSession([
      ack(CReqEraseBlock), ack(CQryEraseStatus, 4, 1, 1), ack(CQryEraseStatus, 4, 4, 0),
    ]);
    const sleep = vi.fn(async () => {});
    const progress: [number, number][] = [];
    await eraseBlocks(s, 4, { sleep, onProgress: (d, tot) => progress.push([d, tot]) });
    expect(sentIds(t)).toEqual([CReqEraseBlock, CQryEraseStatus, CQryEraseStatus]);
    expect(decodeReply(t.sent[0]).words[0]).toBe(4);
    expect(sleep.mock.calls).toEqual([[ERASE_POLL_MS], [ERASE_POLL_MS]]);
    expect(progress).toEqual([[1, 4], [4, 4]]);
  });

  it('puts the exact EraseBlock and erase status frames on the wire', async () => {
    const { t, s } = await openSession([ack(CReqEraseBlock), ack(CQryEraseStatus, 3, 3, 0)]);
    await eraseBlocks(s, 3, { sleep: async () => {} });
    expect(t.sent).toEqual([encodeMessage(CReqEraseBlock, [3]), encodeMessage(CQryEraseStatus, [])]);
  });

  it('sends nothing for zero blocks', async () => {
    const { t, s } = await openSession([]);
    await eraseBlocks(s, 0);
    expect(t.sent).toHaveLength(0);
  });

  it('refuses before any frame on a partition not confirmed writable', async () => {
    const { t, s } = await openSession([], { partition: 5, writable: [] });
    await expect(eraseBlocks(s, 4, { sleep: async () => {} })).rejects.toBeInstanceOf(WriteBlockedError);
    expect(t.sent).toHaveLength(0);
  });

  it('gives up when the erase takes too long', async () => {
    const { s } = await openSession([ack(CReqEraseBlock), ack(CQryEraseStatus, 4, 0, 1)]);
    let clock = 0;
    await expect(eraseBlocks(s, 4, { sleep: async () => { clock += 10_000; }, now: () => clock, timeoutMs: 5_000 }))
      .rejects.toThrow('Making room on your Nord took too long, so nothing was written. Switch the Nord off and on, then try again.');
  });

  it('refuses a block count that is not a whole number', async () => {
    const { t, s } = await openSession([]);
    await expect(eraseBlocks(s, 1.5, { sleep: async () => {} })).rejects.toThrow(NordError);
    expect(t.sent).toHaveLength(0);
  });

  it('stops on a refused erase', async () => {
    const { s } = await openSession([status(CReqEraseBlock, 21)]);
    await expect(eraseBlocks(s, 2, { sleep: async () => {} })).rejects.toThrow(/couldn’t make room \(code 21\)/);
  });

  it('stops on a refused status poll', async () => {
    const { s } = await openSession([ack(CReqEraseBlock), status(CQryEraseStatus, 3)]);
    await expect(eraseBlocks(s, 2, { sleep: async () => {} })).rejects.toThrow(/couldn’t make room \(code 3\)/);
  });

  it('a status reply without the busy word is an error, not "done"', async () => {
    const { s } = await openSession([ack(CReqEraseBlock), ack(CQryEraseStatus, 4, 4)]);
    await expect(eraseBlocks(s, 4, { sleep: async () => {} })).rejects.toThrow(NordError);
  });
});

/** A MockTransport that records the bound each reply read was given. */
class TimedTransport extends MockTransport {
  readonly bounds: (number | undefined)[] = [];
  override async bulkIn(maxLength: number, timeoutMs?: number): Promise<Uint8Array> {
    this.bounds.push(timeoutMs);
    return super.bulkIn(maxLength);
  }
}

async function timedSession(replies: Uint8Array[]): Promise<{ t: TimedTransport; s: NordSession }> {
  const t = new TimedTransport([ack(CReqBegin), ...replies]);
  const s = new NordSession(t);
  s.allowWrites([5]);
  await s.begin(5);
  t.bounds.length = 0;
  return { t, s };
}

describe('reply bounds', () => {
  it('bounds every reply of a streamed write when the caller set no bound', async () => {
    const { t, s } = await timedSession([ack(CReqFileCreate, 0, 1), ack(CReqFileWrite), ack(CReqFileClose)]);
    await createFileStreamed(s, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 400 });
    expect(t.bounds).toEqual([WRITE_REPLY_TIMEOUT_MS, writeAckTimeoutMs(record.length), WRITE_REPLY_TIMEOUT_MS]);
  });

  it('bounds every erase reply when the caller set no bound', async () => {
    const { t, s } = await timedSession([ack(CReqEraseBlock), ack(CQryEraseStatus, 1, 1, 0)]);
    await eraseBlocks(s, 1, { sleep: async () => {} });
    expect(t.bounds).toEqual([WRITE_REPLY_TIMEOUT_MS, WRITE_REPLY_TIMEOUT_MS]);
  });

  it('sizes the final ack bound to the record, and never below the caller\'s', () => {
    expect(writeAckTimeoutMs(10 * 1024 * 1024)).toBe(WRITE_REPLY_TIMEOUT_MS + 40_000);
    expect(writeAckTimeoutMs(1, 600_000)).toBe(600_000);
  });

  it('keeps a bound the caller already set (the ack read gets at least its sized bound)', async () => {
    const { t, s } = await timedSession([ack(CReqFileCreate, 0, 1), ack(CReqFileWrite), ack(CReqFileClose)]);
    await s.withReplyTimeout(5_000, () => createFileStreamed(s, { bytes: program, name: 'x', bank: 0, slot: 1 }, { chunkBytes: 65024 }));
    expect(t.bounds).toEqual([5_000, writeAckTimeoutMs(record.length), 5_000]);
  });
});

async function scriptedSession(script: (Uint8Array | typeof TIMEOUT)[]): Promise<{ t: ScriptedTransport; s: NordSession }> {
  const t = new ScriptedTransport([ack(CReqBegin), ...script]);
  const s = new NordSession(t);
  s.allowWrites([5]);
  await s.begin(5);
  t.sent.length = 0;
  t.bounds.length = 0;
  return { t, s };
}

describe('a failed streamed write keeps the session in step', () => {
  const file = { bytes: program, name: 'x', bank: 0, slot: 1 };
  const warn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

  it('a late ack is drained, the abort close gets its own reply, and a committed file is reported as maybe kept', async () => {
    const w = warn();
    const { t, s } = await scriptedSession([
      ack(CReqFileCreate, 0, 1), TIMEOUT, ack(CReqFileWrite), TIMEOUT, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const err = await createFileStreamed(s, file, { chunkBytes: 400 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as StreamWriteError).mayBeKept).toBe(true);
    expect((err as StreamWriteError).closeStatus).toBe(0);
    expect((err as Error).message).toMatch(/may have been kept on the Nord/);
    expect((err as Error).message).not.toMatch(/Nothing was kept/);
    expect(t.bounds.slice(1, 4)).toEqual([writeAckTimeoutMs(record.length), DRAIN_MS, DRAIN_MS]);
    expect(sentIds(t)).toEqual([CReqFileCreate, CReqFileWrite, CReqFileWrite, CReqFileWrite, CReqFileClose]);
    expect(w).toHaveBeenCalledWith(expect.stringContaining('abort close status: 0'), expect.anything());
    await expect(s.end()).resolves.toMatchObject({ msgId: CReqEnd | 1, status: 0 });
    w.mockRestore();
  });

  it('an ack later than the drain is skipped while waiting for the close; a refused close means nothing was kept', async () => {
    const w = warn();
    const { s } = await scriptedSession([
      ack(CReqFileCreate, 0, 1), TIMEOUT, TIMEOUT, ack(CReqFileWrite), status(CReqFileClose, 38), ack(CQryEraseStatus),
    ]);
    const err = await createFileStreamed(s, file, { chunkBytes: 400 }).catch((e: unknown) => e);
    expect((err as StreamWriteError).mayBeKept).toBe(false);
    expect((err as StreamWriteError).closeStatus).toBe(38);
    expect((err as Error).message).toMatch(/Nothing was kept \(the abort close answered code 38\)/);
    await expect(s.request(CQryEraseStatus, []) /* any later request gets its own reply */).resolves.toMatchObject({ status: 0 });
    w.mockRestore();
  });

  it('a close the Nord never answers is reported as maybe kept', async () => {
    const w = warn();
    const { s } = await scriptedSession([ack(CReqFileCreate, 0, 1), TIMEOUT, TIMEOUT, TIMEOUT]);
    const err = await createFileStreamed(s, file, { chunkBytes: 400 }).catch((e: unknown) => e);
    expect((err as StreamWriteError).mayBeKept).toBe(true);
    expect((err as Error).message).toMatch(/didn’t answer the abort/);
    expect((err as StreamWriteError).closeStatus).toBeUndefined();
    expect((err as StreamWriteError).sessionLost).toBe(false); // only the caller that skips the end marks it
    w.mockRestore();
  });
});

