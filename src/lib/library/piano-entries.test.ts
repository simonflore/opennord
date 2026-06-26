import { describe, it, expect, vi } from 'vitest';
import { pianoEntriesFromScanned, pianoEntriesFromDevice, filterPianos, sortPianos, type PianoEntry } from './piano-entries';
import type { ProgramEntry } from '../device/transfer';

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
