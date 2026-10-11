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

vi.mock('../../lib/ns4/nsmp-to-npno', async (orig) => ({
  ...(await orig<typeof import('../../lib/ns4/nsmp-to-npno')>()),
  nsmpToNpno: vi.fn().mockReturnValue({ bytes: new Uint8Array(16), fileName: 'TakeOnMe_6.0.npno', warnings: [] }),
}));

import { SampleConvert } from './SampleConvert';
import { nsmpToNpno } from '../../lib/ns4/nsmp-to-npno';
import { NPNO_PIANO_TYPE } from '../../lib/ns4/nsp-write';
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

describe('SampleConvert -- write in flight', () => {
  it('disables the convert buttons while a save runs (a double-click must not race two writes)', async () => {
    let release!: () => void;
    const writeBack = vi.fn().mockImplementation(
      () => new Promise((res) => { release = () => res({ target: 'folder', path: 'TakeOnMe.nsmp' }); }),
    );
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(
      mockFolder({ folderName: 'TBM', writeBack }),
    );
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue({ mode: 'new', setMode: vi.fn() });

    render(<SampleConvert bytes={bytes} file={file} name="TakeOnMe" />);

    const btn = screen.getByRole('button', { name: /convert to nsmp 2/i });
    fireEvent.click(btn);
    await act(async () => {}); // flush the saving state
    expect(btn).toBeDisabled();
    fireEvent.click(btn); // must be a no-op while the first write is in flight
    await act(async () => { release(); });
    expect(writeBack).toHaveBeenCalledTimes(1);
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

describe('SampleConvert -- to a piano', () => {
  it('builds a piano named after the file, of the chosen type, and saves it as .npno', async () => {
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(mockFolder({ folderName: null }));
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue({ mode: 'ask', setMode: vi.fn() });
    (downloadBytes as ReturnType<typeof vi.fn>).mockClear();

    render(<SampleConvert bytes={bytes} file={{ ...file, name: 'Converted' }} name="Take On Me.nsmp4" />);

    fireEvent.change(screen.getByLabelText(/piano type/i), { target: { value: String(NPNO_PIANO_TYPE.digital) } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /convert to piano/i })); });

    // The conversion starts a tick later, once "Building…" has painted.
    expect(await screen.findByText(/not been tried on a nord/i)).toBeInTheDocument();
    expect(nsmpToNpno).toHaveBeenCalledWith(bytes, { name: 'Take On Me', pianoType: NPNO_PIANO_TYPE.digital });
    expect(downloadBytes).toHaveBeenCalledWith(expect.any(Uint8Array), 'TakeOnMe_6.0.npno');
    expect(screen.getByText(/saved takeonme_6\.0\.npno/i)).toBeInTheDocument();
  });

  it('says why when the sample cannot become a piano', async () => {
    (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(mockFolder({ folderName: null }));
    (useWriteBackPref as ReturnType<typeof vi.fn>).mockReturnValue({ mode: 'ask', setMode: vi.fn() });
    (nsmpToNpno as ReturnType<typeof vi.fn>).mockImplementationOnce(() => { throw new Error('too long for a Nord'); });

    render(<SampleConvert bytes={bytes} file={file} name="TakeOnMe" />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /convert to piano/i })); });

    expect(await screen.findByText(/too long for a nord/i)).toBeInTheDocument();
  });
});
