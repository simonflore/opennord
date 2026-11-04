import { describe, it, expect, vi, afterEach } from 'vitest';
import { decodeReply } from './protocol';
import { MockTransport, TransportTimeoutError } from './transport';
import { NordSession, SessionLostError } from './session';
import {
  CQryBankList, CQryEraseStatus, CQryFileInfo, CQryFileIterate, CQryPartList, CQryPartState,
  CReqBegin, CReqEnd, CReqEraseBlock, CReqFileClose, CReqFileCreate, CReqFileWrite, ext2Type,
} from './opcodes';
import { cbinRecord } from '../clavia/cbin';
import {
  WriteBlockedError, NOT_YET_TRIED, LIBRARY_READ_ONLY_REASON, STAGE4_ONLY, UNTESTED_WRITES_KEY, NotStage4Error, NotYetTriedError,
} from './write-guard';
import { NameTakenError, NoRoomError, StreamWriteError, afterErase } from './stream-write';
import { noFreePlaceReason } from './fit';
import {
  FLAGS_NO_ERASE, ScriptedTransport, TIMEOUT, ack, bankList, info, iter, partList, partState, sentIds, status, testSample,
} from './wire-replies';
import { sendLibraryFile } from './send-library';

const sample = testSample({ name: 'Test Pad' });
const record = cbinRecord(sample);
const banks = bankList(5, [['Bank 1', 4], ['Bank 2', 4]]);

/** A Stage 4 session with the libraries confirmed writable, answering `replies` in order. */
function stage4(replies: Uint8Array[], writable = [1, 5, 6]) {
  const t = new MockTransport(replies);
  const s = new NordSession(t);
  s.allowWrites(writable);
  s.stage4Layout = true;
  return { t, s };
}

/** The Samp Lib holds these names at 0:0, 0:1, … */
function listing(names: string[]): Uint8Array[] {
  const out: Uint8Array[] = [];
  names.forEach((n, i) => out.push(iter(0, 0, i), info(n, 1000)));
  out.push(iter(1, 0, 0), iter(2, 1, 0));
  return out;
}

/** Everything up to and including the create, for a Samp Lib holding "Pad" at 0:0. */
const upToCreate = () => [partList(), ack(CReqBegin), partState(1, 7, 100, 0), banks, ...listing(['Pad']), ack(CReqFileCreate, 0, 1)];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('sendLibraryFile', () => {
  it('writes into the first empty place, streamed, inside one session', async () => {
    const { t, s } = stage4([...upToCreate(), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd)]);
    const sent = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true });
    expect(sent).toEqual({ bank: 0, slot: 1, name: 'Test Pad' });
    expect(sentIds(t)).toEqual([
      CQryPartList, CReqBegin, CQryPartState, CQryBankList,
      CQryFileIterate, CQryFileInfo, CQryFileIterate, CQryFileIterate,
      CReqFileCreate, CReqFileWrite, CReqFileClose, CReqEnd,
    ]);
    expect(decodeReply(t.sent[1]).words[0]).toBe(5);
    const create = decodeReply(t.sent[8]);
    expect(create.words.slice(0, 7)).toEqual([0, 1, record.length, ext2Type('nsmp'), 0xffffffff, 0x000f0000, 8]);
  });

  it('numbers a name the Nord already has, past every copy', async () => {
    const { s } = stage4([
      partList(), ack(CReqBegin), partState(2, 7, 100, 0), banks, ...listing(['Test Pad', 'Test Pad (1)']),
      ack(CReqFileCreate, 0, 2), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    expect((await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true })).name).toBe('Test Pad (2)');
  });

  it('numbers a long name on the name the Nord keeps, so the number survives the 128-byte cut', async () => {
    const long = 'x'.repeat(130);
    const { t, s } = stage4([
      partList(), ack(CReqBegin), partState(1, 7, 100, 0), banks, ...listing(['x'.repeat(128)]),
      ack(CReqFileCreate, 0, 1), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    const sent = await sendLibraryFile(s, 'sample', sample, long, { enabled: true });
    expect(sent.name).toBe(`${'x'.repeat(124)} (1)`); // the name the Nord got, 128 bytes
    const create = decodeReply(t.sent.find((f) => decodeReply(f).msgId === CReqFileCreate)!);
    expect(create.words[6]).toBe(128);
    expect(new TextDecoder().decode(create.payload.subarray(-128))).toBe(sent.name);
  });

  it('a long name that doesn’t clash comes back as the Nord keeps it', async () => {
    const { s } = stage4([...upToCreate(), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd)]);
    expect((await sendLibraryFile(s, 'sample', sample, 'y'.repeat(140), { enabled: true })).name).toBe('y'.repeat(128));
  });

  it('a refusal after making room says so on the error, so the player isn’t told nothing changed', async () => {
    const { s } = stage4([
      partList(), ack(CReqBegin), partState(0, 0, 100, 5), banks, ...listing([]),
      ack(CReqEraseBlock), ack(CQryEraseStatus, 1, 1, 0), status(CReqFileCreate, 4), ack(CReqEnd),
    ]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true, sleep: async () => {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NameTakenError);
    expect(afterErase(err)).toBe(true);
  });

  it('a refusal before making room is not marked', async () => {
    const { s } = stage4([...upToCreate().slice(0, -1), status(CReqFileCreate, 25), ack(CReqEnd)]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NoRoomError);
    expect(afterErase(err)).toBe(false);
  });

  it('erases the shortfall first, polling until the Nord is done', async () => {
    const sleep = vi.fn(async () => {});
    const progress: string[] = [];
    const { t, s } = stage4([
      partList(), ack(CReqBegin), partState(0, 0, 100, 5), banks, ...listing([]),
      ack(CReqEraseBlock), ack(CQryEraseStatus, 1, 1, 0),
      ack(CReqFileCreate, 0, 0), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd),
    ]);
    await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true, sleep, onProgress: (p) => progress.push(p.step) });
    const erase = t.sent.map(decodeReply).find((f) => f.msgId === CReqEraseBlock)!;
    expect(erase.words[0]).toBe(1);
    expect(sentIds(t).indexOf(CReqEraseBlock)).toBeLessThan(sentIds(t).indexOf(CReqFileCreate));
    expect(sleep).toHaveBeenCalled();
    expect(progress[0]).toBe('making-room');
    expect(progress.at(-1)).toBe('sending');
  });

  it('refuses before any create or erase when only unerasable room is left', async () => {
    const { t, s } = stage4([
      partList({ 5: { flags: FLAGS_NO_ERASE } }), ack(CReqBegin), partState(0, 0, 100, 600), banks, ...listing([]), ack(CReqEnd),
    ]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NoRoomError); // the Send UI says "no room" in its own words
    expect((err as Error).message).toMatch(/sample memory has 0 B free/);
    expect(sentIds(t)).not.toContain(CReqFileCreate);
    expect(sentIds(t)).not.toContain(CReqEraseBlock);
    expect(sentIds(t).at(-1)).toBe(CReqEnd);
  });

  it('refuses with the shared sentence when every place is taken, though the count said otherwise', async () => {
    const { t, s } = stage4([
      partList(), ack(CReqBegin), partState(0, 7, 100, 0), bankList(5, [['Bank 1', 2]]), ...listing(['A', 'B']), ack(CReqEnd),
    ]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NoRoomError);
    expect((err as Error).message).toBe(noFreePlaceReason('sample'));
    expect(sentIds(t)).not.toContain(CReqFileCreate);
    expect(sentIds(t).at(-1)).toBe(CReqEnd);
  });

  it('sends nothing while the gate is closed', async () => {
    const { t, s } = stage4([]);
    await expect(sendLibraryFile(s, 'sample', sample, 'x', { enabled: false })).rejects.toThrow(NOT_YET_TRIED.sample);
    expect(t.sent).toHaveLength(0);
  });

  it('without an override, asks libraryWritesOn: closed by default for a kind not yet tried (pianos)', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    const { t, s } = stage4([]);
    await expect(sendLibraryFile(s, 'piano', sample, 'x')).rejects.toThrow(NOT_YET_TRIED.piano);
    expect(t.sent).toHaveLength(0);
  });

  it('without an override, asks libraryWritesOn: open for samples, tried on a Stage 4', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    const { t, s } = stage4([...upToCreate(), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd)]);
    await expect(sendLibraryFile(s, 'sample', sample, 'Test Pad')).resolves.toEqual({ bank: 0, slot: 1, name: 'Test Pad' });
    expect(sentIds(t)).toContain(CReqFileCreate);
  });

  it('without an override, asks libraryWritesOn: open when the dev switch allows the kind', async () => {
    const store = { getItem: (k: string) => (k === UNTESTED_WRITES_KEY ? '["sample"]' : null), setItem: () => {} };
    vi.stubGlobal('localStorage', store);
    const { t, s } = stage4([...upToCreate(), ack(CReqFileWrite), ack(CReqFileClose), ack(CReqEnd)]);
    await expect(sendLibraryFile(s, 'sample', sample, 'Test Pad')).resolves.toEqual({ bank: 0, slot: 1, name: 'Test Pad' });
    expect(sentIds(t)).toContain(CReqFileCreate);
  });

  it('sends nothing to a keyboard whose sample memory isn’t confirmed', async () => {
    const { t, s } = stage4([], [6]);
    const err = await sendLibraryFile(s, 'sample', sample, 'x', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WriteBlockedError);
    expect((err as Error).message).toBe(LIBRARY_READ_ONLY_REASON.sample);
    expect(t.sent).toHaveLength(0);
  });

  it('sends nothing to a keyboard that isn’t a Stage 4, even with the gate open and its sample memory writable', async () => {
    // A Stage 2 on a current OS: its sample and piano libraries are confirmed writable (connect-probe).
    const t = new MockTransport([]);
    const s = new NordSession(t);
    s.allowWrites([1, 5, 6]);
    for (const kind of ['sample', 'piano'] as const) {
      const err = await sendLibraryFile(s, kind, sample, 'x', { enabled: true }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(NotStage4Error);
      expect((err as Error).message).toBe(STAGE4_ONLY[kind]);
    }
    expect(t.sent).toHaveLength(0);
  });

  it('refuses a write alignment larger than one transfer before anything is erased', async () => {
    // Room is short, so an erase would come first if the piece size were checked at the write.
    const { t, s } = stage4([
      partList({ 5: { words: [65536, 65535, 1 << 17, 0] } }), ack(CReqBegin), partState(0, 0, 100, 5), banks, ...listing([]), ack(CReqEnd),
    ]);
    await expect(sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true, sleep: async () => {} }))
      .rejects.toThrow(/writes in pieces of/);
    expect(sentIds(t)).toEqual([CQryPartList]); // not even a begin
  });

  it('stops when the partition at that index isn’t the sample memory', async () => {
    const { t, s } = stage4([partList({ 5: { name: 'Something Else' } })]);
    await expect(sendLibraryFile(s, 'sample', sample, 'x', { enabled: true })).rejects.toThrow(/couldn’t find your Nord’s sample memory/);
    expect(sentIds(t)).toEqual([CQryPartList]);
  });

  it('refuses a .nsmp3 before talking to the Nord', async () => {
    const { t, s } = stage4([]);
    const nsmp3 = testSample({ name: 'Old', codec: 3 });
    await expect(sendLibraryFile(s, 'sample', nsmp3, 'Old', { enabled: true })).rejects.toThrow(/Only \.nsmp4/);
    expect(t.sent).toHaveLength(0);
  });
});

describe('sendLibraryFile after a failed streamed write', () => {
  function scripted(script: (Uint8Array | typeof TIMEOUT)[]) {
    const t = new ScriptedTransport(script);
    const s = new NordSession(t);
    s.allowWrites([5]);
    s.stage4Layout = true;
    return { t, s };
  }

  it('a close the Nord never answered: no end is sent, the session is marked lost and refuses later writes', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { t, s } = scripted([...upToCreate(), TIMEOUT, TIMEOUT, TIMEOUT]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as StreamWriteError).closeStatus).toBeUndefined();
    expect((err as StreamWriteError).sessionLost).toBe(true);
    expect((err as StreamWriteError).mayBeKept).toBe(true);
    expect(sentIds(t)).not.toContain(CReqEnd);
    expect(sentIds(t).at(-1)).toBe(CReqFileClose);
    expect(() => s.assertWritable()).toThrow(WriteBlockedError);
  });

  it('a close the Nord never answered marks the session dead: what was queued behind the send never runs', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { t, s } = scripted([...upToCreate(), TIMEOUT, TIMEOUT, TIMEOUT]);
    const sending = sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true });
    let ran = false;
    const queued = s.withSession(6, async () => { ran = true; }); // a program write, a list read…
    await sending.catch(() => undefined);
    const sentBefore = t.sent.length;
    await expect(queued).rejects.toBeInstanceOf(SessionLostError);
    expect(ran).toBe(false);
    expect(t.sent).toHaveLength(sentBefore);
    expect(s.isDead).toBe(true);
  });

  it('every chunk acknowledged but no answer to the close: may be kept, and the session is lost', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { t, s } = scripted([...upToCreate(), ack(CReqFileWrite), TIMEOUT]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as StreamWriteError).mayBeKept).toBe(true);
    expect((err as StreamWriteError).sessionLost).toBe(true);
    expect(sentIds(t)).not.toContain(CReqEnd);
    expect(s.isDead).toBe(true);
  });

  it('no answer to the create: nothing was written, and the session is lost', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { t, s } = scripted([...upToCreate().slice(0, -1), TIMEOUT]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as StreamWriteError).mayBeKept).toBe(false);
    expect((err as StreamWriteError).sessionLost).toBe(true);
    expect(sentIds(t)).not.toContain(CReqFileWrite);
    expect(sentIds(t)).not.toContain(CReqEnd);
    expect(s.isDead).toBe(true);
  });

  it('any other reply that never came inside the session: no end, and the session is dead', async () => {
    const { t, s } = scripted([partList(), ack(CReqBegin), TIMEOUT]);
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TransportTimeoutError);
    expect(sentIds(t)).not.toContain(CReqEnd);
    expect(s.isDead).toBe(true);
  });

  it('no answer to the partition list or the begin: the session is dead', async () => {
    for (const script of [[TIMEOUT], [partList(), TIMEOUT]]) {
      const { s } = scripted(script);
      await expect(sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true })).rejects.toBeInstanceOf(TransportTimeoutError);
      expect(s.isDead).toBe(true);
    }
  });

  it('the gate refuses with its own error', async () => {
    const { s } = scripted([]);
    const err = await sendLibraryFile(s, 'sample', sample, 'x', { enabled: false }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NotYetTriedError);
    expect(s.isDead).toBe(false);
  });

  it('a close the Nord answered: the session ends as usual and is not marked lost', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { t, s } = scripted([...upToCreate(), TIMEOUT, TIMEOUT, status(CReqFileClose, 38), ack(CReqEnd)]);
    // (A write-ack timeout drained and closed in step is not a lost session.)
    const err = await sendLibraryFile(s, 'sample', sample, 'Test Pad', { enabled: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StreamWriteError);
    expect((err as StreamWriteError).closeStatus).toBe(38);
    expect((err as StreamWriteError).sessionLost).toBe(false);
    expect((err as StreamWriteError).mayBeKept).toBe(false);
    expect(sentIds(t).at(-1)).toBe(CReqEnd);
  });
});
