import { describe, it, expect } from 'vitest';
import { selectedPianoBytes } from './PianosContext';
import type { PianoEntry } from './piano-entries';

const dev = (id: string, sizeBytes: number): PianoEntry => ({
  id, name: id, source: 'nord', factory: null,
  device: { bank: 0, slot: 0, name: id, categoryId: 0, version: 0, sizeBytes, fourcc: 'npno' } as never,
});

describe('selectedPianoBytes', () => {
  it('sums device sizeBytes for the selected ids only', () => {
    expect(selectedPianoBytes([dev('a', 5_000_000), dev('b', 9_000_000)], new Set(['a']))).toBe(5_000_000);
  });
  it('is zero when nothing is selected', () => {
    expect(selectedPianoBytes([dev('a', 1)], new Set())).toBe(0);
  });
});
