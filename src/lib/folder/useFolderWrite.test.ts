// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks (before importing the hook) ---
vi.mock('./FolderContext', () => ({ useFolder: vi.fn() }));
vi.mock('../library/writeBackPrefs', () => ({ useWriteBackPref: vi.fn() }));

import { useFolderWrite } from './useFolderWrite';
import { useFolder } from './FolderContext';
import { useWriteBackPref } from '../library/writeBackPrefs';

// Helpers to build mock shapes.
function mockFolder(overrides: Record<string, unknown> = {}) {
  return {
    folderName: null as string | null,
    writeBack: vi.fn().mockResolvedValue({ target: 'download' }),
    bundles: [], newBundles: [], pickerOpen: false,
    needsReconnect: false, reconnectError: null, busy: false, canPersist: false,
    result: { programs: [], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] },
    choose: async () => {}, reconnect: async () => {}, refresh: async () => {},
    forget: async () => {}, openBundlePicker: () => {}, closeBundlePicker: () => {},
    applyBundleSelection: async () => {}, openBundle: async () => { throw new Error('no'); },
    ...overrides,
  };
}

function mockPref(mode: 'ask' | 'new' | 'overwrite' = 'ask') {
  return { mode, setMode: vi.fn() };
}

const makeJob = () => ({
  name: 'test-file.nsmp',
  existing: false,
  write: vi.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useFolderWrite — no folder linked', () => {
  it('calls onFallback and never calls writeBack when folderName is null', async () => {
    const folder = mockFolder({ folderName: null });
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(folder);
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue(mockPref('new'));

    const onSaved = vi.fn();
    const onFallback = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useFolderWrite({ onSaved, onFallback }));

    await act(async () => { await result.current.save(makeJob()); });

    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(folder.writeBack).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe('useFolderWrite — folder linked, pref "new"', () => {
  it('calls writeBack and onSaved with path and folderName on target=folder', async () => {
    const writeBack = vi.fn().mockResolvedValue({ target: 'folder', path: 'test-file.nsmp' });
    const folder = mockFolder({ folderName: 'MyNord', writeBack });
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(folder);
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue(mockPref('new'));

    const onSaved = vi.fn();
    const onFallback = vi.fn();

    const { result } = renderHook(() => useFolderWrite({ onSaved, onFallback }));

    await act(async () => { await result.current.save(makeJob()); });

    expect(writeBack).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith('test-file.nsmp', 'MyNord');
    expect(onFallback).not.toHaveBeenCalled();
  });
});

describe('useFolderWrite — folder linked, pref "ask"', () => {
  it('sets dialogProps on save, then calls pref.setMode + writeBack + onSaved on choose', async () => {
    const writeBack = vi.fn().mockResolvedValue({ target: 'folder', path: 'test-file.nsmp' });
    const setMode = vi.fn();
    const folder = mockFolder({ folderName: 'MyNord', writeBack });
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(folder);
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue({ mode: 'ask', setMode });

    const onSaved = vi.fn();
    const onFallback = vi.fn();

    const { result } = renderHook(() => useFolderWrite({ onSaved, onFallback }));

    // save() with ask pref → dialogProps should become non-null
    await act(async () => { await result.current.save(makeJob()); });

    expect(result.current.dialogProps).not.toBeNull();
    expect(writeBack).not.toHaveBeenCalled();

    // choose('overwrite', true) → remembers mode, then runs writeBack
    await act(async () => { await result.current.dialogProps!.onChoose('overwrite', true); });

    expect(setMode).toHaveBeenCalledWith('overwrite');
    expect(writeBack).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith('test-file.nsmp', 'MyNord');
    expect(result.current.dialogProps).toBeNull();
  });
});

describe('useFolderWrite — write failure', () => {
  it('surfaces a writeBack failure as error instead of an unhandled rejection', async () => {
    // A revoked permission or disk error mid-stream must not vanish: the user
    // would believe a backup exists that doesn't.
    const writeBack = vi.fn().mockRejectedValue(new Error('disk full'));
    const folder = mockFolder({ folderName: 'MyNord', writeBack });
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(folder);
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue(mockPref('overwrite'));

    const onSaved = vi.fn();
    const onFallback = vi.fn();
    const { result } = renderHook(() => useFolderWrite({ onSaved, onFallback }));

    await act(async () => { await result.current.save(makeJob()); });

    expect(result.current.error).toBe('disk full');
    expect(result.current.saving).toBe(false);
    expect(onSaved).not.toHaveBeenCalled();
    expect(onFallback).not.toHaveBeenCalled();
  });

  it('clears the error when the next save starts', async () => {
    const writeBack = vi.fn()
      .mockRejectedValueOnce(new Error('disk full'))
      .mockResolvedValueOnce({ target: 'folder', path: 'test-file.nsmp' });
    const folder = mockFolder({ folderName: 'MyNord', writeBack });
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(folder);
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue(mockPref('overwrite'));

    const onSaved = vi.fn();
    const { result } = renderHook(() => useFolderWrite({ onSaved, onFallback: vi.fn() }));

    await act(async () => { await result.current.save(makeJob()); });
    expect(result.current.error).toBe('disk full');

    await act(async () => { await result.current.save(makeJob()); });
    expect(result.current.error).toBeNull();
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});

describe('useFolderWrite — folder linked but FSA denied (target=download)', () => {
  it('calls onFallback when writeBack returns {target:"download"}', async () => {
    const writeBack = vi.fn().mockResolvedValue({ target: 'download' });
    const folder = mockFolder({ folderName: 'MyNord', writeBack });
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(folder);
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue(mockPref('overwrite'));

    const onSaved = vi.fn();
    const onFallback = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useFolderWrite({ onSaved, onFallback }));

    await act(async () => { await result.current.save(makeJob()); });

    expect(writeBack).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  });
});
