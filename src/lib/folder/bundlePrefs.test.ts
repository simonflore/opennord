import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { loadBundleChoice, saveBundleChoice, clearBundleChoice } from './bundlePrefs';

describe('bundlePrefs', () => {
  beforeEach(async () => { await clearBundleChoice(); });

  it('returns null when nothing is stored', async () => {
    expect(await loadBundleChoice('My Folder')).toBeNull();
  });

  it('round-trips a choice for the same folder', async () => {
    await saveBundleChoice({ folderName: 'My Folder', decided: ['A.ns4b'], skipped: ['B.ns4b'] });
    expect(await loadBundleChoice('My Folder')).toEqual({ folderName: 'My Folder', decided: ['A.ns4b'], skipped: ['B.ns4b'] });
  });

  it('returns null when the stored choice is for a different folder', async () => {
    await saveBundleChoice({ folderName: 'Old', decided: ['A.ns4b'], skipped: [] });
    expect(await loadBundleChoice('New')).toBeNull();
  });

  it('clear removes the stored choice', async () => {
    await saveBundleChoice({ folderName: 'My Folder', decided: ['A.ns4b'], skipped: [] });
    await clearBundleChoice();
    expect(await loadBundleChoice('My Folder')).toBeNull();
  });

  // FSA-handle identity: a display name alone can't tell two folders apart.
  // The stored side must be structured-clonable (like a real persisted handle);
  // identity is asked of the LIVE handle via isSameEntry(stored).
  const storedHandle = (id: string) => ({ id }) as unknown as FileSystemDirectoryHandle;
  const liveHandle = (id: string) =>
    ({ id, isSameEntry: async (other: unknown) => (other as { id?: string }).id === id }) as unknown as FileSystemDirectoryHandle;

  it('returns null for a same-named but different directory (handle mismatch)', async () => {
    // Relinking a different folder that happens to be named "Nord" must not
    // inherit the old folder's skip decisions — that silently hides a backup
    // the user never saw.
    await saveBundleChoice({ folderName: 'Nord', handle: storedHandle('machine-1'), decided: [], skipped: ['TBM.ns4b'] });
    expect(await loadBundleChoice('Nord', liveHandle('machine-2'))).toBeNull();
  });

  it('matches when the handle is the same directory', async () => {
    await saveBundleChoice({ folderName: 'Nord', handle: storedHandle('machine-1'), decided: ['A.ns4b'], skipped: [] });
    const rec = await loadBundleChoice('Nord', liveHandle('machine-1'));
    expect(rec?.decided).toEqual(['A.ns4b']);
  });

  it('falls back to name matching when either side has no handle (File[] sources)', async () => {
    await saveBundleChoice({ folderName: 'Nord', decided: ['A.ns4b'], skipped: [] });
    expect((await loadBundleChoice('Nord', liveHandle('machine-1')))?.decided).toEqual(['A.ns4b']);
  });
});
