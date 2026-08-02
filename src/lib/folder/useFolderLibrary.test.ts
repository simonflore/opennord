// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFolderLibrary } from './useFolderLibrary';
import type { Scanner, BundleDescriptor } from './pipeline';
import type { FolderSource } from './source';
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

  it('preserves previously loaded programs when a re-pick fails (the Android empty-selection case)', async () => {
    const scanner = fakeScanner([]);
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { await result.current.choose(); });
    await waitFor(() => expect(result.current.result.programs.map((p) => p.id)).toContain('folder:loose.ns4p'));

    vi.mocked(access.pickFolder).mockRejectedValueOnce(
      new Error("That folder didn't return any files this browser could read."),
    );
    await act(async () => { await result.current.choose(); });

    // The old data must survive a failed re-pick — a fallback (File[])
    // folder has no persisted handle to recover it from otherwise.
    expect(result.current.result.programs.map((p) => p.id)).toContain('folder:loose.ns4p');
    expect(result.current.result.errors.some((e) => e.path === '(folder)')).toBe(true);
  });

  it('a failed re-pick does not discard a concurrent bundle expansion still in flight', async () => {
    // The exact race: applyBundleSelection() is expanding a chosen backup
    // (already persisted as "decided", newBundles already cleared) when the
    // user hits Re-pick. If the re-pick fails or is cancelled, the still-open
    // expansion's remaining programs must still land — they're not
    // recoverable otherwise for a fallback (File[]) folder.
    let resolveExpand!: () => void;
    const scanner: Scanner = {
      async scanLoose(_source, onBatch) {
        onBatch({ programs: [], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
        return [{ path: 'A.ns4b', size: 1 }, { path: 'B.ns4b', size: 2 }];
      },
      expandBundles: (paths, onBatch) => new Promise((res) => {
        resolveExpand = () => {
          for (const p of paths) onBatch({ programs: [prog(`folder:${p}!x.ns4p`)], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
          res();
        };
      }),
    };
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { await result.current.choose(); });
    await waitFor(() => expect(result.current.pickerOpen).toBe(true)); // 2 bundles → picker

    // Kick off the expansion but don't await it — it stays open until resolveExpand().
    act(() => { void result.current.applyBundleSelection(['A.ns4b']); });
    await waitFor(() => expect(result.current.pickerOpen).toBe(false));

    // Re-pick fails while the expansion above is still pending.
    vi.mocked(access.pickFolder).mockRejectedValueOnce(
      new Error("That folder didn't return any files this browser could read."),
    );
    await act(async () => { await result.current.choose(); });

    // The expansion finally settles — its program must still be appended,
    // not silently dropped by the failed re-pick attempt.
    await act(async () => { resolveExpand(); });
    expect(result.current.result.programs.map((p) => p.id)).toContain('folder:A.ns4b!x.ns4p');
  });

  it('forget() clears busy even if the in-flight scan never resolves', async () => {
    const scanner: Scanner = { scanLoose: () => new Promise(() => {}), expandBundles: async () => {} };
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { void result.current.choose(); });
    await waitFor(() => expect(result.current.busy).toBe(true));
    await act(async () => { await result.current.forget(); });
    expect(result.current.busy).toBe(false);
  });

  it('a stale reconnect resolving after Forget + a fresh pick does not overwrite the newer folder', async () => {
    // The exact race: Reconnect's permission prompt (grantAndScan) is still
    // open when the user hits Forget, then picks a different folder. The old
    // prompt finally resolving must not re-scan and stomp the new folder's
    // results with the old (stale) scanner's output. reconnect() never sets
    // folderName itself (only the mount effect's "needs-permission" branch
    // does), so the observable symptom is in `result`/the active scanner —
    // not folderName, which is why this checks the scan output.
    let resolveGrant!: (v: FolderSource | null) => void;
    vi.mocked(access.grantAndScan).mockImplementationOnce(
      () => new Promise((res) => { resolveGrant = res; }),
    );
    const oldHandle = {} as FileSystemDirectoryHandle;
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'needs-permission', name: 'Old', handle: oldHandle });

    const scannerNew = fakeScanner([]); // what the fresh pick after Forget should use
    const scannerStale: Scanner = {
      async scanLoose(_source, onBatch) {
        onBatch({ programs: [prog('folder:STALE.ns4p')], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
        return [];
      },
      expandBundles: async () => {},
    };
    let calls = 0;
    const makeScanner = () => (calls++ === 0 ? scannerNew : scannerStale);

    const { result } = renderHook(() => useFolderLibrary(makeScanner));
    await waitFor(() => expect(result.current.needsReconnect).toBe(true));

    act(() => { void result.current.reconnect(); }); // grantAndScan() left pending
    await waitFor(() => expect(result.current.busy).toBe(true));

    await act(async () => { await result.current.forget(); });
    expect(result.current.folderName).toBeNull();

    await act(async () => { await result.current.choose(); }); // picks the default mocked 'F', uses scannerNew
    expect(result.current.folderName).toBe('F');
    expect(result.current.result.programs.map((p) => p.id)).toContain('folder:loose.ns4p');

    // The stale permission prompt finally resolves (granted) for the OLD,
    // already-forgotten handle.
    await act(async () => { resolveGrant(oldHandle); });
    expect(result.current.folderName).toBe('F');
    expect(result.current.result.programs.map((p) => p.id)).toContain('folder:loose.ns4p');
    expect(result.current.result.programs.map((p) => p.id)).not.toContain('folder:STALE.ns4p');
  });
});

describe('useFolderLibrary mount-time restore', () => {
  it('marks busy for the duration of the restored folder\'s initial scan', async () => {
    // Without this, a restored folder reads as "connected, found nothing"
    // while a slow/large initial scan is still filling in results.
    let resolveScan!: () => void;
    const scanner: Scanner = {
      scanLoose: () => new Promise((res) => { resolveScan = () => res([]); }),
      expandBundles: async () => {},
    };
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({
      status: 'granted', name: 'Restored', handle: {} as FileSystemDirectoryHandle, source: [] as File[],
    });
    // A stable factory, as real callers pass (the default is the module-level
    // `createScanner`) — an inline `() => scanner` is recreated every render,
    // which would give `runScan` a new identity on the state updates below and
    // restart this mount effect mid-scan.
    const makeScanner = () => scanner;
    const { result } = renderHook(() => useFolderLibrary(makeScanner));
    await waitFor(() => expect(result.current.folderName).toBe('Restored'));
    expect(result.current.busy).toBe(true); // scan still in flight
    await act(async () => { resolveScan(); });
    await waitFor(() => expect(result.current.busy).toBe(false));
  });

  it('an abandoned restored scan settling late does not clear a newer operation\'s busy state', async () => {
    // The exact race: forget() mid-restore-scan, then immediately choose()
    // again. If the abandoned restore scan later resolves, it must not
    // clobber the new operation's busy=true (Choose/Re-pick staying enabled
    // mid-scan, or the "connected but empty" message flashing prematurely).
    let resolveOld!: () => void;
    let resolveNew!: () => void;
    const oldScanner: Scanner = {
      scanLoose: () => new Promise((res) => { resolveOld = () => res([]); }),
      expandBundles: async () => {},
    };
    const newScanner: Scanner = {
      scanLoose: () => new Promise((res) => { resolveNew = () => res([]); }),
      expandBundles: async () => {},
    };
    let calls = 0;
    const makeScanner = () => (calls++ === 0 ? oldScanner : newScanner);

    vi.mocked(access.restoreFolder).mockResolvedValueOnce({
      status: 'granted', name: 'Restored', handle: {} as FileSystemDirectoryHandle, source: [] as File[],
    });
    const { result } = renderHook(() => useFolderLibrary(makeScanner));
    await waitFor(() => expect(result.current.busy).toBe(true)); // old restore scan in flight

    await act(async () => { await result.current.forget(); });
    expect(result.current.busy).toBe(false);

    await act(async () => { void result.current.choose(); });
    await waitFor(() => expect(result.current.busy).toBe(true)); // new operation now owns busy

    // The abandoned old scan finally settles — give its continuation (the
    // stale gen check, then the mount effect's finally) time to run.
    await act(async () => {
      resolveOld();
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(result.current.busy).toBe(true); // must still be owned by the new operation

    await act(async () => { resolveNew(); });
    await waitFor(() => expect(result.current.busy).toBe(false));
  });

  it('surfaces a failed restore instead of an unhandled rejection', async () => {
    // A saved directory handle can go stale (folder deleted/renamed outside the
    // browser) — the user must see why their linked folder vanished, not a
    // silent empty state.
    vi.mocked(access.restoreFolder).mockRejectedValueOnce(new Error('stale handle'));
    const scanner = fakeScanner([]);
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await waitFor(() => expect(result.current.reconnectError).toBe('stale handle'));
    expect(result.current.folderName).toBeNull();
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

  it('openBundle delegates to scanner.openBundle when no FSA handle is present (File[] source)', async () => {
    const fakeFile = new File([new Uint8Array([9, 8, 7])], 'TBM.ns4b');
    // pickFolder returns a File[] source (no handle) — simulates webkitdirectory
    vi.mocked(access.pickFolder).mockResolvedValueOnce({ name: 'F', handle: undefined, source: [] as File[] });

    const scannerWithOpenBundle = {
      ...fakeScanner([]),
      openBundle: vi.fn(async (_path: string) => fakeFile),
    };

    const { result } = renderHook(() => useFolderLibrary(() => scannerWithOpenBundle));
    await act(async () => { await result.current.choose(); });
    await waitFor(() => expect(result.current.folderName).toBe('F'));

    let file!: File;
    await act(async () => { file = await result.current.openBundle('TBM.ns4b'); });

    expect(scannerWithOpenBundle.openBundle).toHaveBeenCalledWith('TBM.ns4b');
    expect(file.name).toBe('TBM.ns4b');
    expect(file.size).toBe(3);
  });
});
