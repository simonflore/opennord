// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWriteBackPref } from './writeBackPrefs';

describe('useWriteBackPref', () => {
  beforeEach(() => localStorage.clear());
  it('defaults to ask and persists a change', () => {
    const { result } = renderHook(() => useWriteBackPref());
    expect(result.current.mode).toBe('ask');
    act(() => result.current.setMode('overwrite'));
    expect(result.current.mode).toBe('overwrite');
    expect(localStorage.getItem('opennord.writeback.mode')).toContain('overwrite');
  });
});
