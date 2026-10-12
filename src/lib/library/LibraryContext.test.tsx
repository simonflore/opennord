// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import type React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { LibraryProvider, useLibraryData, useLibraryState } from './LibraryContext';

// The provider's own sources, held stable like the real ones between renders.
const device = { entries: [] };
const folder = { result: { programs: [] } };
let imported = { entries: [] as { id: string; name: string; source: 'local' }[], add: async () => {}, remove: async () => {} };
const prefs = { sort: 'default', favorites: new Set<string>(), setSort: () => {}, isFavorite: () => false, toggleFavorite: () => {} };
vi.mock('@/lib/device/DeviceContext', () => ({ useDevice: () => device }));
vi.mock('@/lib/folder/FolderContext', () => ({ useFolder: () => folder }));
vi.mock('@/lib/library/useImportedLibrary', () => ({ useImportedLibrary: () => imported }));
const tree = (children: React.ReactNode) => <LibraryProvider>{children}</LibraryProvider>;
vi.mock('@/lib/library/prefs', () => ({ useLibraryPrefs: () => prefs }));

afterEach(cleanup);

describe('LibraryProvider', () => {
  it('a useLibraryData consumer (the shell) does not re-render as the search is typed', () => {
    let dataRenders = 0;
    let setQuery: (q: string) => void = () => {};
    function Shell() { useLibraryData(); dataRenders++; return null; }
    function Search() { setQuery = useLibraryState().setQuery; return null; }
    render(<LibraryProvider><Shell /><Search /></LibraryProvider>);
    const before = dataRenders;
    act(() => setQuery('pad'));
    act(() => setQuery('pads'));
    expect(dataRenders).toBe(before);
  });

  it('a useLibraryData consumer still follows the entries and the source filter', () => {
    let seen: { count: number; source: string } = { count: -1, source: '' };
    let setSource: (s: 'all' | 'local') => void = () => {};
    function Shell() {
      const d = useLibraryData();
      seen = { count: d.all.length, source: d.source };
      setSource = d.setSource;
      return null;
    }
    const { rerender } = render(tree(<Shell />));
    expect(seen).toEqual({ count: 0, source: 'all' });
    imported = { ...imported, entries: [{ id: 'local:1', name: 'Pad', source: 'local' }] };
    rerender(tree(<Shell />));
    expect(seen.count).toBe(1);
    act(() => setSource('local'));
    expect(seen.source).toBe('local');
  });
});
