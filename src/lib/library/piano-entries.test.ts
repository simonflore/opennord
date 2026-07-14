import { describe, it, expect, vi } from 'vitest';
import { pianoEntriesFromScanned, pianoEntriesFromDevice, pianoEntriesFromBackupRefs, filterPianos, sortPianos, type PianoEntry } from './piano-entries';
import type { ProgramEntry } from '../device/transfer';
import type { BackupRef } from '../clavia/backup/backup-index';
import { patchNs4Checksum } from '../clavia/checksum';

/** Minimal synthetic .npno (CBIN+npno+CNSP header, name, version, key map @0xB7). */
function makeNpno(name: string, versionRaw: number, keymap: number[]): Uint8Array {
  const buf = new Uint8Array(0x140);
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  ascii('CBIN', 0); buf[4] = 1; ascii('npno', 8);
  buf[0x14] = versionRaw & 0xff; buf[0x15] = (versionRaw >> 8) & 0xff;
  ascii('CNSP', 0x2c); ascii(name, 0x48);
  for (let i = 0; i < 128; i++) buf[0xb7 + i] = keymap[i] ?? 0xff;
  return patchNs4Checksum(buf);
}

vi.mock('../device/factory', () => ({
  resolveFactory: (name: string) => (name === 'Grand Lady D' ? { url: 'https://nord/grand', sizeKb: 1000, sizeDescription: '1 GB', type: 'piano' } : null),
}));

const dev = (over: Partial<ProgramEntry>): ProgramEntry => ({ bank: 0, slot: 0, name: 'X', categoryId: 0, version: 100, sizeBytes: 10, fourcc: 'npno', ...over });

describe('piano-entries', () => {
  it('maps device entries with slot, partition, and a precomputed factory match', () => {
    const out = pianoEntriesFromDevice([dev({ name: 'Grand Lady D' }), dev({ bank: 0, slot: 1, name: 'My Piano' })]);
    expect(out[0]).toMatchObject({ source: 'nord', name: 'Grand Lady D', partition: 1, slot: 'A:11' });
    expect(out[0].id).toBe('nord-piano:A:11');
    expect(out[0].factory?.url).toBe('https://nord/grand'); // factory matched
    expect(out[1].factory).toBeNull();                       // user piano, no match
  });

  it('maps scanned pianos with bytes + size + factory match', () => {
    const out = pianoEntriesFromScanned([{ id: 'folder:a.npno', name: 'Grand Lady D', bytes: new Uint8Array(40) }]);
    expect(out[0]).toMatchObject({ source: 'local', name: 'Grand Lady D', size: 40 });
    expect(out[0].factory?.url).toBe('https://nord/grand');
    expect(out[0].bytes).toBeInstanceOf(Uint8Array);
  });

  it('enriches scanned .npno with version, sample count, and key range from the header', () => {
    const km: number[] = []; for (let n = 0; n < 128; n++) km[n] = n <= 43 ? 40 : n <= 53 ? 50 : 60;
    const out = pianoEntriesFromScanned([{ id: 'folder:p.npno', name: 'My Piano', bytes: makeNpno('My Piano', 610, km) }]);
    expect(out[0]).toMatchObject({ version: '6.10', sampleCount: 3, keyLow: 0, keyHigh: 127 });
  });

  it('leaves metadata unset for an unreadable piano file (does not throw)', () => {
    const out = pianoEntriesFromScanned([{ id: 'folder:x.npno', name: 'Bad', bytes: new Uint8Array(8) }]);
    expect(out[0].version).toBeUndefined();
    expect(out[0].sampleCount).toBeUndefined();
  });

  it('filters by source + query; sorts by size (largest first) and name', () => {
    const es: PianoEntry[] = [
      { id: '1', name: 'B', source: 'local', size: 10, factory: null },
      { id: '2', name: 'A', source: 'nord', size: 99, factory: null },
    ];
    expect(filterPianos(es, 'nord', '').map((e) => e.id)).toEqual(['2']);
    expect(filterPianos(es, 'all', 'a').map((e) => e.id)).toEqual(['2']);
    expect(sortPianos(es, 'size', new Set()).map((e) => e.id)).toEqual(['2', '1']); // 99 before 10
    expect(sortPianos(es, 'name', new Set()).map((e) => e.name)).toEqual(['A', 'B']);
  });
});

describe('pianoEntriesFromBackupRefs', () => {
  const ref = (path: string, size: number, native: boolean): BackupRef => ({
    bundlePath: 'MyBackup.ns4b',
    entry: { path, size, compressedSize: size, offset: 0, method: 0 },
    kind: 'piano',
    native,
  });

  it('produces a byte-free entry with correct source, isFactory, size, and backupRef', () => {
    const r = ref('Piano/Grand Lady D.npno', 204800, true);
    const [e] = pianoEntriesFromBackupRefs([r]);
    expect(e.id).toBe('backup:MyBackup.ns4b!Piano/Grand Lady D.npno');
    expect(e.name).toBe('Grand Lady D');
    expect(e.source).toBe('backup');
    expect(e.isFactory).toBeUndefined(); // lazily resolved; not set at build time
    expect(e.size).toBe(204800);
    expect(e.bytes).toBeUndefined();
    expect(e.backupRef).toBe(r);
    // resolveFactory is mocked → should return a match for 'Grand Lady D'
    expect(e.factory?.url).toBe('https://nord/grand');
  });

  it('marks user-created pianos as isFactory=undefined (lazy resolution, not set at build time)', () => {
    const r = ref('Piano/My Custom Piano.npno', 1024, false);
    const [e] = pianoEntriesFromBackupRefs([r]);
    expect(e.isFactory).toBeUndefined();
    expect(e.factory).toBeNull(); // no factory match for unknown name
  });
});
