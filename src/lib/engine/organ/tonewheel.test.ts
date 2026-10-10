import { describe, it, expect } from 'vitest';
import {
  FOOTAGES, GEAR_TEETH, WHEEL_COUNT, drawbarGain, equalTempered, tonewheelFrequency, wheelFor,
} from './tonewheel';

const cents = (f: number, ref: number) => 1200 * Math.log2(f / ref);

describe('tonewheel frequencies (gear-ratio tuning)', () => {
  it('has twelve gear pairs and 91 wheels', () => {
    expect(GEAR_TEETH).toHaveLength(12);
    expect(WHEEL_COUNT).toBe(91);
  });

  it('wheel 46 is exactly A440 (20 rps × 16 teeth × 88/64)', () => {
    expect(tonewheelFrequency(46)).toBe(440);
  });

  it('spans 32.69 Hz (wheel 1) to 5924.57 Hz (wheel 91)', () => {
    expect(tonewheelFrequency(1)).toBeCloseTo(32.692, 3);
    expect(tonewheelFrequency(13)).toBeCloseTo(65.385, 3);
    expect(tonewheelFrequency(91)).toBeCloseTo(5924.571, 3);
  });

  it('wheels a full octave apart are exactly 2:1 below the 192-tooth top octave', () => {
    for (let w = 1; w + 12 <= 84; w++) {
      expect(tonewheelFrequency(w + 12) / tonewheelFrequency(w)).toBe(2);
    }
  });

  it('top seven wheels use 192 teeth on the gears a fourth up (C8 ≈ 4189.09 Hz)', () => {
    expect(tonewheelFrequency(85)).toBeCloseTo((20 * 192 * 84) / 77, 9);
    expect(tonewheelFrequency(86)).toBe(4440);
  });

  it('stays within ~2 cents of equal temperament, with G# the flattest of the first 84', () => {
    let worst = 0;
    for (let w = 1; w <= 91; w++) {
      const c = cents(tonewheelFrequency(w), equalTempered(w + 23));
      expect(Math.abs(c)).toBeLessThan(2);
      if (w <= 84) worst = Math.min(worst, c);
    }
    expect(worst).toBeCloseTo(-0.69, 1); // G# is 0.69 cents flat
  });

  it('rejects wheels outside the bank', () => {
    expect(() => tonewheelFrequency(0)).toThrow(RangeError);
    expect(() => tonewheelFrequency(92)).toThrow(RangeError);
  });
});

describe('drawbar footages and foldback', () => {
  it('labels the nine drawbars in the standard order', () => {
    expect(FOOTAGES.map((f) => f.label)).toEqual(['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′']);
  });

  /** Wheels used by one drawbar over the 61-key manual (MIDI 36..96). */
  const manual = (bar: number) => Array.from({ length: 61 }, (_, k) => wheelFor(36 + k, bar));

  it('8′ plays wheels 13–73 across the manual', () => {
    expect(manual(2)).toEqual(Array.from({ length: 61 }, (_, k) => 13 + k));
  });

  it('16′ folds its lowest octave up (13–24, then 13–61)', () => {
    const w = manual(0);
    expect(w.slice(0, 12)).toEqual(Array.from({ length: 12 }, (_, k) => 13 + k));
    expect(w.slice(12)).toEqual(Array.from({ length: 49 }, (_, k) => 13 + k));
  });

  it('5⅓′ and 4′ never fold (20–80, 25–85)', () => {
    expect(manual(1)).toEqual(Array.from({ length: 61 }, (_, k) => 20 + k));
    expect(manual(3)).toEqual(Array.from({ length: 61 }, (_, k) => 25 + k));
  });

  it('upper harmonics fold back off the top of the 91-wheel bank', () => {
    const third = manual(4);
    expect(third[0]).toBe(32);
    expect(third[59]).toBe(91);
    expect(third[60]).toBe(80);
    expect(manual(5).slice(-6)).toEqual([80, 81, 82, 83, 84, 85]);
    expect(manual(6).slice(-10)).toEqual([80, 81, 82, 83, 84, 85, 86, 87, 88, 89]);
    const eighth = manual(8);
    expect(eighth[0]).toBe(49);
    expect(eighth.slice(43, 55)).toEqual(Array.from({ length: 12 }, (_, k) => 80 + k));
    expect(eighth.slice(55)).toEqual([80, 81, 82, 83, 84, 85]);
  });

  it('every MIDI note lands on a real wheel, and true bass reaches wheels 1–12', () => {
    for (let m = 0; m <= 127; m++) {
      for (let b = 0; b < 9; b++) {
        const w = wheelFor(m, b);
        expect(w).toBeGreaterThanOrEqual(13);
        expect(w).toBeLessThanOrEqual(91);
      }
    }
    expect(wheelFor(36, 0, 1)).toBe(1);
  });
});

describe('drawbar levels', () => {
  it('is silent at 0, unity at 8, and about 3 dB per step', () => {
    expect(drawbarGain(0)).toBe(0);
    expect(drawbarGain(8)).toBe(1);
    for (let l = 1; l < 8; l++) {
      expect(20 * Math.log10(drawbarGain(l + 1) / drawbarGain(l))).toBeCloseTo(3, 6);
    }
    expect(drawbarGain(12)).toBe(1);
    expect(drawbarGain(-1)).toBe(0);
  });
});
