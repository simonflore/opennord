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
});
