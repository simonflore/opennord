import { describe, it, expect } from 'vitest';
import { selectedBytes } from './SamplesContext';
import type { SampleEntry } from './sample-entries';

const dev = (id: string, sizeBytes: number): SampleEntry => ({
  id, name: id, source: 'nord', generation: 'unknown' as const,
  device: { bank: 5, slot: 0, name: id, categoryId: 0, version: 0, sizeBytes, fourcc: 'nsmp' } as never,
});

describe('selectedBytes', () => {
  it('sums device sizeBytes for the selected ids only', () => {
    const entries = [dev('a', 1000), dev('b', 2000), dev('c', 500)];
    expect(selectedBytes(entries, new Set(['a', 'c']))).toBe(1500);
  });
  it('is zero when nothing is selected', () => {
    expect(selectedBytes([dev('a', 1000)], new Set())).toBe(0);
  });
});
