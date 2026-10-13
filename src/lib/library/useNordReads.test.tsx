// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { NordSession } from '../device/session';
import type { ProgramEntry } from '../device/transfer';

const stage4 = new Uint8Array(readFileSync('src/lib/ns4/__fixtures__/BreakFree_chords.ns4p'));
const pull = vi.fn<(s: unknown, e: ProgramEntry) => Promise<Uint8Array>>();
vi.mock('../device/transfer', () => ({ pullProgram: (s: unknown, e: ProgramEntry) => pull(s, e) }));

import { useNordReads } from './useNordReads';
import { nordEntriesFromDevice } from './entries';

const slot = (n: number, name: string): ProgramEntry =>
  ({ bank: 0, slot: n, name, categoryId: 0, version: 313, sizeBytes: 10, fourcc: 'ns4p' });
const session = { programPartition: 3, withSession: (_p: number, fn: () => Promise<unknown>) => fn() } as unknown as NordSession;

function setup(list: ProgramEntry[]) {
  return renderHook(({ entries }) => useNordReads(session, entries, nordEntriesFromDevice(entries)), { initialProps: { entries: list } });
}

describe('useNordReads', () => {
  beforeEach(() => { pull.mockReset(); });

  it('reads a slot into a program, leaving the others as they were', async () => {
    pull.mockResolvedValue(stage4);
    const list = [slot(0, 'Wurli'), slot(1, 'Pad')];
    const { result } = setup(list);
    const before = result.current.entries;
    act(() => result.current.read('nord:A:11'));
    expect(result.current.reading).toBe('nord:A:11');
    await waitFor(() => expect(result.current.reading).toBeNull());
    const [wurli, pad] = result.current.entries;
    expect(wurli.program?.name).toBe('Wurli'); // keeps the Nord's name for it
    expect(wurli.bytes).toBe(stage4);
    expect(pad.program).toBeUndefined();
    expect(before[1].id).toBe(pad.id);
  });

  it('reads one slot at a time', async () => {
    let finish!: (b: Uint8Array) => void;
    pull.mockReturnValueOnce(new Promise((r) => { finish = r; }));
    const { result } = setup([slot(0, 'Wurli'), slot(1, 'Pad')]);
    act(() => { result.current.read('nord:A:11'); result.current.read('nord:A:12'); });
    expect(pull).toHaveBeenCalledTimes(1);
    await act(async () => finish(stage4));
    expect(result.current.reading).toBeNull();
  });

  it('says why a read failed, and forgets the reads once the Nord lists its programs again', async () => {
    pull.mockRejectedValueOnce(new Error('The Nord didn’t answer.'));
    const list = [slot(0, 'Wurli')];
    const { result, rerender } = setup(list);
    act(() => result.current.read('nord:A:11'));
    await waitFor(() => expect(result.current.failed).toMatchObject({ id: 'nord:A:11', message: 'The Nord didn’t answer.' }));
    expect(result.current.entries[0].program).toBeUndefined();

    pull.mockResolvedValueOnce(stage4);
    act(() => result.current.read('nord:A:11'));
    await waitFor(() => expect(result.current.entries[0].program).toBeDefined());
    expect(result.current.failed).toBeNull();

    rerender({ entries: [slot(0, 'Wurli')] }); // re-enumerated: the slot may hold something else now
    expect(result.current.entries[0].program).toBeUndefined();
  });

  it('lets the next Nord read after one that stopped answering', () => {
    pull.mockReturnValueOnce(new Promise(() => {})); // never answers
    const { result, rerender } = setup([slot(0, 'Wurli')]);
    act(() => result.current.read('nord:A:11'));
    expect(result.current.reading).toBe('nord:A:11');

    pull.mockReturnValueOnce(new Promise(() => {}));
    rerender({ entries: [slot(0, 'Wurli')] }); // unplugged and connected again
    expect(result.current.reading).toBeNull();
    act(() => result.current.read('nord:A:11'));
    expect(pull).toHaveBeenCalledTimes(2);
    expect(result.current.reading).toBe('nord:A:11');
  });
});
