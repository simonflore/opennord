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

describe('DeviceContext: a Nord that stopped answering', () => {
  it('is forgotten at once, its transport released, and the reason kept until the next connect', () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const session = { close, onLost: vi.fn() };
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    act(() => result.current.setConnection(session as never, [{ name: 'A' } as never], 'Nord', 0x002e));
    expect(result.current.lostMessage).toBe('');
    act(() => result.current.markLost(session as never, 'Your Nord stopped answering.'));
    expect(result.current.session).toBeNull();
    expect(result.current.entries).toEqual([]);
    expect(close).toHaveBeenCalledTimes(1); // nothing else can use the session
    expect(result.current.lost).toBe(true);
    expect(result.current.lostMessage).toBe('Your Nord stopped answering.');
    act(() => result.current.setConnection({ close: vi.fn(), onLost: vi.fn() } as never, [], 'Nord', 0x002e));
    expect(result.current.lost).toBe(false);
    expect(result.current.lostMessage).toBe('');
  });

  it('leaves a Nord connected since alone', () => {
    const old = { close: vi.fn().mockResolvedValue(undefined), onLost: vi.fn() };
    const next = { close: vi.fn(), onLost: vi.fn() };
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    act(() => result.current.setConnection(old as never, [], 'Nord', 0x002e));
    act(() => result.current.setConnection(next as never, [], 'Nord', 0x002e));
    act(() => result.current.markLost(old as never, 'Your Nord stopped answering.'));
    expect(result.current.session).toBe(next);
    expect(result.current.lost).toBe(false);
    expect(next.close).not.toHaveBeenCalled();
  });

  it('says an unplugged Nord was disconnected', () => {
    let unplug = () => {};
    const session = { close: vi.fn().mockResolvedValue(undefined), onLost: (cb: () => void) => { unplug = cb; } };
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    act(() => result.current.setConnection(session as never, [], 'Nord', 0x002e));
    act(() => unplug());
    expect(result.current.lostMessage).toBe('Your Nord was disconnected. Connect it again to carry on.');
  });
});

describe('DeviceContext connect', () => {
  it('lets one connect run at a time, for every Connect button', () => {
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    let first = false, second = true;
    act(() => { first = result.current.beginConnect(); second = result.current.beginConnect(); });
    expect(first).toBe(true);
    expect(second).toBe(false); // the other button's click is ignored while the first opens the Nord
    expect(result.current.connectState.status).toBe('connecting');
    act(() => result.current.endConnect({ status: 'error', message: 'No answer' }));
    expect(result.current.connectState).toEqual({ status: 'error', message: 'No answer' });
    let again = false;
    act(() => { again = result.current.beginConnect(); });
    expect(again).toBe(true);
  });
});
