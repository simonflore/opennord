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
  });

  it('scopes the remembered mode per flow', () => {
    // "Overwrite, remember" chosen while converting a sample must NOT silently
    // govern backup re-exports too — a same-day second export would clobber
    // the first with no prompt.
    const sample = renderHook(() => useWriteBackPref('sample'));
    act(() => sample.result.current.setMode('overwrite'));

    const backup = renderHook(() => useWriteBackPref('backup'));
    expect(backup.result.current.mode).toBe('ask');

    const sampleAgain = renderHook(() => useWriteBackPref('sample'));
    expect(sampleAgain.result.current.mode).toBe('overwrite');
  });
});
