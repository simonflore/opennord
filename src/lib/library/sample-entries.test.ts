import { describe, it, expect } from 'vitest';
import {
  sampleGeneration, sampleEntriesFromScanned, nordSampleEntriesFromDevice,
  sampleEntriesFromBackupRefs,
  filterSamples, sortSamples, sampleEntryFromImport, type SampleEntry,
} from './sample-entries';
import { writeNsmp } from '../ns4/nsmp-write';
import type { NsmpFile } from '../ns4/nsmp';
import type { ScannedSample } from '../folder/scan';
import type { BackupRef } from '../clavia/backup/backup-index';

const file = (over: Partial<NsmpFile>): NsmpFile => ({
  recognized: true, legacy: false, checksumValid: true, sections: [],
  strokeCount: 1, suspectedFactory: false, warnings: [], ...over,
});

describe('sampleGeneration', () => {
  it('maps legacy → og, codec 3/4, else unknown', () => {
    expect(sampleGeneration(file({ legacy: true }))).toBe('og');
    expect(sampleGeneration(file({ codec: 3 }))).toBe('3');
    expect(sampleGeneration(file({ codec: 4 }))).toBe('4');
    expect(sampleGeneration(file({ recognized: false }))).toBe('unknown');
  });
});

describe('sampleEntriesFromScanned', () => {
  it('maps scanned samples to local entries with generation/size/strokes', () => {
    const scanned: ScannedSample[] = [{
      id: 'folder:Bell.nsmp4', name: 'Bell', path: 'Bell.nsmp4',
      file: file({ codec: 4, strokeCount: 3 }), bytes: new Uint8Array([1, 2, 3, 4]),
    }];
    const out = sampleEntriesFromScanned(scanned);
    expect(out[0]).toMatchObject({
      id: 'folder:Bell.nsmp4', name: 'Bell', source: 'local',
      generation: '4', strokeCount: 3, size: 4,
    });
    expect(out[0].bytes).toBe(scanned[0].bytes);
  });
});

describe('nordSampleEntriesFromDevice', () => {
  it('maps enumerated device samples to nord entries (name + slot, unknown gen)', () => {
    const entry = { bank: 0, slot: 13, name: 'Mellotron', categoryId: 0, version: 400, sizeBytes: 0, fourcc: 'nsmp' };
    const out = nordSampleEntriesFromDevice([entry]);
    expect(out[0]).toMatchObject({ id: 'nord-sample:A:26', name: 'Mellotron', source: 'nord', slot: 'A:26', generation: 'unknown' });
    expect(out[0].bytes).toBeUndefined();
    expect(out[0].device).toBe(entry);   // carried for pullSample on tap
  });
});

const sample: SampleEntry[] = [
  { id: 'nord-sample:A:01', name: 'Choir', source: 'nord', generation: 'unknown' },
  { id: 'folder:Bell.nsmp4', name: 'Bell', source: 'local', generation: '4', strokeCount: 3, size: 4000 },
  { id: 'folder:Old.nsmp', name: 'Old Pad', source: 'local', generation: 'og', strokeCount: 1, size: 9000 },
];

describe('filterSamples', () => {
  it('filters by source, generation, and name independently', () => {
    expect(filterSamples(sample, 'all', 'all', '')).toHaveLength(3);
    expect(filterSamples(sample, 'local', 'all', '')).toHaveLength(2);
    expect(filterSamples(sample, 'all', '4', '')).toHaveLength(1);
    expect(filterSamples(sample, 'all', 'all', 'pad')).toHaveLength(1);
    expect(filterSamples(sample, 'local', 'og', 'bell')).toHaveLength(0);
  });
});

describe('sortSamples', () => {
  const none = new Set<string>();
  const names = (es: SampleEntry[]) => es.map((e) => e.name);
  it('default keeps input order', () => {
    expect(names(sortSamples(sample, 'default', none))).toEqual(['Choir', 'Bell', 'Old Pad']);
  });
  it('name sorts alphabetically', () => {
    expect(names(sortSamples(sample, 'name', none))).toEqual(['Bell', 'Choir', 'Old Pad']);
  });
  it('size sorts largest first (missing size last)', () => {
    expect(names(sortSamples(sample, 'size', none))).toEqual(['Old Pad', 'Bell', 'Choir']);
  });
  it('strokes sorts most first (missing last)', () => {
    expect(names(sortSamples(sample, 'strokes', none))).toEqual(['Bell', 'Old Pad', 'Choir']);
  });
  it('favorites float to the top', () => {
    expect(names(sortSamples(sample, 'name', new Set(['folder:Old.nsmp'])))).toEqual(['Old Pad', 'Bell', 'Choir']);
  });
});

describe('sampleEntryFromImport', () => {
  it('maps imported bytes to a local SampleEntry with the parsed generation', () => {
    const bytes = writeNsmp({ name: 'Pad', channels: [new Int16Array(64)], codec: 3 });
    const e = sampleEntryFromImport({ id: 'local:abc', name: 'Pad.nsmp3', bytes });
    expect(e.id).toBe('local:abc');
    expect(e.name).toBe('Pad'); // the file's own name wins over the filename stem
    expect(e.source).toBe('local');
    expect(e.generation).toBe('3');
    expect(e.size).toBe(bytes.length);
    expect(e.bytes).toBe(bytes);
    expect(e.file?.recognized).toBe(true);
  });

  it('falls back to the filename stem when the file carries no name', () => {
    const bytes = writeNsmp({ name: '', channels: [new Int16Array(64)], codec: 3 });
    const e = sampleEntryFromImport({ id: 'local:x', name: 'My Loop.nsmp3', bytes });
    expect(e.name).toBe('My Loop');
  });
});

describe('sampleEntriesFromBackupRefs', () => {
  const ref = (path: string, size: number, native: boolean): BackupRef => ({
    bundlePath: 'MyBackup.ns4b',
    entry: { path, size, compressedSize: size, offset: 0, method: 0 },
    kind: 'samplib',
    native,
  });

  it('produces a byte-free entry with correct source, factory, size, and backupRef', () => {
    const r = ref('Samp Lib/Choir/Choir.nsmp4', 8192, true);
    const [e] = sampleEntriesFromBackupRefs([r]);
    expect(e.id).toBe('backup:MyBackup.ns4b!Samp Lib/Choir/Choir.nsmp4');
    expect(e.name).toBe('Choir');
    expect(e.source).toBe('backup');
    expect(e.factory).toBe(true);
    expect(e.size).toBe(8192);
    expect(e.generation).toBe('4');
    expect(e.bytes).toBeUndefined();
    expect(e.backupRef).toBe(r);
  });

  it('marks user-imported samples as factory=false', () => {
    const r = ref('User Samples/MyPad.nsmp3', 4096, false);
    const [e] = sampleEntriesFromBackupRefs([r]);
    expect(e.factory).toBe(false);
    expect(e.generation).toBe('3');
  });

  it('maps .nsmp (bare) → og, .npno → npno, unknown ext → unknown', () => {
    expect(sampleEntriesFromBackupRefs([ref('Samp Lib/X.nsmp', 1, true)])[0].generation).toBe('og');
    expect(sampleEntriesFromBackupRefs([ref('Piano/X.npno', 1, true)])[0].generation).toBe('npno');
    expect(sampleEntriesFromBackupRefs([ref('Other/X.wav', 1, false)])[0].generation).toBe('unknown');
  });
});
