// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DeviceProvider, useDevice } from './DeviceContext';

describe('DeviceContext', () => {
  it('defaults productId to 0 and stores it on connect', () => {
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    expect(result.current.productId).toBe(0);
    act(() => result.current.setConnection({ close: vi.fn() } as never, [], 'Nord Stage 3', 0x0030));
    expect(result.current.productId).toBe(0x0030);
    expect(result.current.deviceName).toBe('Nord Stage 3');
  });

  it('resets productId and releases the transport on disconnect', () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDevice(), { wrapper: DeviceProvider });
    act(() => result.current.setConnection({ close } as never, [], 'Nord', 0x0030));
    act(() => result.current.disconnect());
    expect(result.current.productId).toBe(0);
    expect(close).toHaveBeenCalledTimes(1); // the claimed USB interface must not leak
  });
});
