// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { zipSync } from 'fflate';
import { useBackupOrigins } from './useBackupOrigins';
import type { BackupRef } from '@/lib/clavia/backup/backup-index';
import { makeSyntheticSample } from '@/lib/clavia/backup/__fixtures__/synthetic-backup';

/** Build a zip Blob containing one entry at the given path with the given bytes (stored). */
function makeZipFile(entryPath: string, bytes: Uint8Array): File {
  const z = zipSync({ [entryPath]: [bytes, { level: 0 }] });
  return new File([z.buffer as ArrayBuffer], 'test.ns4b', { type: 'application/zip' });
}

describe('useBackupOrigins', () => {
  it('resolves factory sample → true', async () => {
    const bytes = makeSyntheticSample({ factory: true });
    const entryPath = 'Mellotron/Strings.nsmp4';
    const bundlePath = '/fake/backup.ns4b';

    // Build a proper zip and read its actual entry offset.
    const { readZipDirectory } = await import('@/lib/clavia/backup/zip-directory');
    const file = makeZipFile(entryPath, bytes);
    const entries = await readZipDirectory(file);
    const entry = entries.find((e) => e.path === entryPath)!;

    const refs: BackupRef[] = [{ bundlePath, native: false, entry, kind: 'samplib' }];
    const openBundle = vi.fn().mockResolvedValue(file);

    const { result } = renderHook(() => useBackupOrigins(refs, openBundle));
    await waitFor(() => expect(result.current.get(`backup:${bundlePath}!${entryPath}`)).toBe(true));
  });

  it('resolves user sample → false', async () => {
    const bytes = makeSyntheticSample({ factory: false });
    const entryPath = 'Samp Lib/User/Toxic.nsmp4';
    const bundlePath = '/fake/backup.ns4b';

    const { readZipDirectory } = await import('@/lib/clavia/backup/zip-directory');
    const file = makeZipFile(entryPath, bytes);
    const entries = await readZipDirectory(file);
    const entry = entries.find((e) => e.path === entryPath)!;

    const refs: BackupRef[] = [{ bundlePath, native: false, entry, kind: 'samplib' }];
    const openBundle = vi.fn().mockResolvedValue(file);

    const { result } = renderHook(() => useBackupOrigins(refs, openBundle));
    await waitFor(() => expect(result.current.get(`backup:${bundlePath}!${entryPath}`)).toBe(false));
  });
});
