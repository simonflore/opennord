// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { enumerateFiles, pullFile } from '../../lib/device/transfer';
import { useSamplesFlow } from './useSamplesFlow';

vi.mock('../../lib/device/transfer', () => ({ enumerateFiles: vi.fn(), pullFile: vi.fn() }));
const mockEnum = vi.mocked(enumerateFiles);
const mockPull = vi.mocked(pullFile);

const fakeSession = { withSession: (_p: unknown, fn: () => unknown) => Promise.resolve(fn()) } as never;
const sampleEntry = { bank: 0, slot: 1, name: 'Kick.wav' } as never;

beforeEach(() => {
  mockEnum.mockReset(); mockEnum.mockResolvedValue([sampleEntry] as never);
  mockPull.mockReset(); mockPull.mockResolvedValue(new Uint8Array([1, 2, 3]) as never);
});

describe('useSamplesFlow', () => {
  it('defaults to the programs view', () => {
    const { result } = renderHook(() => useSamplesFlow(fakeSession));
    expect(result.current.view).toBe('programs');
    expect(result.current.sampleEntries).toEqual([]);
  });

  it('lazily enumerates Samp Lib once when switching to samples', async () => {
    const { result } = renderHook(() => useSamplesFlow(fakeSession));
    await act(async () => { await result.current.switchView('samples'); });
    expect(result.current.view).toBe('samples');
    await waitFor(() => expect(result.current.sampleEntries).toHaveLength(1));
    expect(mockEnum).toHaveBeenCalledOnce();
    // Switching away and back must not re-enumerate (cache by length).
    await act(async () => { await result.current.switchView('programs'); });
    await act(async () => { await result.current.switchView('samples'); });
    expect(mockEnum).toHaveBeenCalledOnce();
  });

  it('openSample pulls bytes and opens the inspector', async () => {
    const { result } = renderHook(() => useSamplesFlow(fakeSession));
    await act(async () => { await result.current.openSample(sampleEntry); });
    await waitFor(() => expect(result.current.sampleInput?.name).toBe('Kick.wav'));
    expect(mockPull).toHaveBeenCalledOnce();
    expect(result.current.pullPct).toBeNull();
  });
});
