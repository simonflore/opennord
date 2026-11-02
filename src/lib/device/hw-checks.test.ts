import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeReply } from './protocol';
import { NordSession } from './session';
import { CQryPartList, CReqBegin, CReqEnd, CReqFileClose, CReqFileCreate, CReqFileWrite } from './opcodes';
import { cbinRecord } from '../clavia/cbin';
import { ScriptedTransport, TIMEOUT, ack, bankList, info, iter, partList, partState, sentIds, status } from './wire-replies';
import { readPartitionList } from './partition-list';
import { StreamWriteError } from './stream-write';
import { WriteBlockedError } from './write-guard';
import { describeFlags, nextAllowed, runTwoPieceWrite } from './hw-checks';

const program = new Uint8Array(readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))));
const record = cbinRecord(program); // 824 bytes

const opening = [partList(), ack(CReqBegin), partState(0, 100, 0, 0), bankList(6, [['Bank A', 64]]), iter(2, 0, 0)];

function run(script: (Uint8Array | typeof TIMEOUT)[]) {
  const t = new ScriptedTransport(script);
  const s = new NordSession(t);
  s.allowWrites([6]);
  return { t, s, result: runTwoPieceWrite(s, program, 10) };
}

const writes = (t: ScriptedTransport) => t.sent.map(decodeReply).filter((f) => f.msgId === CReqFileWrite);

describe('runTwoPieceWrite', () => {
  it('writes to the first empty program slot in two aligned pieces, and finds one answer', async () => {
    const { t, result } = run([...opening, ack(CReqFileCreate, 0, 0), TIMEOUT, ack(CReqFileWrite), TIMEOUT, ack(CReqFileClose), ack(CReqEnd)]);
    const r = await result;
    expect(r).toMatchObject({ at: { bank: 0, slot: 0 }, name: 'OPENNORD 2PIECE', acks: 'one-answer', pieces: [512, record.length - 512] });
    expect(r.observed).toMatch(/after piece 1: no answer within 10 ms/);
    expect(writes(t).map((w) => w.words.slice(2, 4))).toEqual([[0, 512], [512, record.length - 512]]);
  });

  it('reports an answer after each piece', async () => {
    const { result } = run([...opening, ack(CReqFileCreate, 0, 0), ack(CReqFileWrite), ack(CReqFileWrite), TIMEOUT, ack(CReqFileClose), ack(CReqEnd)]);
    const r = await result;
    expect(r.acks).toBe('answer-per-piece');
    expect(r.observed).toMatch(/after piece 1: answer \(status 0\)/);
  });

  it('counts a first-piece answer that came late, so the close still reads its own reply', async () => {
    const { t, result } = run([
      ...opening, ack(CReqFileCreate, 0, 0), TIMEOUT, ack(CReqFileWrite), ack(CReqFileWrite), TIMEOUT, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const r = await result;
    expect(r.acks).toBe('answer-per-piece');
    expect(r.observed).toMatch(/late answers: 1/);
    expect(sentIds(t).slice(-2)).toEqual([CReqFileClose, CReqEnd]);
  });

  it('fails a refused second piece whose refusal comes after a late first answer, and aborts', async () => {
    const { t, s, result } = run([
      ...opening, ack(CReqFileCreate, 0, 0), TIMEOUT, ack(CReqFileWrite), status(CReqFileWrite, 5), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const e = await result.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(StreamWriteError);
    expect((e as Error).message).toMatch(/refused a piece \(code 5\)/);
    expect(s.isDead).toBe(false);
    expect(sentIds(t).slice(-2)).toEqual([CReqFileClose, CReqEnd]);
  });

  it('skips an answer that comes after the window, at the close, and stays in step', async () => {
    const { t, s, result } = run([
      ...opening, ack(CReqFileCreate, 0, 0), TIMEOUT, ack(CReqFileWrite), TIMEOUT, ack(CReqFileWrite) /* late, at the close */,
      ack(CReqFileClose), ack(CReqEnd), partList(),
    ]);
    const r = await result;
    expect(r.acks).toBe('answer-per-piece');
    expect(r.observed).toMatch(/first answer after piece 2: status 0, \d+ ms after piece 2/);
    expect(r.observed).toMatch(/late answer during the close, \d+ ms after piece 2 \(status 0\)/);
    expect(r.observed).toMatch(/closed \(status 0\); late answers: 1/);
    expect(s.isDead).toBe(false);
    // In step: the next request reads its own reply.
    expect(await s.exclusive(() => readPartitionList(s))).toHaveLength(12);
    expect(t.sent.length).toBeGreaterThan(0);
  });

  it('marks the session lost when the commit close is never answered', async () => {
    const { t, s, result } = run([...opening, ack(CReqFileCreate, 0, 0), TIMEOUT, ack(CReqFileWrite), TIMEOUT, TIMEOUT /* the close */]);
    const e = await result.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(StreamWriteError);
    expect((e as StreamWriteError).closeStatus).toBeUndefined();
    expect((e as StreamWriteError).sessionLost).toBe(true);
    expect(s.isDead).toBe(true);
    expect(sentIds(t)).not.toContain(CReqEnd);
  });

  it('aborts before any piece when the Nord opens the file at another place', async () => {
    const { t, s, result } = run([...opening, ack(CReqFileCreate, 0, 5), TIMEOUT /* drain */, ack(CReqFileClose), ack(CReqEnd)]);
    const e = await result.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(StreamWriteError);
    expect((e as Error).message).toMatch(/another place \(0\/5, asked for 0\/0\)/);
    expect(writes(t)).toHaveLength(0);
    expect(decodeReply(t.sent.at(-2)!).words.slice(0, 2)).toEqual([0, 5]); // the abort closes the handle the Nord opened
    expect(s.isDead).toBe(false);
  });

  it('never picks a taken slot: the first empty one after the program list', async () => {
    const { result } = run([
      partList(), ack(CReqBegin), partState(1, 100, 0, 0), bankList(6, [['Bank A', 64]]),
      iter(0, 0, 0), info('OPENNORD 2PIECE', 824), iter(1, 0, 0), iter(2, 1, 0),
      ack(CReqFileCreate, 0, 1), TIMEOUT, ack(CReqFileWrite), TIMEOUT, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const r = await result;
    expect(r.at).toEqual({ bank: 0, slot: 1 });
    expect(r.name).not.toBe('OPENNORD 2PIECE'); // the test name is taken: numbered, never replaced
  });

  it('refuses a file too small to split at the write size, before creating anything', async () => {
    const t = new ScriptedTransport([partList({ 6: { words: [65536, 65535, 4096, 0] } }), ack(CReqBegin), partState(0, 100, 0, 0), bankList(6, [['Bank A', 64]]), iter(2, 0, 0), ack(CReqEnd)]);
    const s = new NordSession(t);
    s.allowWrites([6]);
    await expect(runTwoPieceWrite(s, program, 10)).rejects.toThrow(/too small to split/);
    expect(sentIds(t)).not.toContain(CReqFileCreate);
  });

  it('refuses before any frame when the program partition is not confirmed writable', async () => {
    const t = new ScriptedTransport([]);
    const s = new NordSession(t);
    await expect(runTwoPieceWrite(s, program, 10)).rejects.toBeInstanceOf(WriteBlockedError);
    expect(t.sent).toHaveLength(0);
  });

  it('aborts with drain-and-close when the last answer never comes, and ends the session', async () => {
    const { t, s, result } = run([
      ...opening, ack(CReqFileCreate, 0, 0), TIMEOUT, TIMEOUT /* last answer */, TIMEOUT /* drain */, ack(CReqFileClose), ack(CReqEnd),
    ]);
    const e = await result.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(StreamWriteError);
    expect((e as StreamWriteError).closeStatus).toBe(0);
    expect((e as StreamWriteError).sessionLost).toBe(false);
    expect(s.isDead).toBe(false);
    expect(sentIds(t).slice(-2)).toEqual([CReqFileClose, CReqEnd]);
  });

  it('marks the session lost when the abort close is never answered', async () => {
    const { t, s, result } = run([
      ...opening, ack(CReqFileCreate, 0, 0), TIMEOUT, TIMEOUT, TIMEOUT, TIMEOUT /* the close */,
    ]);
    const e = await result.catch((x: unknown) => x);
    expect(e).toBeInstanceOf(StreamWriteError);
    expect((e as StreamWriteError).sessionLost).toBe(true);
    expect(s.isDead).toBe(true);
    expect(sentIds(t)).not.toContain(CReqEnd);
  });

  it('marks the session dead when the partition list never answers', async () => {
    const { t, s, result } = run([TIMEOUT]);
    await expect(result).rejects.toThrow();
    expect(s.isDead).toBe(true);
    expect(sentIds(t)).toEqual([CQryPartList]);
  });
});

describe('describeFlags', () => {
  it('labels the positions known from NSM and shows every byte in hex', () => {
    const cells = describeFlags([1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0xff, 0, 0]);
    expect(cells).toHaveLength(13);
    expect(cells[0]).toEqual({ index: 0, hex: '01', label: 'unresolved (start bank?)' });
    expect(cells[7]).toEqual({ index: 7, hex: '01', label: 'match (0 = by name)' });
    expect(cells[10]).toEqual({ index: 10, hex: 'ff', label: 'erase' });
    expect(cells[11]).toEqual({ index: 11, hex: '00', label: 'dependencies' });
    expect(cells[3].label).toBeUndefined();
  });
});

describe('nextAllowed', () => {
  it('adds a kind once and removes it', () => {
    expect(nextAllowed(['sample'], 'sample', true)).toEqual(['sample']);
    expect(nextAllowed(['sample'], 'piano', true)).toEqual(['sample', 'piano']);
    expect(nextAllowed(['sample', 'piano'], 'sample', false)).toEqual(['piano']);
  });
});
