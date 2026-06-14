import { describe, it, expect } from 'vitest';
import { nordEntriesFromDevice, filterEntries } from './entries';
import type { LibraryEntry } from './types';

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
