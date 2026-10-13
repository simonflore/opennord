// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useListFilters } from './useListFilters';

describe('useListFilters', () => {
  it('keeps the filters when the id names any entry of a listed row, and clears them otherwise', () => {
    const reset = vi.fn();
    const shown = [{ id: 'folder:a', members: [{ id: 'folder:a' }, { id: 'cloud:x1' }] }];
    const { result } = renderHook(() => useListFilters(shown, [{ active: true, reset }]));
    result.current.ensureListed('cloud:x1');
    expect(reset).not.toHaveBeenCalled();
    result.current.ensureListed('folder:b');
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
