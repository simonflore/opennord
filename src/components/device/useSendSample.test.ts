// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { TransportLostError, TransportTimeoutError } from '@/lib/device/transport';
import type { NordSession } from '@/lib/device/session';
import type { SendOptions } from '@/lib/device/send-library';
import { NordError } from '@/lib/device/protocol';
import { NameTakenError, NoRoomError, StreamWriteError, markAfterErase } from '@/lib/device/stream-write';
import { writeNsmp } from '@/lib/ns4/nsmp-write';
import {
  LIBRARY_READ_ONLY_REASON, NOT_YET_TRIED, NotStage4Error, NotYetTriedError, STAGE4_ONLY, UNTESTED_WRITES_EVENT, WriteBlockedError,
} from '@/lib/device/write-guard';
import { NordSession as RealSession, SessionLostError, STOPPED_ANSWERING } from '@/lib/device/session';
import { SessionRefusedError } from '@/lib/device/protocol';
import { CReqBegin, CReqFileCreate, CReqFileWrite } from '@/lib/device/opcodes';
import {
  ScriptedTransport, TIMEOUT, ack, bankList, info, iter, partList, partState, testSample,
} from '@/lib/device/wire-replies';

const gate = { on: true };
const device = {
  session: null as NordSession | null, setSampleEntries: vi.fn(), isCurrent: () => true, markLost: vi.fn(),
};
const sendLibraryFile = vi.fn();
vi.mock('@/lib/device/DeviceContext', () => ({ useDevice: () => device }));
vi.mock('@/lib/device/write-guard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/device/write-guard')>()),
  libraryWritesOn: () => gate.on,
  libraryWritesNow: () => ({ sample: gate.on, piano: gate.on }),
}));
vi.mock('@/lib/device/send-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/device/send-library')>()),
  sendLibraryFile: (...a: unknown[]) => sendLibraryFile(...a),
}));
vi.mock('@/lib/device/samples', () => ({ enumerateSampleLibrary: vi.fn(async () => []) }));
import { CONNECT_TO_SEND, sendFailureText, sendNameFor, sendProgressText, useSendSample } from './useSendSample';

const tone = Array.from({ length: 500 }, (_, i) => Math.round(6000 * Math.sin(i / 8)));
const nsmp4 = writeNsmp({ name: 'Pad', channels: [tone], codec: 4 });
const nsmp3 = writeNsmp({ name: 'Pad', channels: [tone], codec: 3 });
const session = (writable = true, stage4Layout = true) => ({ canWrite: () => writable, stage4Layout }) as unknown as NordSession;

const STOPPED = STOPPED_ANSWERING;
const MAY_BE_KEPT = 'The sample may be on your Nord now; check it there before sending again.';
const NOT_ACCEPTED = 'The Nord didn’t accept the sample. Nothing was changed.';

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  gate.on = true;
  device.session = session();
  sendLibraryFile.mockReset();
  device.setSampleEntries.mockReset();
  device.markLost.mockReset();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => { warn.mockRestore(); });

/** Send once with `sendLibraryFile` failing with `error`; returns the hook. */
async function failWith(error: unknown) {
  sendLibraryFile.mockRejectedValueOnce(error);
  const hook = renderHook(() => useSendSample());
  await act(async () => { await hook.result.current.send(nsmp4, 'Pad'); });
  return hook;
}

describe('useSendSample', () => {
  it('without a Nord: not connected, and says to connect', () => {
    device.session = null;
    const { result } = renderHook(() => useSendSample());
    expect(result.current.connected).toBe(false);
    expect(result.current.refusal(nsmp4)).toBe(CONNECT_TO_SEND);
  });

  it('greys Send with the reason, in order: gate, model, read-only keyboard, file', () => {
    gate.on = false;
    expect(renderHook(() => useSendSample()).result.current.refusal(nsmp4)).toBe(NOT_YET_TRIED.sample);
    gate.on = true;
    // A Stage 2 on a current OS: its sample memory is confirmed writable, but it isn't a Stage 4.
    device.session = session(true, false);
    expect(renderHook(() => useSendSample()).result.current.refusal(nsmp4)).toBe(STAGE4_ONLY.sample);
    device.session = session(false);
    expect(renderHook(() => useSendSample()).result.current.refusal(nsmp4)).toBe(LIBRARY_READ_ONLY_REASON.sample);
    device.session = session();
    const { result } = renderHook(() => useSendSample());
    expect(result.current.refusal(nsmp3)).toMatch(/Only \.nsmp4/);
    expect(result.current.refusal(nsmp4)).toBeUndefined();
    expect(result.current.refusal()).toBeUndefined();
  });

  it('follows the /dev/hardware switch: the refusal re-renders when it changes', () => {
    gate.on = false;
    const { result } = renderHook(() => useSendSample());
    const before = result.current.refusal;
    expect(before(nsmp4)).toBe(NOT_YET_TRIED.sample);
    gate.on = true;
    act(() => { window.dispatchEvent(new Event(UNTESTED_WRITES_EVENT)); });
    expect(result.current.refusal).not.toBe(before);
    expect(result.current.refusal(nsmp4)).toBeUndefined();
  });

  it('shows progress, then says where the sample went and why it was renamed', async () => {
    let release!: () => void;
    sendLibraryFile.mockImplementation(async (_s: unknown, _k: unknown, _b: unknown, _n: unknown, opts: SendOptions) => {
      opts.onProgress?.({ step: 'sending', done: 50, total: 100 });
      await new Promise<void>((r) => { release = r; });
      return { bank: 0, slot: 2, name: 'Pad (2)' };
    });
    const { result } = renderHook(() => useSendSample());
    let sending!: Promise<void>;
    act(() => { sending = result.current.send(nsmp4, 'Pad'); });
    expect(result.current.busy).toBe(true);
    expect(result.current.status).toBe('Sending to your Nord… 50%');
    await act(async () => { release(); await sending; });
    expect(result.current.busy).toBe(false);
    expect(result.current.status).toBe('Sent to your Nord as “Pad (2)”: it already had a sample called “Pad”.');
  });

  it('sends once on a double click', async () => {
    sendLibraryFile.mockResolvedValue({ bank: 0, slot: 0, name: 'Pad' });
    const { result } = renderHook(() => useSendSample());
    await act(async () => { await Promise.all([result.current.send(nsmp4, 'Pad'), result.current.send(nsmp4, 'Pad')]); });
    expect(sendLibraryFile).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('Sent “Pad” to your Nord.');
  });

  it('says plainly when the Nord is unplugged mid-send, and can send again', async () => {
    sendLibraryFile.mockRejectedValueOnce(new TransportLostError());
    const { result } = renderHook(() => useSendSample());
    await act(async () => { await result.current.send(nsmp4, 'Pad'); });
    expect(result.current.status).toBe('Couldn’t send: Your Nord was disconnected.');
    expect(result.current.busy).toBe(false);
    sendLibraryFile.mockResolvedValueOnce({ bank: 0, slot: 0, name: 'Pad' });
    await act(async () => { await result.current.send(nsmp4, 'Pad'); });
    expect(result.current.status).toBe('Sent “Pad” to your Nord.');
  });

  it('names the sample on the Nord without its file extension, never with an empty name', () => {
    expect(sendNameFor('Warm Pad.nsmp4')).toBe('Warm Pad');
    expect(sendNameFor('Warm Pad')).toBe('Warm Pad');
    expect(sendNameFor('  ')).toBe('Sample');
    expect(sendNameFor('.nsmp4')).toBe('Sample');
  });

  it('says “making room” while the Nord erases, as a percentage', () => {
    expect(sendProgressText({ step: 'making-room', done: 1, total: 4 })).toBe('Making room on your Nord… 25%');
    expect(sendProgressText({ step: 'sending', done: 0, total: 0 })).toBe('Sending to your Nord… 0%');
  });
});

describe('useSendSample: a Nord that stopped answering', () => {
  it('drops the session at once, says to unplug, and keeps saying it once the Nord is gone', async () => {
    const lost = new StreamWriteError('raw: abort close never answered', true, new Error('x'), undefined);
    lost.sessionLost = true;
    const sent = device.session;
    const hook = await failWith(lost);
    expect(device.markLost).toHaveBeenCalledTimes(1);
    expect(device.markLost).toHaveBeenCalledWith(sent, STOPPED);
    expect(hook.result.current.status).toBe(`Couldn’t send: ${STOPPED} ${MAY_BE_KEPT}`);
    expect(device.setSampleEntries).not.toHaveBeenCalled();
    // The Nord is forgotten: the reason must not vanish with it.
    device.session = null;
    hook.rerender();
    expect(hook.result.current.status).toBe(`Couldn’t send: ${STOPPED} ${MAY_BE_KEPT}`);
    // A Nord connected afterwards starts clean.
    device.session = session();
    hook.rerender();
    expect(hook.result.current.status).toBe('');
  });

  it('treats a reply that never came as a Nord that stopped answering', async () => {
    const hook = await failWith(new TransportTimeoutError(60_000));
    expect(device.markLost).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toBe(`Couldn’t send: ${STOPPED}`);
  });

  it('a session already dead (an operation queued behind the lost one) also says to unplug', async () => {
    const hook = await failWith(new SessionLostError());
    expect(device.markLost).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toBe(`Couldn’t send: ${STOPPED}`);
  });

  it('every chunk acknowledged, no answer to the close: says both “may be on your Nord” and “unplug it”', async () => {
    const { sendLibraryFile: realSend } = await vi.importActual<typeof import('@/lib/device/send-library')>('@/lib/device/send-library');
    const nord = new RealSession(new ScriptedTransport([
      partList(), ack(CReqBegin), partState(0, 7, 100, 0), bankList(5, [['Bank 1', 4]]),
      iter(0, 0, 0), info('Other', 1000), iter(1, 0, 0), iter(2, 1, 0),
      ack(CReqFileCreate, 0, 1), ack(CReqFileWrite), TIMEOUT,
    ]));
    nord.allowWrites([5]);
    nord.stage4Layout = true;
    const error = await realSend(nord, 'sample', testSample(), 'Pad', { enabled: true }).catch((e: unknown) => e);
    expect(nord.isDead).toBe(true);
    const hook = await failWith(error);
    expect(hook.result.current.status).toBe(`Couldn’t send: ${STOPPED} ${MAY_BE_KEPT}`);
    expect(device.markLost).toHaveBeenCalledTimes(1);
  });

  it('leaves the session alone on any other failure', async () => {
    await failWith(new NordError('The Nord refused the new file (code 7). Nothing was written.'));
    expect(device.markLost).not.toHaveBeenCalled();
  });
});

describe('useSendSample: failures in plain words', () => {
  it('turns anything the Nord refused into one sentence, with the detail in the console only', async () => {
    const raw = new NordError('The Nord refused the new file (code 7). Nothing was written.');
    const hook = await failWith(raw);
    expect(hook.result.current.status).toBe(`Couldn’t send: ${NOT_ACCEPTED}`);
    expect(warn).toHaveBeenCalledWith(expect.any(String), raw);
  });

  it('says honestly when the sample may have been kept', async () => {
    const hook = await failWith(new StreamWriteError('raw (code 3)', true, new Error('x'), 0));
    expect(hook.result.current.status).toBe(`Couldn’t send: ${MAY_BE_KEPT}`);
    expect(device.markLost).not.toHaveBeenCalled();
  });

  it('a write the Nord discarded is “nothing was changed”', async () => {
    const hook = await failWith(new StreamWriteError('raw (code 3)', false, new Error('x'), 5));
    expect(hook.result.current.status).toBe(`Couldn’t send: ${NOT_ACCEPTED}`);
  });

  it('says a refusal by the gate or the model by itself, without “Couldn’t send:”', async () => {
    expect((await failWith(new NotYetTriedError('sample'))).result.current.status).toBe(NOT_YET_TRIED.sample);
    expect((await failWith(new NotStage4Error('sample'))).result.current.status).toBe(STAGE4_ONLY.sample);
  });

  it('gives no room, a name clash, read-only and the gate their own sentences', () => {
    expect(sendFailureText('sample', new NoRoomError('needs 3,145,728 bytes'))).toBe(
      'There isn’t room for this sample on your Nord. Remove some samples there, then try again. Nothing was changed.',
    );
    expect(sendFailureText('sample', new NameTakenError('“Pad” at bank 2'))).toBe(
      'Your Nord already has a sample with this name. Rename it, then try again. Nothing was changed.',
    );
    expect(sendFailureText('sample', new WriteBlockedError(LIBRARY_READ_ONLY_REASON.sample))).toBe(LIBRARY_READ_ONLY_REASON.sample);
    expect(sendFailureText('sample', new NotYetTriedError('sample'))).toBe(NOT_YET_TRIED.sample);
    expect(sendFailureText('sample', new NotStage4Error('sample'))).toBe(STAGE4_ONLY.sample);
    expect(sendFailureText('sample', new SessionRefusedError(5, 13))).toBe(
      'Your Nord is busy (a menu is open, or Nord Sound Manager is connected). Close it and try again.',
    );
    expect(sendFailureText('sample', new TransportLostError())).toBe('Your Nord was disconnected.');
  });

  it('after making room, never says nothing was changed: the samples themselves are unchanged', () => {
    const marked = <E extends Error>(e: E) => { markAfterErase(e); return e; };
    expect(sendFailureText('sample', marked(new NoRoomError('x')))).toBe(
      'There isn’t room for this sample on your Nord. Remove some samples there, then try again. Your samples are unchanged.',
    );
    expect(sendFailureText('sample', marked(new NameTakenError('x')))).toBe(
      'Your Nord already has a sample with this name. Rename it, then try again. Your samples are unchanged.',
    );
    expect(sendFailureText('piano', marked(new NordError('code 9')))).toBe('The Nord didn’t accept the piano. Your pianos are unchanged.');
    for (const e of [new NoRoomError('x'), new NameTakenError('x'), new NordError('x')]) {
      expect(sendFailureText('sample', marked(e))).not.toMatch(/Nothing was changed/);
    }
  });

  it('names what the Nord got: a long name as the Nord keeps it, not as a clash', async () => {
    const long = 'y'.repeat(140);
    sendLibraryFile.mockResolvedValueOnce({ bank: 0, slot: 0, name: 'y'.repeat(128) });
    const { result } = renderHook(() => useSendSample());
    await act(async () => { await result.current.send(nsmp4, long); });
    expect(result.current.status).toBe(`Sent “${'y'.repeat(128)}” to your Nord.`);
  });

  it('has the piano’s words for a piano', () => {
    expect(sendFailureText('piano', new NordError('code 9'))).toBe('The Nord didn’t accept the piano. Nothing was changed.');
    expect(sendFailureText('piano', new StreamWriteError('raw', true, null, 0))).toBe(
      'The piano may be on your Nord now; check it there before sending again.',
    );
  });

  it('never shows codes, places or sizes', () => {
    const errors = [
      new NordError('The Nord refused the new file (code 7). Nothing was written.'),
      new NordError('The Nord opened the file without naming a place (bank 0x2, slot 0xffffffff). Nothing was written.'),
      new NoRoomError('Your Nord’s sample memory has 1.2 MB free, and this needs 3.4 MB.'),
      new StreamWriteError('The Nord couldn’t store the file (code 4). Nothing was kept (the abort close answered code 2).', false, null, 2),
      new Error('could not open a transfer session on partition 5 (status 3)'),
    ];
    for (const e of errors) expect(sendFailureText('sample', e)).not.toMatch(/code|bank|slot|partition|status|\d/i);
  });
});
