// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { zipSync } from 'fflate';
import { useBackupOrigins } from './useBackupOrigins';
import type { BackupRef } from '@/lib/clavia/backup/backup-index';
import { NSMP_FACTORY_HEAD_BYTES } from '@/lib/ns4/nsmp';

/** Build a minimal codec-4 .nsmp4 head of exactly NSMP_FACTORY_HEAD_BYTES,
 *  with the hdr flag bytes set at payload+8. */
function makeNsmp4Head(factory: boolean): Uint8Array {
  const buf = new Uint8Array(NSMP_FACTORY_HEAD_BYTES);
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  const u32be = (v: number, at: number) => {
    buf[at] = (v >>> 24) & 0xff; buf[at + 1] = (v >>> 16) & 0xff;
    buf[at + 2] = (v >>> 8) & 0xff; buf[at + 3] = v & 0xff;
  };
  ascii('CBIN', 0x00); buf[0x04] = 1; ascii('nsmp', 0x08);
  buf[0x14] = 400 & 0xff; buf[0x15] = (400 >> 8) & 0xff; // codec 4
  u32be(0x4e534d50, 0x2c); u32be(40, 0x30); u32be(4, 0x34); // NSMP root
  u32be(0x00686472, 0x3c); u32be(11, 0x40); u32be(16, 0x44); // hdr section, size=16
  if (factory) { buf[0x48 + 8] = 0x0a; buf[0x48 + 9] = 0x01; }
  return buf;
}

/** Build a zip Blob containing one entry at the given path with the given bytes (stored). */
function makeZipFile(entryPath: string, bytes: Uint8Array): File {
  const z = zipSync({ [entryPath]: [bytes, { level: 0 }] });
  return new File([z.buffer as ArrayBuffer], 'test.ns4b', { type: 'application/zip' });
}

describe('useBackupOrigins', () => {
  it('resolves factory sample → true', async () => {
    const bytes = makeNsmp4Head(true);
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
    const bytes = makeNsmp4Head(false);
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
