// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { executePlan } from '../../lib/device/execute';
import { useReorgFlow } from './useReorgFlow';
import type { Plan } from '../../lib/device/reorg';

vi.mock('../../lib/device/execute', () => ({ executePlan: vi.fn() }));
vi.mock('../../lib/device/device-io', () => ({ sessionDeviceIO: () => ({}) }));
const mockExec = vi.mocked(executePlan);

const fakeSession = { withSession: (_p: unknown, fn: () => unknown) => Promise.resolve(fn()) } as never;
const plan: Plan = { ops: [], journalSlots: [], summary: 'Move "X" from C:11 to D:11' };

beforeEach(() => { mockExec.mockReset(); mockExec.mockResolvedValue({ ok: true, completedOps: 2, rolledBack: false, warnings: [] }); });

describe('useReorgFlow', () => {
  it('runs the backup once, executes the plan, refreshes, and reports success', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const backupOnce = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReorgFlow(fakeSession, refresh, backupOnce));
    act(() => result.current.setPendingPlan(plan));
    await act(async () => { await result.current.confirmReorg(); });
    expect(backupOnce).toHaveBeenCalledOnce();
    expect(mockExec).toHaveBeenCalledOnce();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(result.current.result?.ok).toBe(true);
    expect(result.current.pendingPlan).toBeNull();
  });

  it('surfaces a failed/rolled-back result without clearing on error', async () => {
    mockExec.mockResolvedValue({ ok: false, completedOps: 1, rolledBack: true, warnings: ['x'] });
    const { result } = renderHook(() => useReorgFlow(fakeSession, vi.fn().mockResolvedValue(undefined), vi.fn().mockResolvedValue(undefined)));
    act(() => result.current.setPendingPlan(plan));
    await act(async () => { await result.current.confirmReorg(); });
    expect(result.current.result?.rolledBack).toBe(true);
  });
});
