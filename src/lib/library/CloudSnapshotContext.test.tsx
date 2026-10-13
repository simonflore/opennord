// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { CapabilitiesProvider } from '../capabilities/CapabilitiesContext';
import { CloudSnapshotProvider, useCloudSnapshot } from './CloudSnapshotContext';

const snapshot = { takenAt: '2026-10-13T13:10:00Z', items: [{ fingerprint: 'x1', kind: 'program' as const, filename: 'Pad.ns4p' }] };
function auth(user: { id: string } | null) {
  let current = user; const listeners = new Set<(u: { id: string } | null) => void>();
  return {
    api: { getUser: () => current, signIn: vi.fn(), signOut: vi.fn(), subscribe: (l: (u: { id: string } | null) => void) => { listeners.add(l); return () => listeners.delete(l); } },
    set: (u: { id: string } | null) => { current = u; listeners.forEach((l) => l(u)); },
  };
}
const setup = (cloud: object, a = auth({ id: 'u1' })) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CapabilitiesProvider value={{ cloud, auth: a.api } as never}><CloudSnapshotProvider>{children}</CloudSnapshotProvider></CapabilitiesProvider>
  );
  return { ...renderHook(() => useCloudSnapshot(), { wrapper }), auth: a };
};

describe('CloudSnapshotProvider', () => {
  it('is absent where the build has no cloud reads, and without a provider', () => {
    expect(setup({ available: false }).result.current.status).toBe('absent');
    expect(renderHook(() => useCloudSnapshot()).result.current).toMatchObject({ status: 'absent', items: [] });
  });
  it('is signed-out without a user and never asks the cloud', () => {
    const latestSnapshot = vi.fn();
    expect(setup({ available: true, latestSnapshot, fetchItem: vi.fn() }, auth(null)).result.current.status).toBe('signed-out');
    expect(latestSnapshot).not.toHaveBeenCalled();
  });
  it('loads the latest snapshot: loading, then ready with its items and time', async () => {
    const { result } = setup({ available: true, latestSnapshot: vi.fn(async () => snapshot), fetchItem: vi.fn() });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toMatchObject({ takenAt: snapshot.takenAt, items: snapshot.items });
  });
  it('is empty with no snapshot, and failed when the cloud cannot be reached', async () => {
    const none = setup({ available: true, latestSnapshot: vi.fn(async () => null), fetchItem: vi.fn() });
    await waitFor(() => expect(none.result.current.status).toBe('empty'));
    const down = setup({ available: true, latestSnapshot: vi.fn(async () => { throw new Error('offline'); }), fetchItem: vi.fn() });
    await waitFor(() => expect(down.result.current.status).toBe('failed'));
    expect(down.result.current.items).toEqual([]);
  });
  it('reloads on refresh and when the user changes; signing out clears it', async () => {
    const latestSnapshot = vi.fn(async () => snapshot);
    const { result, auth: a } = setup({ available: true, latestSnapshot, fetchItem: vi.fn() });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.refresh());
    await waitFor(() => expect(latestSnapshot).toHaveBeenCalledTimes(2));
    act(() => a.set(null));
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    expect(result.current.items).toEqual([]);
    act(() => a.set({ id: 'u2' }));
    await waitFor(() => expect(latestSnapshot).toHaveBeenCalledTimes(3));
  });
  it('fetches a file once, keeps it, and reports a failure until asked again', async () => {
    const fetchItem = vi.fn<(f: string) => Promise<Uint8Array>>()
      .mockRejectedValueOnce(new Error('timeout')).mockResolvedValue(new Uint8Array([7]));
    const { result } = setup({ available: true, latestSnapshot: vi.fn(async () => snapshot), fetchItem });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => { result.current.read('x1'); result.current.read('x1'); });
    expect(result.current.reading.has('x1')).toBe(true);
    await waitFor(() => expect(result.current.failed.get('x1')).toBe('timeout'));
    expect(fetchItem).toHaveBeenCalledTimes(1);          // the second call joined the first
    act(() => result.current.read('x1'));
    await waitFor(() => expect(result.current.files.get('x1')).toEqual(new Uint8Array([7])));
    expect(result.current.failed.has('x1')).toBe(false);
    act(() => result.current.read('x1'));
    expect(fetchItem).toHaveBeenCalledTimes(2);          // already here: not fetched again
  });
  it('a file fetched for one user is fetched again for them after another user had the cloud', async () => {
    const fetchItem = vi.fn(async () => new Uint8Array([7]));
    const { result, auth: a } = setup({ available: true, latestSnapshot: vi.fn(async () => snapshot), fetchItem });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.read('x1'));
    await waitFor(() => expect(result.current.files.has('x1')).toBe(true));
    act(() => a.set({ id: 'u2' }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.files.has('x1')).toBe(false);
    act(() => result.current.read('x2'));
    await waitFor(() => expect(fetchItem).toHaveBeenCalledTimes(2));
    act(() => a.set({ id: 'u1' }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.read('x1'));
    await waitFor(() => expect(result.current.files.has('x1')).toBe(true));
    expect(fetchItem).toHaveBeenCalledTimes(3);
  });
});
