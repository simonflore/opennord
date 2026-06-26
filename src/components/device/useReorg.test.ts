// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReorg } from './useReorg';
import type { DeviceIO } from '../../lib/device/device-io';
import type { ProgramEntry } from '../../lib/device/transfer';

const prog = (bank: number, slot: number, name: string): ProgramEntry => ({
  bank, slot, name, categoryId: 0, version: 313, sizeBytes: 100, fourcc: 'ns4p',
});
// in-memory DeviceIO good enough for the flow (real engine tested elsewhere)
function ioFor(entries: ProgramEntry[]): DeviceIO {
  const map = new Map(entries.map((e) => [`${e.bank}:${e.slot}`, e]));
  return {
    pull: async () => new Uint8Array(144),
    push: async (_p, addr, _f, name) => { map.set(`${addr.bank}:${addr.slot}`, prog(addr.bank, addr.slot, name)); },
    delete: async (_p, addr) => { map.delete(`${addr.bank}:${addr.slot}`); },
    info: async (_p, addr) => map.get(`${addr.bank}:${addr.slot}`) ?? null,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('useReorg', () => {
  it('a valid move gesture → pending plan with a title', () => {
    const entries = [prog(0, 0, 'A')];
    const { result } = renderHook(() => useReorg({ io: ioFor(entries), partition: 6, entries, refresh: vi.fn() }));
    act(() => result.current.onGesture({ kind: 'move', from: { bank: 0, slot: 0 }, to: { bank: 0, slot: 5 } }));
    expect(result.current.pendingPlan?.title).toBe('Move program');
    expect(result.current.error).toBe('');
  });

  it('an invalid gesture (drop on itself) sets error, no pending plan', () => {
    const entries = [prog(0, 0, 'A')];
    const { result } = renderHook(() => useReorg({ io: ioFor(entries), partition: 6, entries, refresh: vi.fn() }));
    act(() => result.current.onGesture({ kind: 'move', from: { bank: 0, slot: 0 }, to: { bank: 0, slot: 0 } }));
    expect(result.current.pendingPlan).toBeNull();
    expect(result.current.error).toMatch(/same slot/i);
  });

  it('confirm runs backupOnce, executes via run, refreshes, clears the plan', async () => {
    const entries = [prog(0, 0, 'A')];
    const refresh = vi.fn().mockResolvedValue(undefined);
    const backupOnce = vi.fn().mockResolvedValue(undefined);
    const run = vi.fn(async <T,>(fn: () => Promise<T>): Promise<T> => fn()) as <T,>(fn: () => Promise<T>) => Promise<T>;
    const { result } = renderHook(() => useReorg({ io: ioFor(entries), partition: 6, entries, refresh, backupOnce, run }));
    act(() => result.current.onGesture({ kind: 'move', from: { bank: 0, slot: 0 }, to: { bank: 0, slot: 5 } }));
    await act(async () => { await result.current.confirm(); });
    expect(backupOnce).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledOnce();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(result.current.pendingPlan).toBeNull();
    expect(result.current.error).toBe('');
  });
});
