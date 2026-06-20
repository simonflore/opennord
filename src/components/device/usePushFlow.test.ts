// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { pushProgram } from '../../lib/device/transfer';
import { usePushFlow } from './usePushFlow';

vi.mock('../../lib/device/transfer', () => ({ pushProgram: vi.fn() }));
const mockPush = vi.mocked(pushProgram);

// Minimal NordSession stand-in: withSession just runs the callback.
const fakeSession = { withSession: (_p: unknown, fn: () => unknown) => Promise.resolve(fn()) } as never;

beforeEach(() => { mockPush.mockReset(); mockPush.mockResolvedValue(undefined); });

describe('usePushFlow', () => {
  it('starts a push and seeds the editable name from the source', () => {
    const { result } = renderHook(() => usePushFlow(fakeSession, vi.fn()));
    act(() => result.current.startPush({ bytes: new Uint8Array([1]), name: 'Pad' }));
    expect(result.current.pushSource?.name).toBe('Pad');
    expect(result.current.pushName).toBe('Pad');
    expect(result.current.picked).toBeNull();
  });

  it('clears source and pick on cancel', () => {
    const { result } = renderHook(() => usePushFlow(fakeSession, vi.fn()));
    act(() => result.current.startPush({ bytes: new Uint8Array([1]), name: 'Pad' }));
    act(() => result.current.pickSlot({ bank: 0, slot: 3 } as never));
    act(() => result.current.cancel());
    expect(result.current.pushSource).toBeNull();
    expect(result.current.picked).toBeNull();
  });

  it('confirmPush writes the program and refreshes, then resets', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePushFlow(fakeSession, refresh));
    act(() => result.current.startPush({ bytes: new Uint8Array([7]), name: 'Bass' }));
    act(() => result.current.pickSlot({ bank: 1, slot: 2 } as never));
    await act(async () => { await result.current.confirmPush(); });
    expect(mockPush).toHaveBeenCalledOnce();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(result.current.pushSource).toBeNull();
  });

  it('surfaces a write error without resetting the source', async () => {
    mockPush.mockReset();
    mockPush.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => usePushFlow(fakeSession, vi.fn()));
    act(() => result.current.startPush({ bytes: new Uint8Array([1]), name: 'Lead' }));
    act(() => result.current.pickSlot({ bank: 0, slot: 0 } as never));
    await act(async () => { await result.current.confirmPush(); });
    expect(result.current.error).toMatch(/boom/);
    expect(result.current.pushSource).not.toBeNull();
  });
});
