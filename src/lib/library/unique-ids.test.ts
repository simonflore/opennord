import { describe, it, expect } from 'vitest';
import { repeatedIds, withUniqueIds } from './unique-ids';
import { nordEntriesFromDevice } from './entries';
import { nordSampleEntriesFromDevice } from './sample-entries';
import type { ProgramEntry } from '../device/transfer';

const file = (slot: number, name: string): ProgramEntry =>
  ({ bank: 0, slot, name, categoryId: 0, version: 0, sizeBytes: 0, fourcc: 'ns4p' });

describe('withUniqueIds', () => {
  it('hands back the same list when no id repeats', () => {
    const list = [{ id: 'a' }, { id: 'b' }];
    expect(withUniqueIds(list)).toBe(list);
    expect(repeatedIds(list)).toEqual([]);
  });

  it('numbers each later entry with a taken id, and says which ids repeated', () => {
    const out = withUniqueIds([{ id: 'a', n: 1 }, { id: 'a', n: 2 }, { id: 'b', n: 3 }, { id: 'a', n: 4 }]);
    expect(out.map((e) => e.id)).toEqual(['a', 'a~2', 'b', 'a~3']);
    expect(out.map((e) => e.n)).toEqual([1, 2, 3, 4]);
    expect(repeatedIds(out)).toEqual(['a']);
  });
});

describe('a Nord list that names one slot twice', () => {
  // The Nord listing the same address twice is the one way left to repeat an id.
  it('keeps every program openable as itself, in the Nord\'s order', () => {
    const out = nordEntriesFromDevice([file(0, 'LadiesNight'), file(0, 'The opening')]);
    expect(out.map((e) => [e.id, e.name])).toEqual([['nord:A:11', 'LadiesNight'], ['nord:A:11~2', 'The opening']]);
  });

  it('keeps every sample on its own file', () => {
    const files = [file(0, 'OrchStrings'), file(0, 'KRG')];
    const out = nordSampleEntriesFromDevice(files);
    expect(out.map((e) => e.id)).toEqual(['nord-sample:A:11', 'nord-sample:A:11~2']);
    expect(out[1].device).toBe(files[1]); // the pull reads this file, not the first
  });
});
