import { describe, it, expect } from 'vitest';
import { zipSync, strToU8, type ZipOptions } from 'fflate';
import { readZipDirectory, extractZipEntry, extractZipEntryHead } from './zip-directory';

// fflate zipSync builds a real ZIP we can index + extract from. level 0 = stored, else deflate.
function zipBlob(files: Record<string, [Uint8Array, ZipOptions['level']]>): Blob {
  const z = zipSync(Object.fromEntries(
    Object.entries(files).map(([k, [b, level]]) => [k, [b, { level }]]),
  ));
  return new Blob([z.buffer as ArrayBuffer]);
}

describe('zip-directory', () => {
  const stored = strToU8('hello stored world');           // method 0
  const deflated = strToU8('x'.repeat(2000));              // compresses (method 8)
  const blob = zipBlob({ 'a/stored.bin': [stored, 0], 'b/deflated.bin': [deflated, 6] });

  it('lists every entry with name, sizes, offset, and method', async () => {
    const entries = await readZipDirectory(blob);
    const byName = Object.fromEntries(entries.map((e) => [e.path, e]));
    expect(Object.keys(byName).sort()).toEqual(['a/stored.bin', 'b/deflated.bin']);
    expect(byName['a/stored.bin'].method).toBe(0);
    expect(byName['a/stored.bin'].size).toBe(stored.length);
    expect(byName['b/deflated.bin'].method).toBe(8);
    expect(byName['b/deflated.bin'].size).toBe(deflated.length);
  });

  it('extracts a stored entry (no inflate) round-trip', async () => {
    const entries = await readZipDirectory(blob);
    const e = entries.find((x) => x.path === 'a/stored.bin')!;
    expect([...await extractZipEntry(blob, e)]).toEqual([...stored]);
  });

  it('extracts a deflated entry (inflate) round-trip', async () => {
    const entries = await readZipDirectory(blob);
    const e = entries.find((x) => x.path === 'b/deflated.bin')!;
    expect([...await extractZipEntry(blob, e)]).toEqual([...deflated]);
  });

  it('extractZipEntryHead returns head of a STORED entry (method 0)', async () => {
    const entries = await readZipDirectory(blob);
    const e = entries.find((x) => x.path === 'a/stored.bin')!;
    const full = await extractZipEntry(blob, e);
    const head = await extractZipEntryHead(blob, e, 5);
    expect([...head]).toEqual([...full.subarray(0, 5)]);
  });

  it('extractZipEntryHead returns head of a DEFLATE entry (method 8)', async () => {
    const entries = await readZipDirectory(blob);
    const e = entries.find((x) => x.path === 'b/deflated.bin')!;
    const full = await extractZipEntry(blob, e);
    const head = await extractZipEntryHead(blob, e, 100);
    expect([...head]).toEqual([...full.subarray(0, 100)]);
  });

  it('extractZipEntryHead clamps to entry size when n > size', async () => {
    const entries = await readZipDirectory(blob);
    const e = entries.find((x) => x.path === 'a/stored.bin')!;
    const full = await extractZipEntry(blob, e);
    const head = await extractZipEntryHead(blob, e, 9999);
    expect([...head]).toEqual([...full]);
  });

  // ZIP64 guard: when 32-bit fields are saturated but no ZIP64 locator is present,
  // readZipDirectory must throw the canonical error message rather than silently misread.
  it('throws a clear error when ZIP64 locator is missing (saturated 32-bit EOCD)', async () => {
    // Build a minimal EOCD record with cdOffset saturated to 0xffffffff.
    // This mimics a ZIP64 archive where the locator has been stripped or is missing.
    const eocd = new Uint8Array(22);
    const v = new DataView(eocd.buffer);
    v.setUint32(0, 0x06054b50, true);  // EOCD signature
    v.setUint16(4, 0, true);           // disk number
    v.setUint16(6, 0, true);           // start disk
    v.setUint16(8, 1, true);           // entries on disk
    v.setUint16(10, 1, true);          // total entries
    v.setUint32(12, 0xffffffff, true); // CD size (saturated — triggers ZIP64 check)
    v.setUint32(16, 0xffffffff, true); // CD offset (saturated — triggers ZIP64 check)
    v.setUint16(20, 0, true);          // comment length

    // No ZIP64 locator before the EOCD — just the raw EOCD on its own.
    const fakeZip = new Blob([eocd]);
    await expect(readZipDirectory(fakeZip)).rejects.toThrow(
      'Backup needs ZIP64 but the locator is missing.',
    );
  });
});
