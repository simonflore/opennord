import { describe, it, expect } from 'vitest';
import { nordEntriesFromDevice, filterEntries, entriesFromScannedPrograms, sortEntries } from './entries';
import type { LibraryEntry } from './types';
import type { ScannedProgram } from '../folder/scan';
import type { NS4Program } from '../ns4/types';

// formatSlot(0, 13): bank 0 → 'A', loc=13 → Math.floor(13/8)+1=2, (13%8)+1=6 → 'A:26'
// (Task spec assumed 0-indexed slot displayed 1-indexed as 'A:14', but the real
//  formatSlot uses a 6-bit page×8 encoding: digit1=(loc/8)+1, digit2=(loc%8)+1)

const sample: LibraryEntry[] = [
  { id: 'nord:A:14', name: 'Wurli Dream', source: 'nord', slot: 'A:14' },
  { id: 'local:1', name: 'Sunday Organ', source: 'local' },
  { id: 'nord:B:03', name: 'Deep Stab', source: 'nord', slot: 'B:03' },
];

describe('nordEntriesFromDevice', () => {
  it('maps device program entries to nord library entries with a slot label', () => {
    const out = nordEntriesFromDevice([{ bank: 0, slot: 13, name: 'Wurli Dream', categoryId: 0, version: 313, sizeBytes: 0, fourcc: 'ns4p' }]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('nord');
    expect(out[0].name).toBe('Wurli Dream');
    expect(out[0].slot).toBe('A:26');   // formatSlot(0,13) → 'A:26' (page 2, position 6)
    expect(out[0].id).toBe('nord:A:26');
  });
});

describe('filterEntries', () => {
  it('returns all entries for the "all" source and empty query', () => {
    expect(filterEntries(sample, 'all', '')).toHaveLength(3);
  });
  it('filters by source', () => {
    expect(filterEntries(sample, 'nord', '')).toHaveLength(2);
    expect(filterEntries(sample, 'local', '')).toHaveLength(1);
  });
  it('filters by case-insensitive name substring', () => {
    const out = filterEntries(sample, 'all', 'deep');
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Deep Stab');
  });
});

describe('entriesFromScannedPrograms', () => {
  it('maps scanned programs to local Library entries, preserving id', () => {
    const fakeProgram = { parsed: false, bytes: new Uint8Array() } as unknown as NS4Program;
    const scanned: ScannedProgram[] = [
      { id: 'folder:Lead.ns4p', name: 'Lead', path: 'Lead.ns4p', program: fakeProgram, bytes: new Uint8Array([1]), summary: 'synth' },
    ];
    const entries = entriesFromScannedPrograms(scanned);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ id: 'folder:Lead.ns4p', name: 'Lead', source: 'local', summary: 'synth' });
    expect(entries[0].program).toBe(fakeProgram);
  });
});

describe('sortEntries', () => {
  const none = new Set<string>();
  const names = (es: LibraryEntry[]) => es.map((e) => e.name);

  it('default keeps input order', () => {
    expect(names(sortEntries(sample, 'default', none))).toEqual(['Wurli Dream', 'Sunday Organ', 'Deep Stab']);
  });

  it('name sorts alphabetically', () => {
    expect(names(sortEntries(sample, 'name', none))).toEqual(['Deep Stab', 'Sunday Organ', 'Wurli Dream']);
  });

  it('source groups by source then name (local before nord)', () => {
    expect(names(sortEntries(sample, 'source', none))).toEqual(['Sunday Organ', 'Deep Stab', 'Wurli Dream']);
  });

  it('favorites float to the top within the active sort', () => {
    const fav = new Set(['nord:B:03']); // Deep Stab
    expect(names(sortEntries(sample, 'name', fav))).toEqual(['Deep Stab', 'Sunday Organ', 'Wurli Dream']);
    // even under default order, the favorite leads
    expect(names(sortEntries(sample, 'default', fav))).toEqual(['Deep Stab', 'Wurli Dream', 'Sunday Organ']);
  });

  it('does not mutate the input array', () => {
    const copy = [...sample];
    sortEntries(sample, 'name', none);
    expect(sample).toEqual(copy);
  });
});
