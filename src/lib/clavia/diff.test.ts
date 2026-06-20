import { describe, it, expect } from 'vitest';
import { diffBytes, groupRanges } from './diff';

describe('diffBytes', () => {
  it('returns indices where bytes differ, including length mismatch', () => {
    expect(diffBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 9, 3]))).toEqual([1]);
    expect(diffBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2, 7]))).toEqual([2]);
    expect(diffBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toEqual([]);
  });
});

describe('groupRanges', () => {
  it('groups sorted indices into contiguous ranges', () => {
    expect(groupRanges([])).toEqual([]);
    expect(groupRanges([5])).toEqual([{ start: 5, end: 5 }]);
    expect(groupRanges([3, 4, 5, 9, 10])).toEqual([
      { start: 3, end: 5 }, { start: 9, end: 10 },
    ]);
  });
  it('sorts unsorted input before grouping', () => {
    expect(groupRanges([10, 3, 4, 9, 5])).toEqual([
      { start: 3, end: 5 }, { start: 9, end: 10 },
    ]);
  });
});
