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
    act(() => result.current.setSort('strokes'));
    expect(result.current.sort).toBe('strokes');
    expect(localStorage.getItem('opennord.samples.prefs')).toContain('strokes');
  });
});

describe('useLibraryPrefs still works', () => {
  it('persists under the library key', () => {
    const { result } = renderHook(() => useLibraryPrefs());
    act(() => result.current.setSort('name'));
    expect(localStorage.getItem('opennord.library.prefs')).toContain('name');
  });

  it('marks a row by its fingerprint and every entry id, and unmarks every key it was ever marked by', () => {
    localStorage.setItem('opennord.library.prefs', JSON.stringify({ sort: 'default', favorites: ['cloud:x1'] }));
    const row = { id: 'folder:a', name: 'A', source: 'local' as const, fingerprint: 'x1', members: [{ id: 'folder:a', source: 'local' as const, name: 'A' }, { id: 'cloud:x1', source: 'cloud' as const, name: 'A' }] };
    const { result } = renderHook(() => useLibraryPrefs());
    expect(result.current.isFavoriteRow(row)).toBe(true);     // an old per-entry favourite still marks it
    act(() => result.current.toggleFavoriteRow(row));
    expect(result.current.isFavoriteRow(row)).toBe(false);
    expect([...result.current.favorites]).toEqual([]);
    act(() => result.current.toggleFavoriteRow(row));
    expect([...result.current.favorites]).toEqual(['x1', 'folder:a', 'cloud:x1']);
  });
});
