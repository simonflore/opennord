// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { CapabilitiesProvider } from '../capabilities/CapabilitiesContext';
import type { Diagnostics } from '../capabilities/types';
import { useReportRepeatedIds } from './useReportRepeatedIds';

function setup(entries: { id: string }[]) {
  const diagnostics: Diagnostics = { record: vi.fn() };
  const value = { diagnostics };
  const wrapper = ({ children }: { children: ReactNode }) => <CapabilitiesProvider value={value}>{children}</CapabilitiesProvider>;
  const hook = renderHook(({ list }) => useReportRepeatedIds('program', list), { wrapper, initialProps: { list: entries } });
  return { record: diagnostics.record as ReturnType<typeof vi.fn>, ...hook };
}

describe('useReportRepeatedIds', () => {
  it('stays quiet while every id is its own', () => {
    const { record } = setup([{ id: 'nord:A:11' }, { id: 'nord:A:12' }]);
    expect(record).not.toHaveBeenCalled();
  });

  it('records once per list when an id named more than one file', () => {
    const list = [{ id: 'nord:A:11' }, { id: 'nord:A:11~2' }];
    const { record, rerender } = setup(list);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0][0]).toMatchObject({ kind: 'library.repeated-id', ok: false, detail: { what: 'program', ids: ['nord:A:11'] } });
    rerender({ list });
    expect(record).toHaveBeenCalledTimes(1);
  });
});
