// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DeviceProvider, useDevice } from './DeviceContext';

describe('DeviceContext', () => {
  it('defaults productId to 0 and stores it on connect', () => {
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    expect(result.current.productId).toBe(0);
    act(() => result.current.setConnection({ close: vi.fn(), onLost: vi.fn() } as never, [], 'Nord Stage 3', 0x0030));
    expect(result.current.productId).toBe(0x0030);
    expect(result.current.deviceName).toBe('Nord Stage 3');
  });

  it('resets productId and releases the transport on disconnect', () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    act(() => result.current.setConnection({ close, onLost: vi.fn() } as never, [], 'Nord', 0x0030));
    act(() => result.current.disconnect());
    expect(result.current.productId).toBe(0);
    expect(close).toHaveBeenCalledTimes(1); // the claimed USB interface must not leak
  });

  it('forgets a Nord that was unplugged, and says so until the next connect', () => {
    const close = vi.fn().mockResolvedValue(undefined);
    let unplug = () => {};
    const session = { close, onLost: (cb: () => void) => { unplug = cb; } };
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    act(() => result.current.setConnection(session as never, [{ name: 'A' } as never], 'Nord', 0x002e));
    act(() => unplug());
    expect(result.current.session).toBeNull();
    expect(result.current.entries).toEqual([]); // not the gone Nord's programs
    expect(result.current.lost).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);

    // A late unplug from that old session must not drop the Nord connected since.
    const next = { close: vi.fn(), onLost: vi.fn() };
    act(() => result.current.setConnection(next as never, [], 'Nord', 0x002e));
    expect(result.current.lost).toBe(false);
    act(() => unplug());
    expect(result.current.session).toBe(next);
  });
});
