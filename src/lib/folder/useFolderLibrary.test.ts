// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFolderLibrary } from './useFolderLibrary';
import type { Scanner, BundleDescriptor } from './pipeline';
import * as access from './access';

// A fake program-bearing batch (id is what the hook surfaces).
function prog(id: string) {
  return { id, name: id, path: id, program: { parsed: true } as never, bytes: new Uint8Array() };
}

// scanLoose emits one loose program + N bundles; expandBundles emits one program per chosen bundle.
function fakeScanner(bundles: BundleDescriptor[]): Scanner {
  return {
    async scanLoose(_source, onBatch) {
      onBatch({ programs: [prog('folder:loose.ns4p')], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
      return bundles;
    },
    async expandBundles(paths, onBatch) {
      for (const p of paths) onBatch({ programs: [prog(`folder:${p}!x.ns4p`)], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
    },
  };
}

// Mock the access layer (choose() resolves a fixed source) and the IDB-backed prefs.
vi.mock('./access', () => ({
  supportsPersistentFolders: () => true,
  pickFolder: vi.fn(async () => ({ name: 'F', handle: undefined, source: [] as File[] })),
  restoreFolder: vi.fn(async () => ({ status: 'none' })),
  grantAndScan: vi.fn(),
  rescan: vi.fn(),
  forgetFolder: vi.fn(async () => {}),
  fileFromHandle: vi.fn(),
}));

const choiceStore: { value: null | { folderName: string; decided: string[]; skipped: string[] } } = { value: null };
vi.mock('./bundlePrefs', () => ({
  loadBundleChoice: vi.fn(async (name: string) => (choiceStore.value?.folderName === name ? choiceStore.value : null)),
  saveBundleChoice: vi.fn(async (c) => { choiceStore.value = c; }),
  clearBundleChoice: vi.fn(async () => { choiceStore.value = null; }),
}));

beforeEach(() => { choiceStore.value = null; });

describe('useFolderLibrary gate', () => {
  it('loose programs appear immediately; a single new bundle auto-expands', async () => {
    const scanner = fakeScanner([{ path: 'B.ns4b', size: 10 }]);
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { await result.current.choose(); });
    await waitFor(() => {
      const ids = result.current.result.programs.map((p) => p.id);
      expect(ids).toContain('folder:loose.ns4p');
      expect(ids).toContain('folder:B.ns4b!x.ns4p'); // auto-expanded
    });
    expect(result.current.pickerOpen).toBe(false);
  });

  it('opens the picker (does not auto-expand) when >=2 new bundles are found', async () => {
    const scanner = fakeScanner([{ path: 'A.ns4b', size: 1 }, { path: 'B.ns4b', size: 2 }]);
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { await result.current.choose(); });
    await waitFor(() => expect(result.current.pickerOpen).toBe(true));
    expect(result.current.result.programs.map((p) => p.id)).toEqual(['folder:loose.ns4p']);
    expect(result.current.newBundles.map((b) => b.path)).toEqual(['A.ns4b', 'B.ns4b']);
  });

  it('applyBundleSelection expands chosen, persists, and closes the picker', async () => {
    const scanner = fakeScanner([{ path: 'A.ns4b', size: 1 }, { path: 'B.ns4b', size: 2 }]);
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { await result.current.choose(); });
    await waitFor(() => expect(result.current.pickerOpen).toBe(true));
    await act(async () => { await result.current.applyBundleSelection(['A.ns4b']); });
    expect(result.current.pickerOpen).toBe(false);
    const ids = result.current.result.programs.map((p) => p.id);
    expect(ids).toContain('folder:A.ns4b!x.ns4p');
    expect(ids).not.toContain('folder:B.ns4b!x.ns4p');
  });
});

describe('useFolderLibrary openBundle', () => {
  it('openBundle resolves a discovered .ns4b to a File via the folder handle', async () => {
    // Arrange: a fake handle and a fake File returned by fileFromHandle.
    const fakeHandle = {} as FileSystemDirectoryHandle;
    const fakeFile = new File([new Uint8Array([1, 2, 3])], 'TBM.ns4b');

    // Configure restoreFolder to return a granted state with the fake handle.
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({
      status: 'granted',
      name: 'MyFolder',
      handle: fakeHandle,
      source: fakeHandle as never,
    });
    // Configure fileFromHandle to return the fake File.
    vi.mocked(access.fileFromHandle).mockResolvedValueOnce(fakeFile);

    const scanner = fakeScanner([]);
    const { result } = renderHook(() => useFolderLibrary(() => scanner));

    // Wait for the restored folder to be connected (folderName set).
    await waitFor(() => expect(result.current.folderName).toBe('MyFolder'));

    // Act: open the bundle.
    let file!: File;
    await act(async () => { file = await result.current.openBundle('TBM.ns4b'); });

    // Assert: fileFromHandle was called with the handle + path, and we got the right File back.
    expect(access.fileFromHandle).toHaveBeenCalledWith(fakeHandle, 'TBM.ns4b');
    expect(file.name).toBe('TBM.ns4b');
    expect(file.size).toBe(3);
  });

  it('openBundle throws when no folder is connected', async () => {
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'none' });
    const scanner = fakeScanner([]);
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await waitFor(() => expect(result.current.folderName).toBeNull());

    await expect(result.current.openBundle('TBM.ns4b')).rejects.toThrow('No folder is connected.');
  });
});
