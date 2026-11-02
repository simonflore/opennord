// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useFolderLibrary } from './useFolderLibrary';
import type { Scanner, BundleDescriptor } from './pipeline';
import type { FolderSource } from './source';
import * as access from './access';
import * as scanCache from './scanCache';

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
  folderFingerprint: vi.fn(async () => 'same'),
}));

const choiceStore: { value: null | { folderName: string; decided: string[]; skipped: string[] } } = { value: null };
vi.mock('./bundlePrefs', () => ({
  loadBundleChoice: vi.fn(async (name: string) => (choiceStore.value?.folderName === name ? choiceStore.value : null)),
  saveBundleChoice: vi.fn(async (c) => { choiceStore.value = c; }),
  clearBundleChoice: vi.fn(async () => { choiceStore.value = null; }),
}));

// The kept last scan (IDB-backed): nothing kept unless a test says so.
vi.mock('./scanCache', () => ({
  loadScanCache: vi.fn(async () => null),
  saveScanCache: vi.fn(async () => {}),
  clearScanCache: vi.fn(async () => {}),
}));

beforeEach(() => {
  choiceStore.value = null;
  vi.mocked(scanCache.loadScanCache).mockReset().mockImplementation(async () => null);
  vi.mocked(scanCache.saveScanCache).mockClear();
  vi.mocked(scanCache.clearScanCache).mockClear();
  vi.mocked(access.folderFingerprint).mockReset().mockImplementation(async () => 'same');
  vi.mocked(access.rescan).mockClear();
});
// Unmount each test's hook, so its window listeners don't answer the next test's focus events.
afterEach(cleanup);

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

  it('a refresh keeps the last scan shown until the new loose pass is in', async () => {
    vi.mocked(access.pickFolder).mockResolvedValueOnce({ name: 'F', handle: {} as FileSystemDirectoryHandle, source: [] as File[] } as never);
    let finish = () => {};
    let scans = 0;
    const scanner: Scanner = {
      async scanLoose(_source, onBatch) {
        const id = scans++ === 0 ? 'folder:old.ns4p' : 'folder:new.ns4p';
        onBatch({ programs: [prog(id)], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
        if (id === 'folder:new.ns4p') await new Promise<void>((res) => { finish = res; });
        return [];
      },
      async expandBundles() {},
    };
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { await result.current.choose(); });
    const ids = () => result.current.result.programs.map((p) => p.id);
    expect(ids()).toEqual(['folder:old.ns4p']);
    let refreshed!: Promise<void>;
    act(() => { refreshed = result.current.refresh(); });
    await waitFor(() => expect(scans).toBe(2));
    expect(ids()).toEqual(['folder:old.ns4p']); // still the last scan, not empty
    await act(async () => { finish(); await refreshed; });
    expect(ids()).toEqual(['folder:new.ns4p']);
  });

  it('a refresh that fails empties the list instead of passing off the last scan as current', async () => {
    vi.mocked(access.pickFolder).mockResolvedValueOnce({ name: 'F', handle: {} as FileSystemDirectoryHandle, source: [] as File[] } as never);
    let scans = 0;
    const scanner: Scanner = {
      async scanLoose(_source, onBatch) {
        if (scans++ > 0) throw new Error('permission revoked');
        onBatch({ programs: [prog('folder:old.ns4p')], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
        return [];
      },
      async expandBundles() {},
    };
    const { result } = renderHook(() => useFolderLibrary(() => scanner));
    await act(async () => { await result.current.choose(); });
    expect(result.current.result.programs).toHaveLength(1);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.result.programs).toHaveLength(0);
    expect(result.current.result.errors).toEqual([{ path: '(folder)', reason: "Couldn't refresh the folder: permission revoked" }]);
    expect(result.current.bundles).toEqual([]);
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

describe('useFolderLibrary rescan when the window comes back', () => {
  // Only Date is faked: the 30 s wait is measured with it, and waitFor keeps real timers.
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); });
  afterEach(() => { vi.useRealTimers(); });

  const later = (ms: number) => vi.setSystemTime(Date.now() + ms);
  const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  const focus = () => act(async () => { window.dispatchEvent(new Event('focus')); });

  /** A restored, readable folder whose scans are counted. */
  async function restoredFolder(name = 'F') {
    let scans = 0;
    const scanner: Scanner = {
      async scanLoose(_source, onBatch) {
        scans++;
        onBatch({ programs: [prog(`folder:scan${scans}.ns4p`)], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
        return [];
      },
      async expandBundles() {},
    };
    const handle = {} as FileSystemDirectoryHandle;
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'granted', name, handle, source: handle as never });
    const makeScanner = () => scanner;
    const hook = renderHook(() => useFolderLibrary(makeScanner));
    await waitFor(() => expect(hook.result.current.folderName).toBe(name));
    await waitFor(() => expect(hook.result.current.busy).toBe(false));
    return { hook, scans: () => scans };
  }

  it('rescans when the folder changed while the window was away', async () => {
    const { hook, scans } = await restoredFolder();
    expect(scans()).toBe(1);
    vi.mocked(access.folderFingerprint).mockImplementation(async () => 'changed');
    later(31_000);
    await focus();
    await waitFor(() => expect(scans()).toBe(2));
    await waitFor(() => expect(hook.result.current.result.programs.map((p) => p.id)).toEqual(['folder:scan2.ns4p']));
  });

  it('also rescans when the page becomes visible again', async () => {
    const { scans } = await restoredFolder();
    vi.mocked(access.folderFingerprint).mockImplementation(async () => 'changed');
    later(31_000);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(scans()).toBe(2));
  });

  it('skips the scan when no Nord file was added, removed or changed', async () => {
    const { scans } = await restoredFolder();
    const listings = vi.mocked(access.folderFingerprint).mock.calls.length;
    later(31_000);
    await focus();
    await settle();
    expect(vi.mocked(access.folderFingerprint).mock.calls.length).toBe(listings + 1); // it did look
    expect(scans()).toBe(1);
  });

  it('looks at most once every 30 seconds, however often the window comes back', async () => {
    const { scans } = await restoredFolder();
    vi.mocked(access.folderFingerprint).mockImplementation(async () => 'changed');
    const listings = () => vi.mocked(access.folderFingerprint).mock.calls.length;
    const before = listings();
    later(5_000);
    await focus();
    await settle();
    expect(listings()).toBe(before); // too soon after the launch scan
    expect(scans()).toBe(1);
    later(26_000);
    await focus();
    await waitFor(() => expect(scans()).toBe(2));
    later(10_000);
    await focus();
    await settle();
    expect(scans()).toBe(2); // too soon after the last look
  });

  it('does nothing while the folder waits for permission, or while a scan is running', async () => {
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'needs-permission', name: 'P', handle: {} as FileSystemDirectoryHandle });
    const waiting = renderHook(() => useFolderLibrary(() => fakeScanner([])));
    await waitFor(() => expect(waiting.result.current.needsReconnect).toBe(true));
    later(31_000);
    await focus();
    await settle();
    expect(access.folderFingerprint).not.toHaveBeenCalled();
    waiting.unmount();

    const scanner: Scanner = { scanLoose: () => new Promise(() => {}), expandBundles: async () => {} };
    const handle = {} as FileSystemDirectoryHandle;
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'granted', name: 'S', handle, source: handle as never });
    const makeScanner = () => scanner;
    const scanning = renderHook(() => useFolderLibrary(makeScanner));
    await waitFor(() => expect(scanning.result.current.busy).toBe(true));
    const listings = vi.mocked(access.folderFingerprint).mock.calls.length;
    later(31_000);
    await focus();
    await settle();
    expect(vi.mocked(access.folderFingerprint).mock.calls.length).toBe(listings);
    expect(access.rescan).not.toHaveBeenCalled();
  });

  it('a look still in progress when another folder is chosen does not rescan the old one', async () => {
    const { hook, scans } = await restoredFolder('Old');
    let finishListing!: (fp: string) => void;
    vi.mocked(access.folderFingerprint).mockImplementationOnce(() => new Promise((res) => { finishListing = res; }));
    later(31_000);
    await focus();
    await waitFor(() => expect(finishListing).toBeTypeOf('function'));

    await act(async () => { await hook.result.current.choose(); }); // the default mocked pick, 'F'
    expect(hook.result.current.folderName).toBe('F');
    expect(scans()).toBe(2);

    await act(async () => { finishListing('changed'); });
    await settle();
    expect(access.rescan).not.toHaveBeenCalled();
    expect(scans()).toBe(2);
    expect(hook.result.current.folderName).toBe('F');
  });
});

describe('useFolderLibrary last scan kept for launch', () => {
  const batch = (id: string) => ({ programs: [prog(id)], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] });
  const kept = (id: string) => ({ result: { ...batch(id) }, bundles: [{ path: 'Kept.ns4b', size: 1 }] });
  const ids = (r: { current: ReturnType<typeof useFolderLibrary> }) => r.current.result.programs.map((p) => p.id);

  it('shows the last scan at launch, then the new one once it has finished', async () => {
    let finish = () => {};
    const scanner: Scanner = {
      async scanLoose(_source, onBatch) {
        onBatch(batch('folder:fresh.ns4p'));
        await new Promise<void>((res) => { finish = res; });
        return [];
      },
      async expandBundles() {},
    };
    const handle = {} as FileSystemDirectoryHandle;
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'granted', name: 'F', handle, source: handle as never });
    vi.mocked(scanCache.loadScanCache).mockResolvedValueOnce(kept('folder:kept.ns4p') as never);
    const makeScanner = () => scanner;
    const { result } = renderHook(() => useFolderLibrary(makeScanner));

    await waitFor(() => expect(ids(result)).toEqual(['folder:kept.ns4p']));
    expect(scanCache.loadScanCache).toHaveBeenCalledWith('F', handle); // asked for this folder only
    expect(result.current.bundles.map((b) => b.path)).toEqual(['Kept.ns4b']);
    expect(result.current.busy).toBe(true);
    await waitFor(() => expect(finish).not.toBe(undefined));
    expect(ids(result)).toEqual(['folder:kept.ns4p']); // not emptied while the scan runs

    await act(async () => { finish(); });
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(ids(result)).toEqual(['folder:fresh.ns4p']);
    expect(result.current.bundles).toEqual([]);
  });

  it('keeps a finished scan of a linked folder for next launch', async () => {
    const handle = {} as FileSystemDirectoryHandle;
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'granted', name: 'F', handle, source: handle as never });
    const scanner = fakeScanner([{ path: 'B.ns4b', size: 10 }]); // one new backup: auto-loaded
    const makeScanner = () => scanner;
    const { result } = renderHook(() => useFolderLibrary(makeScanner));
    await waitFor(() => expect(result.current.busy).toBe(false));
    await waitFor(() => expect(scanCache.saveScanCache).toHaveBeenCalled());
    const [name, savedHandle, saved, bundles] = vi.mocked(scanCache.saveScanCache).mock.lastCall!;
    expect(name).toBe('F');
    expect(savedHandle).toBe(handle);
    expect(saved.programs.map((p) => p.id)).toEqual(['folder:loose.ns4p', 'folder:B.ns4b!x.ns4p']);
    expect(bundles).toEqual([{ path: 'B.ns4b', size: 10 }]);
  });

  it('keeps nothing for a folder picked without a lasting link', async () => {
    const { result } = renderHook(() => useFolderLibrary(() => fakeScanner([])));
    await act(async () => { await result.current.choose(); }); // the default mocked pick has no handle
    expect(ids(result)).toEqual(['folder:loose.ns4p']);
    expect(scanCache.saveScanCache).not.toHaveBeenCalled();
  });

  it('shows the last scan while the folder waits for permission, and keeps it up while reconnecting', async () => {
    const handle = {} as FileSystemDirectoryHandle;
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'needs-permission', name: 'P', handle });
    vi.mocked(scanCache.loadScanCache).mockResolvedValueOnce(kept('folder:kept.ns4p') as never);
    let finish = () => {};
    const scanner: Scanner = {
      async scanLoose(_source, onBatch) {
        onBatch(batch('folder:fresh.ns4p'));
        await new Promise<void>((res) => { finish = res; });
        return [];
      },
      async expandBundles() {},
    };
    const makeScanner = () => scanner;
    const { result } = renderHook(() => useFolderLibrary(makeScanner));
    await waitFor(() => expect(ids(result)).toEqual(['folder:kept.ns4p']));
    expect(result.current.needsReconnect).toBe(true);

    vi.mocked(access.grantAndScan).mockResolvedValueOnce(handle as never);
    let reconnected!: Promise<void>;
    act(() => { reconnected = result.current.reconnect(); });
    await waitFor(() => expect(result.current.needsReconnect).toBe(false));
    expect(ids(result)).toEqual(['folder:kept.ns4p']);
    await act(async () => { finish(); await reconnected; });
    expect(ids(result)).toEqual(['folder:fresh.ns4p']);
  });

  it('a kept scan arriving after a fresh pick is not shown', async () => {
    let giveCache!: (v: unknown) => void;
    vi.mocked(scanCache.loadScanCache).mockImplementationOnce(() => new Promise((res) => { giveCache = res as never; }));
    const handle = {} as FileSystemDirectoryHandle;
    vi.mocked(access.restoreFolder).mockResolvedValueOnce({ status: 'needs-permission', name: 'Old', handle });
    const { result } = renderHook(() => useFolderLibrary(() => fakeScanner([])));
    await waitFor(() => expect(giveCache).toBeTypeOf('function'));
    await act(async () => { await result.current.choose(); });
    await act(async () => { giveCache(kept('folder:kept.ns4p')); });
    expect(ids(result)).toEqual(['folder:loose.ns4p']);
  });

  it('Forget drops the kept scan', async () => {
    const { result } = renderHook(() => useFolderLibrary(() => fakeScanner([])));
    await act(async () => { await result.current.forget(); });
    expect(scanCache.clearScanCache).toHaveBeenCalled();
  });
});
