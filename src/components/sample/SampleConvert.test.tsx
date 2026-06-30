// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

// --- mocks (must be before imports of the mocked modules) ---

vi.mock('../../lib/download', () => ({ downloadBytes: vi.fn() }));
vi.mock('../../lib/folder/FolderContext', () => ({ useFolder: vi.fn() }));
vi.mock('../../lib/library/writeBackPrefs', () => ({ useWriteBackPref: vi.fn() }));
vi.mock('../../lib/ns4/nsmp-convert', () => ({
  convertNsmp: vi.fn().mockReturnValue({
    bytes: new Uint8Array(8),
    extension: '.nsmp',
    warnings: [],
  }),
}));

import { SampleConvert } from './SampleConvert';
import type { NsmpFile } from '../../lib/ns4/nsmp';
import { downloadBytes } from '../../lib/download';
import { useFolder } from '../../lib/folder/FolderContext';
import { useWriteBackPref } from '../../lib/library/writeBackPrefs';

// A minimal .nsmp4 (codec 4) NsmpFile -- enough to make SampleConvert render its buttons.
const file: NsmpFile = {
  recognized: true,
  name: 'TakeOnMe',
  codec: 4,
  legacy: false,
  checksumValid: true,
  sections: [],
  strokeCount: 0,
  suspectedFactory: false,
  warnings: [],
};
const bytes = new Uint8Array(32);

/** Build a full FolderLibrary mock with given overrides. */
function mockFolder(over: Record<string, unknown> = {}) {
  return {
    folderName: null,
    writeBack: vi.fn(),
    bundles: [], newBundles: [], pickerOpen: false,
    needsReconnect: false, reconnectError: null, busy: false, canPersist: false,
    result: { programs: [], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] },
    choose: async () => {}, reconnect: async () => {}, refresh: async () => {},
    forget: async () => {}, openBundlePicker: () => {}, closeBundlePicker: () => {},
    applyBundleSelection: async () => {}, openBundle: async () => { throw new Error('no'); },
    ...over,
  };
}

describe('SampleConvert -- folder linked', () => {
  it('calls writeBack (not downloadBytes) and shows Saved confirmation', async () => {
    const writeBack = vi.fn().mockResolvedValue({ target: 'folder', path: 'TakeOnMe.nsmp' });
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(
      mockFolder({ folderName: 'TBM', writeBack }),
    );
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue({ mode: 'new', setMode: vi.fn() });
    (downloadBytes as ReturnType<typeof vi.fn>).mockClear();

    render(<SampleConvert bytes={bytes} file={file} name="TakeOnMe" />);

    // Convert to NSMP 2 (.nsmp) button
    const btn = screen.getByRole('button', { name: /convert to nsmp 2/i });
    await act(async () => { fireEvent.click(btn); });

    expect(downloadBytes).not.toHaveBeenCalled();
    expect(writeBack).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/saved to tbm/i)).toBeInTheDocument();
  });
});

describe('SampleConvert -- no folder linked', () => {
  it('falls back to downloadBytes when folderName is null', async () => {
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(mockFolder({ folderName: null }));
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue({ mode: 'ask', setMode: vi.fn() });
    (downloadBytes as ReturnType<typeof vi.fn>).mockClear();

    render(<SampleConvert bytes={bytes} file={file} name="TakeOnMe" />);

    const btn = screen.getByRole('button', { name: /convert to nsmp 2/i });
    await act(async () => { fireEvent.click(btn); });

    expect(downloadBytes).toHaveBeenCalledTimes(1);
  });
});
