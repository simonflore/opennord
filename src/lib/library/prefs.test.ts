// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLibraryPrefs, useSamplesPrefs } from './prefs';

beforeEach(() => localStorage.clear());

describe('useSamplesPrefs', () => {
  it('defaults to default sort and no favorites', () => {
    const { result } = renderHook(() => useSamplesPrefs());
    expect(result.current.sort).toBe('default');
    expect(result.current.favorites.size).toBe(0);
  });
  it('toggles a favorite and persists it under its own key', () => {
    const { result } = renderHook(() => useSamplesPrefs());
    act(() => result.current.toggleFavorite('folder:Bell.nsmp4'));
    expect(result.current.isFavorite('folder:Bell.nsmp4')).toBe(true);
    expect(localStorage.getItem('opennord.samples.prefs')).toContain('folder:Bell.nsmp4');
    // library prefs untouched
    expect(localStorage.getItem('opennord.library.prefs')).toBeNull();
  });
  it('accepts size and strokes sorts', () => {
    const { result } = renderHook(() => useSamplesPrefs());
    act(() => result.current.setSort('size'));
    expect(result.current.sort).toBe('size');
  });
});

describe('useLibraryPrefs still works', () => {
  it('persists under the library key', () => {
    const { result } = renderHook(() => useLibraryPrefs());
    act(() => result.current.setSort('name'));
    expect(localStorage.getItem('opennord.library.prefs')).toContain('name');
  });
});
