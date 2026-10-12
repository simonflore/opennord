import { describe, it, expect } from 'vitest';
import {
  keyName, pianoSynthSides, singleSplit, splitSide, splitText,
  SPLIT_NOTES_C3_TO_F5, SPLIT_NOTES_F2_TO_F6, SPLIT_NOTES_FROM_C3, SPLIT_NOTES_FROM_F2,
} from './fw-present';

describe('split helpers', () => {
  it('names a key counted from the bottom of an 88-key keyboard', () => {
    expect([keyName(0), keyName(39), keyName(44), keyName(87)]).toEqual(['A0', 'C4', 'F4', 'C8']);
  });

  it('lists the fixed positions: every C and F', () => {
    expect(SPLIT_NOTES_FROM_F2).toHaveLength(10);
    expect([SPLIT_NOTES_FROM_F2[0], SPLIT_NOTES_FROM_F2[3], SPLIT_NOTES_FROM_F2[9]]).toEqual(['F2', 'C4', 'C7']);
    expect([...SPLIT_NOTES_FROM_C3]).toEqual(['C3', 'F3', 'C4', 'F4', 'C5', 'F5', 'C6']);
    // The shorter lists are the same places from the same start, so one index is one note on every model.
    expect([SPLIT_NOTES_F2_TO_F6.length, SPLIT_NOTES_F2_TO_F6.at(-1)]).toEqual([9, 'F6']);
    expect([SPLIT_NOTES_C3_TO_F5.length, SPLIT_NOTES_C3_TO_F5.at(-1)]).toEqual([6, 'F5']);
  });

  it('words the split for the header', () => {
    expect(splitText(false, 'C4', 2)).toBe('off');
    expect(splitText(true, 'C4')).toBe('at C4');
    expect(splitText(true, 'C4', 2)).toBe('at C4 · crossfade ±12');
    expect(splitText(true, undefined)).toBe('on'); // a position the table doesn't name
    expect(splitText(true, 'F4', 1, 'Piano / Synth')).toBe('Piano / Synth · at F4 · crossfade ±6');
  });

  it('reads a zone value as a side, lower first, with the whole keyboard in the middle', () => {
    expect([splitSide(0), splitSide(1), splitSide(2), splitSide(3), splitSide(undefined)]).toEqual(['lower', 'both', 'upper', undefined, undefined]);
  });

  it('puts each sound on its side of the one split point, on the map’s middle boundary', () => {
    const z = singleSplit(true, 'F3', 2, [
      { kind: 'piano', id: 'A', on: true, side: 'lower' },
      { kind: 'synth', id: 'A', on: true, side: 'upper' },
      { kind: 'piano', id: 'B', on: false, side: 'both' },
      { kind: 'synth', id: 'B', on: true, side: undefined }, // unknown zone value: the whole keyboard
    ])!;
    expect(z.hasSplit).toBe(true);
    expect(z.boundaries).toEqual([null, 'F3', null]);
    expect(z.xfade).toEqual([null, '+/- 12 semitones', null]);
    const ids = (i: number) => z.zones[i].layers.map((l) => `${l.kind}${l.id}`);
    expect([ids(0), ids(1), ids(2), ids(3)]).toEqual([['pianoA', 'synthB'], ['pianoA', 'synthB'], ['synthA', 'synthB'], ['synthA', 'synthB']]);
  });

  it('puts piano and synth either side from the one setting: 1 piano below, 2 synth below', () => {
    const side = (sides: number) => Object.fromEntries(pianoSynthSides(sides, true, true).map((l) => [l.kind, l.side]));
    expect(side(1)).toEqual({ piano: 'lower', synth: 'upper' });
    expect(side(2)).toEqual({ piano: 'upper', synth: 'lower' });
  });

  it('is nothing with the split off or its position unknown', () => {
    expect(singleSplit(false, 'C4', 0, [])).toBeUndefined();
    expect(singleSplit(true, undefined, 0, [])).toBeUndefined();
  });
});
