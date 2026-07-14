// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BP_SPLIT, useSplitLayout } from './responsive';

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe('useSplitLayout', () => {
  it('exposes the documented breakpoint', () => {
    expect(BP_SPLIT).toBe(900);
  });

  it('is true when the viewport is wide enough', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useSplitLayout());
    expect(result.current).toBe(true);
  });

  it('is false on a narrow viewport', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useSplitLayout());
    expect(result.current).toBe(false);
  });
});
