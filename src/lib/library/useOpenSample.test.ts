// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SampleEntry } from './sample-entries';
import { useOpenSample } from './useOpenSample';

// A stand-in for SamplesContext: the list, the reader and the read key.
const ctx = {
  entries: new Map<string, SampleEntry>(),
  session: 1,
  readSample: vi.fn(),
};
vi.mock('./SamplesContext', () => ({
  useSamplesState: () => ({
    entryById: (id: string) => ctx.entries.get(id),
    readSample: ctx.readSample,
    readKey: (e: SampleEntry) => (e.source === 'nord' ? `${e.id}@${ctx.session}` : e.id),
  }),
}));

const entry = (id: string, source: SampleEntry['source']) => ({ id, name: id, source }) as SampleEntry;
const bytes = new Uint8Array([1, 2, 3]);

beforeEach(() => {
  ctx.entries = new Map([['a', entry('a', 'local')], ['n', entry('n', 'nord')]]);
  ctx.session = 1;
  ctx.readSample.mockReset().mockResolvedValue(bytes);
});

describe('useOpenSample', () => {
  it('reads the named sample once and opens it', async () => {
    const { result } = renderHook(() => useOpenSample('a'));
    await act(async () => {});
    expect(result.current).toMatchObject({ state: 'open', sample: { id: 'a', bytes } });
    expect(ctx.readSample).toHaveBeenCalledTimes(1);
  });

  it('opens a local sample from the bytes in hand, without reading', () => {
    ctx.entries.set('h', { ...entry('h', 'local'), bytes } as SampleEntry);
    const { result } = renderHook(() => useOpenSample('h'));
    expect(result.current).toMatchObject({ state: 'open', sample: { id: 'h', bytes } });
    expect(ctx.readSample).not.toHaveBeenCalled();
  });

  it('keeps the sample open through a rescan that drops and re-adds the entry', async () => {
    const { result, rerender } = renderHook(() => useOpenSample('a'));
    await act(async () => {});
    const kept = ctx.entries.get('a')!;
    ctx.entries.delete('a');
    rerender();
    expect(result.current).toMatchObject({ state: 'open', listed: false });
    const shown = result.current.state === 'open' && result.current.sample;
    ctx.entries.set('a', { ...kept });
    rerender();
    await act(async () => {});
    expect(result.current).toMatchObject({ state: 'open', listed: true });
    // the same object, so the inspector doesn't reload it
    expect(result.current.state === 'open' && result.current.sample).toBe(shown);
    expect(ctx.readSample).toHaveBeenCalledTimes(1);
  });

  it('re-reads a Nord sample on a new session, but not a file', async () => {
    const nord = renderHook(() => useOpenSample('n'));
    const file = renderHook(() => useOpenSample('a'));
    await act(async () => {});
    expect(ctx.readSample).toHaveBeenCalledTimes(2);
    ctx.session = 2;
    nord.rerender();
    file.rerender();
    await act(async () => {});
    expect(ctx.readSample).toHaveBeenCalledTimes(3);
    expect(ctx.readSample.mock.calls[2][0].id).toBe('n');
  });

  it('reports a failed read and reads again on retry', async () => {
    ctx.readSample.mockRejectedValueOnce(new Error('connect your Nord to read it.'));
    const { result } = renderHook(() => useOpenSample('n'));
    await act(async () => {});
    expect(result.current).toMatchObject({ state: 'failed', error: 'Could not read n: connect your Nord to read it.' });
    await act(async () => { if (result.current.state === 'failed') result.current.retry(); });
    expect(result.current.state).toBe('open');
    expect(ctx.readSample).toHaveBeenCalledTimes(2);
  });

  it('says a sample named before it is listed is missing, and reads it when it arrives', async () => {
    const { result, rerender } = renderHook(() => useOpenSample('later'));
    expect(result.current.state).toBe('missing');
    ctx.entries.set('later', entry('later', 'local'));
    rerender();
    await act(async () => {});
    expect(result.current).toMatchObject({ state: 'open', listed: true });
  });

  it('stops a read that has not finished when its entry leaves the list', async () => {
    ctx.readSample.mockReturnValue(new Promise(() => {}));
    const { rerender } = renderHook(() => useOpenSample('n'));
    await act(async () => {});
    const signal: AbortSignal = ctx.readSample.mock.calls[0][2];
    ctx.entries.delete('n');
    rerender();
    expect(signal.aborted).toBe(true);
  });

  it('lets go of the read when the route moves on', async () => {
    ctx.readSample.mockReturnValue(new Promise(() => {}));
    const { rerender } = renderHook(({ id }) => useOpenSample(id), { initialProps: { id: 'n' as string | undefined } });
    await act(async () => {});
    const signal: AbortSignal = ctx.readSample.mock.calls[0][2];
    expect(signal.aborted).toBe(false);
    rerender({ id: undefined });
    expect(signal.aborted).toBe(true);
  });

  it('opens a cloud-only sample through its read, without a percentage, and says why a fetch failed', async () => {
    ctx.entries.set('cloud:s2', entry('cloud:s2', 'cloud'));
    let finish: (b: Uint8Array) => void = () => {};
    ctx.readSample.mockReturnValueOnce(new Promise<Uint8Array>((r) => { finish = r; }));
    const { result } = renderHook(() => useOpenSample('cloud:s2'));
    expect(result.current).toEqual({ state: 'reading', pct: null });
    await act(async () => finish(bytes));
    expect(result.current).toMatchObject({ state: 'open', sample: { id: 'cloud:s2', bytes, name: 'cloud:s2' } });

    ctx.entries.set('cloud:s3', entry('cloud:s3', 'cloud'));
    ctx.readSample.mockRejectedValueOnce(new Error('offline'));
    const failed = renderHook(() => useOpenSample('cloud:s3'));
    await act(async () => {});
    expect(failed.result.current).toMatchObject({ state: 'failed', error: 'Could not read cloud:s3: offline' });
  });
});
