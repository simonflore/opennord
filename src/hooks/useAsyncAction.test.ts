// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncAction } from './useAsyncAction';

describe('useAsyncAction', () => {
  it('runs the action, returns its value, and leaves busy false', async () => {
    const { result } = renderHook(() => useAsyncAction());
    expect(result.current.busy).toBe(false);
    let value: number | undefined;
    await act(async () => { value = await result.current.run(async () => 42); });
    expect(value).toBe(42);
    expect(result.current.busy).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('stores the raw error message on throw and returns undefined', async () => {
    const { result } = renderHook(() => useAsyncAction());
    let value: unknown = 'sentinel';
    await act(async () => { value = await result.current.run(async () => { throw new Error('boom'); }); });
    expect(value).toBeUndefined();
    expect(result.current.error).toBe('boom');
    expect(result.current.busy).toBe(false);
  });

  it('uses a custom onError formatter when provided', async () => {
    const { result } = renderHook(() => useAsyncAction());
    await act(async () => {
      await result.current.run(async () => { throw new Error('x'); }, (e) => `wrapped: ${(e as Error).message}`);
    });
    expect(result.current.error).toBe('wrapped: x');
  });

  it('clears a prior error when the next run starts', async () => {
    const { result } = renderHook(() => useAsyncAction());
    await act(async () => { await result.current.run(async () => { throw new Error('first'); }); });
    expect(result.current.error).toBe('first');
    await act(async () => { await result.current.run(async () => 'ok'); });
    expect(result.current.error).toBe('');
  });
});
