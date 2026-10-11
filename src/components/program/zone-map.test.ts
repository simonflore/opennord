import { describe, it, expect } from 'vitest';
import { BLACK_KEYS, WHITE_KEYS, keyX, noteToMidi, shortXfade, zoneLanes } from './zone-map';

describe('zone map geometry', () => {
  it('reads note names as MIDI numbers (C4 = 60)', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('F#5')).toBe(78);
    expect(noteToMidi('Bb2')).toBe(46);
    expect(noteToMidi('A0')).toBe(21);
    expect(noteToMidi('on')).toBeNull();
  });

  it('lays out the 88-key board: 52 white keys, 36 black, edges at 0 and 1', () => {
    expect(WHITE_KEYS).toBe(52);
    expect(BLACK_KEYS).toHaveLength(36);
    expect(keyX(21)).toBe(0);
    expect(keyX(60)).toBeCloseTo(23 / 52); // A0, B0, then three octaves C1–B3 = 2 + 21
    expect(keyX(61)).toBeLessThan(keyX(62)); // C#4 sits left of D4's edge
    expect(keyX(61)).toBeGreaterThan(keyX(60));
  });

  it('gives each layer one lane over the stretch it plays; a split that is off does not divide', () => {
    const organA = { kind: 'organ', id: 'A' };
    const pianoA = { kind: 'piano', id: 'A' };
    const synthB = { kind: 'synth', id: 'B' };
    const { lanes, splits } = zoneLanes(
      [
        { layers: [synthB, organA] },
        { layers: [organA] },
        { layers: [pianoA] },
        { layers: [pianoA] },
      ],
      [null, 'C4', 'F5'],
      ['+/- 12 semitones', '+/- 6 semitones', null],
    );
    // Lanes come out organ, piano, synth.
    expect(lanes.map((l) => `${l.kind}${l.id}`)).toEqual(['organA', 'pianoA', 'synthB']);
    // Split 1 is off, so zones 1 and 2 are one stretch: organ A spans 0 → C4 once.
    expect(lanes[0].segments).toEqual([{ from: 0, to: keyX(60) }]);
    // Piano A plays both stretches above C4; they merge into one segment.
    expect(lanes[1].segments).toEqual([{ from: keyX(60), to: 1 }]);
    expect(lanes[2].segments).toEqual([{ from: 0, to: keyX(60) }]);
    // Only the live split points are drawn, each with its own crossfade.
    expect(splits.map((s) => [s.note, s.xfade])).toEqual([['C4', '+/- 6 semitones'], ['F5', null]]);
  });

  it('says a crossfade the way a player would', () => {
    expect(shortXfade('+/- 12 semitones')).toBe('±12');
    expect(shortXfade('+/- 6 semitones')).toBe('±6');
  });
});
