import { describe, it, expect } from 'vitest';
import { auditionKeys } from './auditionKeys';

describe('auditionKeys', () => {
  it('plays every C the piano covers, re-pitched from the zone\'s recording (which sounds 4 semitones above its root)', () => {
    const zones = [
      { rootNote: 40, lowNote: 21, highNote: 50 },
      { rootNote: 62, lowNote: 51, highNote: 70 },
      { rootNote: 76, lowNote: 71, highNote: 80 },
    ];
    expect(auditionKeys(zones, 3)).toEqual([
      { id: 'note-36', label: 'C2', zone: 0, semitones: -8 },
      { id: 'note-48', label: 'C3', zone: 0, semitones: 4 },
      { id: 'note-60', label: 'C4', zone: 1, semitones: -6 },
      { id: 'note-72', label: 'C5', zone: 2, semitones: -8 },
    ]); // C6 (84) is above this piano's range
  });

  it('falls back to low / middle / high recordings without a usable key map', () => {
    expect(auditionKeys([], 9).map((k) => [k.label, k.zone, k.semitones])).toEqual([['Low', 0, 0], ['Middle', 4, 0], ['High', 8, 0]]);
    expect(auditionKeys([], 2).map((k) => k.label)).toEqual(['Low', 'High']);
    expect(auditionKeys([], 1).map((k) => k.label)).toEqual(['Play']);
    expect(auditionKeys([], 0)).toEqual([]);
  });
});
