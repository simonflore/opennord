// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { deleteProgram } from '../../lib/device/transfer';
import { useDeleteFlow } from './useDeleteFlow';

vi.mock('../../lib/device/transfer', () => ({ deleteProgram: vi.fn() }));
const mockDelete = vi.mocked(deleteProgram);

const fakeSession = { withSession: (_p: unknown, fn: () => unknown) => Promise.resolve(fn()) } as never;
const entry = { bank: 0, slot: 5, name: 'Old Pad' } as never;

beforeEach(() => { mockDelete.mockReset(); mockDelete.mockResolvedValue(undefined); });

describe('useDeleteFlow', () => {
  it('holds a pending delete until confirmed', () => {
    const { result } = renderHook(() => useDeleteFlow(fakeSession, vi.fn()));
    act(() => result.current.setPendingDelete(entry));
    expect(result.current.pendingDelete).toBe(entry);
  });

  it('confirmDelete removes the program, refreshes, and clears the pending state', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteFlow(fakeSession, refresh));
    act(() => result.current.setPendingDelete(entry));
    await act(async () => { await result.current.confirmDelete(); });
    expect(mockDelete).toHaveBeenCalledOnce();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(result.current.pendingDelete).toBeNull();
  });

  it('surfaces a delete error and keeps the pending state', async () => {
    mockDelete.mockReset();
    mockDelete.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useDeleteFlow(fakeSession, vi.fn()));
    act(() => result.current.setPendingDelete(entry));
    await act(async () => { await result.current.confirmDelete(); });
    expect(result.current.error).toMatch(/nope/);
    expect(result.current.pendingDelete).toBe(entry);
  });
});
