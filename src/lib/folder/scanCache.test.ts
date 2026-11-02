import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { loadScanCache, saveScanCache, clearScanCache } from './scanCache';
import type { ScanResult } from './scan';

// As in bundlePrefs.test.ts: the stored handle must be structured-clonable, and
// identity is asked of the LIVE handle via isSameEntry(stored).
const storedHandle = (id: string) => ({ id }) as unknown as FileSystemDirectoryHandle;
const liveHandle = (id: string) =>
  ({ id, isSameEntry: async (other: unknown) => (other as { id?: string }).id === id }) as unknown as FileSystemDirectoryHandle;

function scan(): ScanResult {
  return {
    programs: [{ id: 'folder:a.ns4p', name: 'a', path: 'a.ns4p', program: { name: 'a' } as never, bytes: new Uint8Array([1, 2]) }],
    presets: [{ id: 'folder:p.ns4o', name: 'p', path: 'p.ns4o', tag: 'ns4o', kind: 'organ' as never, bytes: new Uint8Array([3]) }],
    pianos: [{ id: 'folder:Grand.npno', name: 'Grand', bytes: new Uint8Array(1000) }],
    samples: [{ id: 'folder:s.nsmp4', name: 's', path: 's.nsmp4', file: {} as never, bytes: new Uint8Array(1000) }],
    errors: [{ path: 'bad.ns4p', reason: 'broken' }],
    backupPianos: [{ name: 'Grand' } as never],
    backupSamples: [],
  };
}

describe('scanCache', () => {
  beforeEach(async () => { await clearScanCache(); });

  it('keeps programs, presets, errors and backup listings, but no piano or sample files', async () => {
    await saveScanCache('Nord', storedHandle('m1'), scan(), [{ path: 'B.ns4b', size: 9 }]);
    const cached = await loadScanCache('Nord', liveHandle('m1'));
    expect(cached?.result.programs.map((p) => p.id)).toEqual(['folder:a.ns4p']);
    expect([...cached!.result.programs[0].bytes]).toEqual([1, 2]);
    expect(cached?.result.presets.map((p) => p.id)).toEqual(['folder:p.ns4o']);
    expect(cached?.result.errors).toEqual([{ path: 'bad.ns4p', reason: 'broken' }]);
    expect(cached?.result.backupPianos).toEqual([{ name: 'Grand' }]);
    expect(cached?.result.pianos).toEqual([]);
    expect(cached?.result.samples).toEqual([]);
    expect(cached?.bundles).toEqual([{ path: 'B.ns4b', size: 9 }]);
  });

  it('keeps only the bytes of a program, not a larger file it was cut from', async () => {
    const r = scan();
    r.programs[0].bytes = new Uint8Array(10_000).subarray(0, 2);
    await saveScanCache('Nord', storedHandle('m1'), r, []);
    const cached = await loadScanCache('Nord', liveHandle('m1'));
    expect(cached!.result.programs[0].bytes.buffer.byteLength).toBe(2);
  });

  it('never hands a kept scan to a different folder, even one with the same name', async () => {
    await saveScanCache('Nord', storedHandle('m1'), scan(), []);
    expect(await loadScanCache('Nord', liveHandle('m2'))).toBeNull();
    expect(await loadScanCache('Other', liveHandle('m1'))).toBeNull();
  });

  it('is gone after clearing', async () => {
    await saveScanCache('Nord', storedHandle('m1'), scan(), []);
    await clearScanCache();
    expect(await loadScanCache('Nord', liveHandle('m1'))).toBeNull();
  });
});
