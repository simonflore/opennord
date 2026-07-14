import { describe, it, expect, vi } from 'vitest';
import { extractBackupEntry } from './extract-entry';
import type { BackupRef } from './backup-index';
import type { ZipEntry } from './zip-directory';

// ---------------------------------------------------------------------------
// Minimal stub for extractZipEntry — intercept at the module level so we don't
// need a real File or real zip bytes.  The module under test calls
// extractZipEntry(file, entry) and returns whatever it resolves to.
// ---------------------------------------------------------------------------
vi.mock('./zip-directory', () => ({
  extractZipEntry: vi.fn(async (_file: File, _entry: ZipEntry) => new Uint8Array([1, 2, 3])),
}));
import { extractZipEntry } from './zip-directory';

const makeEntry = (path: string): ZipEntry => ({
  path, size: 100, compressedSize: 80, offset: 0, method: 8,
});

const makeRef = (bundlePath: string, entryPath: string): BackupRef => ({
  bundlePath,
  entry: makeEntry(entryPath),
  kind: 'samplib',
  native: false,
});

const fakeFile = new File([], 'backup.ns4b');

describe('extractBackupEntry', () => {
  it('calls openBundle with the bundlePath then extractZipEntry with the entry', async () => {
    const openBundle = vi.fn(async () => fakeFile);
    const folder = { openBundle };

    const ref = makeRef('backup.ns4b', 'Samp Lib/Strings.nsmp4');
    const bytes = await extractBackupEntry(folder, ref);

    // openBundle called with the correct bundle path
    expect(openBundle).toHaveBeenCalledWith('backup.ns4b');
    // extractZipEntry forwarded the File and the exact ZipEntry from the ref
    expect(extractZipEntry).toHaveBeenCalledWith(fakeFile, ref.entry);
    // returned whatever extractZipEntry resolved to
    expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('propagates errors from openBundle', async () => {
    const openBundle = vi.fn(async () => { throw new Error('no folder connected'); });
    const folder = { openBundle };
    const ref = makeRef('backup.ns4b', 'Piano/Grand.npno');
    await expect(extractBackupEntry(folder, ref)).rejects.toThrow('no folder connected');
  });

  it('propagates errors from extractZipEntry', async () => {
    vi.mocked(extractZipEntry).mockRejectedValueOnce(new Error('bad local header'));
    const openBundle = vi.fn(async () => fakeFile);
    const folder = { openBundle };
    const ref = makeRef('backup.ns4b', 'Piano/Grand.npno');
    await expect(extractBackupEntry(folder, ref)).rejects.toThrow('bad local header');
  });

  it('passes factory piano backupRef through the same code path', async () => {
    vi.mocked(extractZipEntry).mockResolvedValueOnce(new Uint8Array([0xca, 0xfe]));
    const openBundle = vi.fn(async () => fakeFile);
    const folder = { openBundle };

    const pianoRef: BackupRef = {
      bundlePath: 'MyBackup.ns4b',
      entry: makeEntry('Piano/Concert Grand.npno'),
      kind: 'piano',
      native: true,
    };
    const bytes = await extractBackupEntry(folder, pianoRef);

    expect(openBundle).toHaveBeenCalledWith('MyBackup.ns4b');
    expect(extractZipEntry).toHaveBeenCalledWith(fakeFile, pianoRef.entry);
    expect(bytes).toEqual(new Uint8Array([0xca, 0xfe]));
  });
});
