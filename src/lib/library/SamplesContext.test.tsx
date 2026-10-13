// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, renderHook } from '@testing-library/react';
import { SamplesProvider, selectedBytes, useSamplesState } from './SamplesContext';
import type { SampleEntry } from './sample-entries';
import type { CloudSnapshotState } from './CloudSnapshotContext';
import { CapabilitiesProvider } from '../capabilities/CapabilitiesContext';
import { readNsmp } from '../ns4/nsmp';

// The provider's own sources, held stable like the real ones between renders.
const device = { session: null, sampleEntries: [], setSampleEntries: () => {}, isCurrent: () => true };
const folder: { result: { samples: unknown[]; backupSamples: unknown[] }; openBundle: () => Promise<never> } = {
  result: { samples: [], backupSamples: [] }, openBundle: async () => { throw new Error('none'); },
};
const imported = { entries: [], add: vi.fn(async () => 'local:1'), remove: async () => {} };
const prefs = { sort: 'default', favorites: new Set<string>(), setSort: () => {}, isFavorite: () => false, toggleFavorite: () => {}, isFavoriteRow: () => false, toggleFavoriteRow: () => {} };
const origins = new Map();
let cloudState: CloudSnapshotState;
let fingerprints: ReadonlyMap<string, string> = new Map();
vi.mock('@/lib/device/DeviceContext', () => ({ useDevice: () => device }));
vi.mock('@/lib/folder/FolderContext', () => ({ useFolder: () => folder }));
vi.mock('@/lib/library/useImportedSamples', () => ({ useImportedSamples: () => imported }));
vi.mock('@/lib/library/prefs', () => ({ useSamplesPrefs: () => prefs }));
vi.mock('./useBackupOrigins', () => ({ useBackupOrigins: () => origins }));
vi.mock('@/lib/library/CloudSnapshotContext', () => ({ useCloudSnapshot: () => cloudState }));
vi.mock('@/lib/library/useFingerprints', () => ({ useFingerprints: () => fingerprints }));

const dev = (id: string, sizeBytes: number): SampleEntry => ({
  id, name: id, source: 'nord', generation: 'unknown' as const,
  device: { bank: 5, slot: 0, name: id, categoryId: 0, version: 0, sizeBytes, fourcc: 'nsmp' } as never,
});

describe('selectedBytes', () => {
  it('sums device sizeBytes for the selected ids only', () => {
    const entries = [dev('a', 1000), dev('b', 2000), dev('c', 500)];
    expect(selectedBytes(entries, new Set(['a', 'c']))).toBe(1500);
  });
  it('is zero when nothing is selected', () => {
    expect(selectedBytes([dev('a', 1000)], new Set())).toBe(0);
  });
});

describe('sample rows', () => {
  const localBytes = new Uint8Array([1, 2, 3]);
  const cloudBytes = new Uint8Array([4, 5]);
  const fetchItem = vi.fn(async (_fingerprint: string) => cloudBytes);
  const renderSamples = () => renderHook(() => useSamplesState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <CapabilitiesProvider value={{ cloud: { available: true, fetchItem } }}><SamplesProvider>{children}</SamplesProvider></CapabilitiesProvider>
    ),
  });
  const read = (e: SampleEntry) => currentState().readSample(e, () => {}, new AbortController().signal);
  let currentState: () => ReturnType<typeof useSamplesState>;
  beforeEach(() => {
    folder.result = { samples: [{ id: 'folder:Flute.nsmp4', name: 'Flute', file: readNsmp(localBytes), bytes: localBytes }], backupSamples: [] };
    cloudState = {
      status: 'ready', files: new Map(), reading: new Set(), failed: new Map(), read: vi.fn(), refresh: vi.fn(),
      items: [{ fingerprint: 's1', kind: 'sample', filename: 'Flute.nsmp4' }, { fingerprint: 's2', kind: 'sample', filename: 'Choir.nsmp4' }],
    };
    fingerprints = new Map([['folder:Flute.nsmp4', 's1']]);
    const { result } = renderSamples();
    currentState = () => result.current;
  });
  afterEach(() => { cleanup(); fetchItem.mockClear(); });

  it('merges a local sample with its cloud copy, lists the cloud-only one, and leaves `all` as the files here', () => {
    const s = currentState();
    expect(s.rows.map((r) => [r.id, r.sources ?? [r.source]])).toEqual([
      ['folder:Flute.nsmp4', ['local', 'cloud']], ['cloud:s2', ['cloud']],
    ]);
    expect(s.all.map((e) => e.id)).toEqual(['folder:Flute.nsmp4']);
    expect(s.entryById('cloud:s1')?.id).toBe('folder:Flute.nsmp4');
  });
  it('reads a cloud-only sample from the cloud, one fetch for two reads at once', async () => {
    const row = currentState().entryById('cloud:s2')!;
    const [a, b] = [read(row), read(row)];
    expect(await a).toBe(cloudBytes);
    expect(await b).toBe(cloudBytes);
    expect(fetchItem).toHaveBeenCalledTimes(1);
    expect(fetchItem).toHaveBeenCalledWith('s2');
  });
  it('reads a merged row from the copy here, never the cloud', async () => {
    expect(await read(currentState().entryById('cloud:s1')!)).toBe(localBytes);
    expect(fetchItem).not.toHaveBeenCalled();
  });
  it('keeps a copy of a cloud sample under its name and type', async () => {
    const row = currentState().entryById('cloud:s2')!;
    await currentState().keepCopy(row, cloudBytes);
    const file = (imported.add.mock.calls as unknown as [File][])[0][0];
    expect(file.name).toBe('Choir.nsmp4');
  });
});
