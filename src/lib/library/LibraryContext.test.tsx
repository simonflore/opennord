// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { LibraryProvider, useLibraryData, useLibraryState } from './LibraryContext';
import type { CloudSnapshotState } from './CloudSnapshotContext';

// The provider's own sources, held stable like the real ones between renders.
const device = { entries: [] };
const folder: { result: { programs: { id: string; name: string; bytes: Uint8Array }[] } } = { result: { programs: [] } };
let imported = { entries: [] as { id: string; name: string; source: 'local' }[], add: async () => {}, remove: async () => {} };
const prefs = { sort: 'default', favorites: new Set<string>(), setSort: () => {}, isFavorite: () => false, toggleFavorite: () => {} };
vi.mock('@/lib/device/DeviceContext', () => ({ useDevice: () => device }));
vi.mock('@/lib/folder/FolderContext', () => ({ useFolder: () => folder }));
vi.mock('@/lib/library/useImportedLibrary', () => ({ useImportedLibrary: () => imported }));
const tree = (children: React.ReactNode) => <LibraryProvider>{children}</LibraryProvider>;
vi.mock('@/lib/library/prefs', () => ({ useLibraryPrefs: () => prefs }));
// The cloud source and the fingerprints, as the test sets them.
const noCloud = (): CloudSnapshotState => ({ status: 'absent', items: [], files: new Map(), reading: new Set(), failed: new Map(), read: vi.fn(), refresh: vi.fn() });
let cloudState = noCloud();
let fingerprintsMock: ReadonlyMap<string, string> = new Map();
vi.mock('@/lib/library/CloudSnapshotContext', () => ({ useCloudSnapshot: () => cloudState }));
vi.mock('@/lib/library/useFingerprints', () => ({ useFingerprints: () => fingerprintsMock }));

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

  describe('rows', () => {
    const stage4 = new Uint8Array(readFileSync('src/lib/ns4/__fixtures__/BreakFree_chords.ns4p'));
    const renderLibrary = () => renderHook(() => useLibraryState(), { wrapper: LibraryProvider });
    beforeEach(() => {
      imported = { ...imported, entries: [] };
      folder.result = { programs: [{ id: 'folder:a', name: 'A', bytes: new Uint8Array([1]) }, { id: 'folder:b', name: 'B', bytes: new Uint8Array([2]) }] };
      cloudState = { ...noCloud(), status: 'ready', items: [
        { fingerprint: 'x1', kind: 'program', filename: 'A.ns4p' },
        { fingerprint: 'x2', kind: 'program', filename: 'Lead.ns4p' },
      ] };
      fingerprintsMock = new Map([['folder:a', 'x1'], ['folder:b', 'x3']]);
    });
    afterEach(() => {
      folder.result = { programs: [] };
      cloudState = noCloud();
      fingerprintsMock = new Map();
    });

    // folder:a and cloud:x1 are the same bytes; folder:b is only local; cloud:x2 is only in the cloud.
    it('merges a local file with its cloud copy, lists cloud-only sounds, and leaves `all` as the files here', () => {
      const { result } = renderLibrary();
      expect(result.current.rows.map((r) => [r.id, r.sources ?? [r.source]])).toEqual([
        ['folder:a', ['local', 'cloud']], ['folder:b', ['local']], ['cloud:x2', ['cloud']],
      ]);
      expect(result.current.all.map((e) => e.id)).toEqual(['folder:a', 'folder:b']);   // what backup and the share picker read
      expect(result.current.all.every((e) => e.source !== 'cloud' && e.sources === undefined)).toBe(true);
    });
    it('resolves every member id to the row, so a link through the cloud id opens the merged row', () => {
      const { result } = renderLibrary();
      expect(result.current.entryById('cloud:x1')?.id).toBe('folder:a');
      expect(result.current.entryById('folder:a')?.id).toBe('folder:a');
      expect(result.current.entryById('folder:b')?.id).toBe('folder:b');
    });
    it('the Cloud filter shows everything in the snapshot, including what is also local', () => {
      const { result } = renderLibrary();
      act(() => result.current.setSource('cloud'));
      expect(result.current.shown.map((r) => r.id)).toEqual(['folder:a', 'cloud:x2']);
    });
    it('a cloud-only row gets its program once its file has been fetched', () => {
      cloudState.files = new Map([['x2', stage4]]);
      const { result } = renderLibrary();
      expect(result.current.entryById('cloud:x2')?.program).toBeDefined();
    });
    it('without fingerprints yet, nothing merges and nothing is lost', () => {
      fingerprintsMock = new Map();
      const { result } = renderLibrary();
      expect(result.current.rows.map((r) => r.id)).toEqual(['folder:a', 'folder:b', 'cloud:x1', 'cloud:x2']);
    });
    it('a selection made through a member keeps its row when the row starts being shown as another entry', () => {
      fingerprintsMock = new Map();
      const { result, rerender } = renderLibrary();
      expect(result.current.entryById('cloud:x1')?.id).toBe('cloud:x1');
      fingerprintsMock = new Map([['folder:a', 'x1'], ['folder:b', 'x3']]);
      rerender();
      expect(result.current.entryById('cloud:x1')?.id).toBe('folder:a');
    });
  });
});
