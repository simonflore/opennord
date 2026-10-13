// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sha256Hex, useFingerprints } from './useFingerprints';

const bytes = (...n: number[]) => new Uint8Array(n);

describe('sha256Hex', () => {
  it('is the SHA-256 of the bytes, in lower-case hex', async () => {
    // The well-known digest of "abc".
    expect(await sha256Hex(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('useFingerprints', () => {
  it('fills in a fingerprint per entry that has bytes, and none for one that has not', async () => {
    const entries = [{ id: 'a', bytes: bytes(1, 2, 3) }, { id: 'b', bytes: bytes(1, 2, 3) }, { id: 'c' }];
    const { result } = renderHook(() => useFingerprints(entries));
    expect(result.current.size).toBe(0); // the list never waits
    await waitFor(() => expect(result.current.size).toBe(2));
    expect(result.current.get('a')).toBe(result.current.get('b'));
    expect(result.current.has('c')).toBe(false);
  });

  it('does not hash the same bytes object twice across re-renders or lists', async () => {
    const digest = vi.spyOn(crypto.subtle, 'digest');
    const shared = bytes(9, 9, 9);
    const first = [{ id: 'a', bytes: shared }];
    const { result, rerender } = renderHook(({ list }) => useFingerprints(list), { initialProps: { list: first } });
    await waitFor(() => expect(result.current.size).toBe(1));
    const calls = digest.mock.calls.length;
    rerender({ list: [{ id: 'a', bytes: shared }, { id: 'a2', bytes: shared }] });
    await waitFor(() => expect(result.current.size).toBe(2));
    expect(digest.mock.calls.length).toBe(calls);
    digest.mockRestore();
  });

  it('rehashes when an entry gets new bytes (a rescan of an edited file of the same size)', async () => {
    const { result, rerender } = renderHook(({ list }) => useFingerprints(list), { initialProps: { list: [{ id: 'a', bytes: bytes(1, 1) }] } });
    await waitFor(() => expect(result.current.size).toBe(1));
    const before = result.current.get('a');
    rerender({ list: [{ id: 'a', bytes: bytes(2, 2) }] });
    await waitFor(() => expect(result.current.get('a')).not.toBe(before));
  });

  it('drops entries that went away', async () => {
    const { result, rerender } = renderHook(({ list }) => useFingerprints(list), { initialProps: { list: [{ id: 'a', bytes: bytes(1) }, { id: 'b', bytes: bytes(2) }] } });
    await waitFor(() => expect(result.current.size).toBe(2));
    rerender({ list: [{ id: 'b', bytes: bytes(2) }] });
    await waitFor(() => expect([...result.current.keys()]).toEqual(['b']));
  });

  it('returns the same map while no fingerprint changed, so what is built from it is not rebuilt', async () => {
    const list = [{ id: 'a', bytes: bytes(5, 5) }];
    const { result, rerender } = renderHook(({ list }) => useFingerprints(list), { initialProps: { list } });
    await waitFor(() => expect(result.current.size).toBe(1));
    const before = result.current;
    rerender({ list });
    expect(result.current).toBe(before);
    rerender({ list: [...list] });
    expect(result.current).toBe(before);
  });
});
