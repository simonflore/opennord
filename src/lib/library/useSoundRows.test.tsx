// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LibrarySource } from './types';

let prints: ReadonlyMap<string, string> = new Map();
vi.mock('./useFingerprints', () => ({ useFingerprints: () => prints }));
import { useSoundRows } from './useSoundRows';

type E = { id: string; name: string; source: LibrarySource; bytes?: Uint8Array };
const a: E = { id: 'folder:a', name: 'A', source: 'local', bytes: new Uint8Array([1]) };
const b: E = { id: 'local:1', name: 'A copy', source: 'local', bytes: new Uint8Array([1]) };

describe('useSoundRows', () => {
  it('merges, resolves every member id, and counts where rows are found', () => {
    prints = new Map([['folder:a', 'x1'], ['local:1', 'x1']]);
    const all = [a, b];
    const { result } = renderHook(() => useSoundRows(all));
    expect(result.current.rows.map((r) => r.id)).toEqual(['folder:a']);
    expect(result.current.byId.get('local:1')?.id).toBe('folder:a');
    expect(result.current.found).toEqual({ nord: 0, local: 1, backup: 0, cloud: 0 });
  });
  it('keeps a merged row’s identity when the rows are rebuilt with nothing in it changed', () => {
    prints = new Map([['folder:a', 'x1'], ['local:1', 'x1']]);
    const { result, rerender } = renderHook(({ all }) => useSoundRows(all), { initialProps: { all: [a, b] } });
    const before = result.current.rows[0];
    prints = new Map(prints);              // new fingerprints map, same contents
    rerender({ all: [a, b] });             // and a new list of the same entries
    expect(result.current.rows[0]).toBe(before);
    rerender({ all: [a, { ...b, name: 'Renamed' }] });
    expect(result.current.rows[0]).not.toBe(before);
  });
});
