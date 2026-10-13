// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { PianosProvider, selectedPianoBytes, usePianosState } from './PianosContext';
import type { PianoEntry } from './piano-entries';
import type { ProgramEntry } from '../device/transfer';

// The provider's own sources, as each test sets them.
let device: { session: null; pianoEntries: ProgramEntry[]; setPianoEntries: () => void; isCurrent: () => boolean };
let folder: { result: { pianos: { id: string; name: string; bytes: Uint8Array }[]; backupPianos: [] } };
let fingerprints: ReadonlyMap<string, string> = new Map();
const prefs = { sort: 'default', favorites: new Set<string>(), setSort: () => {}, isFavorite: () => false, toggleFavorite: () => {}, isFavoriteRow: () => false, toggleFavoriteRow: () => {} };
vi.mock('@/lib/device/DeviceContext', () => ({ useDevice: () => device }));
vi.mock('@/lib/folder/FolderContext', () => ({ useFolder: () => folder }));
vi.mock('@/lib/library/prefs', () => ({ usePianosPrefs: () => prefs }));
vi.mock('@/lib/library/useFingerprints', () => ({ useFingerprints: () => fingerprints }));
afterEach(cleanup);

const dev = (id: string, sizeBytes: number): PianoEntry => ({
  id, name: id, source: 'nord', factory: null,
  device: { bank: 0, slot: 0, name: id, categoryId: 0, version: 0, sizeBytes, fourcc: 'npno' } as never,
});

describe('selectedPianoBytes', () => {
  it('sums device sizeBytes for the selected ids only', () => {
    expect(selectedPianoBytes([dev('a', 5_000_000), dev('b', 9_000_000)], new Set(['a']))).toBe(5_000_000);
  });
  it('is zero when nothing is selected', () => {
    expect(selectedPianoBytes([dev('a', 1)], new Set())).toBe(0);
  });
});

describe('piano rows', () => {
  // Two folder pianos with identical bytes, one distinct.
  const renderPianos = ({ nord = [] as string[] } = {}) => {
    device = {
      session: null, setPianoEntries: () => {}, isCurrent: () => true,
      pianoEntries: nord.map((name, slot) => ({ bank: 0, slot, name, categoryId: 0, version: 0, sizeBytes: 0, fourcc: 'npno' })),
    };
    folder = { result: { backupPianos: [], pianos: [
      { id: 'folder:Mine.npno', name: 'Mine', bytes: new Uint8Array([1]) },
      { id: 'folder:Mine copy.npno', name: 'Mine copy', bytes: new Uint8Array([1]) },
      { id: 'folder:Other.npno', name: 'Other', bytes: new Uint8Array([2]) },
    ] } };
    fingerprints = new Map([['folder:Mine.npno', 'k1'], ['folder:Mine copy.npno', 'k1'], ['folder:Other.npno', 'k2']]);
    return renderHook(() => usePianosState(), { wrapper: PianosProvider });
  };
  it('lists the same piano file found twice in the folder as one row', () => {
    const { result } = renderPianos();
    expect(result.current.rows.map((r) => r.id)).toEqual(['folder:Mine.npno', 'folder:Other.npno']);
    expect(result.current.rows[0].members!.map((m) => m.name)).toEqual(['Mine', 'Mine copy']);
    expect(result.current.all).toHaveLength(3);
    expect(result.current.entryById('folder:Mine copy.npno')?.id).toBe('folder:Mine.npno');
  });
  it('hints a folder piano that a piano on the Nord has its name', () => {
    const { result } = renderPianos({ nord: ['Mine'] });
    expect(result.current.rows.find((r) => r.id === 'folder:Mine.npno')!.sameNameOnNord).toBe('A:11');
    expect(result.current.rows.some((r) => r.source === 'nord' && r.sources === undefined)).toBe(true);
    expect(result.current.rows.find((r) => r.id === 'folder:Other.npno')!.sameNameOnNord).toBeUndefined();
  });
});
