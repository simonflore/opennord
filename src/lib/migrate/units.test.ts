import { describe, expect, it } from 'vitest';
import { dbStringToMidi, timeStringToMs, freqStringToHz } from './units';
import { NORD_DB } from '../clavia/volume';

describe('dbStringToMidi', () => {
  it('inverts every NORD_DB entry back to its index', () => {
    for (let i = 0; i < NORD_DB.length; i++) {
      expect(dbStringToMidi(NORD_DB[i])).toBe(i);
    }
  });
  it('returns null for unknown strings', () => {
    expect(dbStringToMidi('loud')).toBeNull();
  });
});

describe('timeStringToMs', () => {
  it('parses ms, s, and bare-number strings', () => {
    expect(timeStringToMs('0.5 ms')).toBe(0.5);
    expect(timeStringToMs('3.0 ms')).toBe(3);
    expect(timeStringToMs('1.5 s')).toBe(1500);
    expect(timeStringToMs('45 s')).toBe(45000);
  });
  it('strips decoder prefixes like "Attack: 0.5 ms"', () => {
    expect(timeStringToMs('Attack: 0.5 ms')).toBe(0.5);
  });
  it('returns null for non-time strings ("Sustain", master-clock divisions)', () => {
    expect(timeStringToMs('Sustain')).toBeNull();
    expect(timeStringToMs('1/16T')).toBeNull();
  });
});

describe('freqStringToHz', () => {
  it('parses Hz and kHz', () => {
    expect(freqStringToHz('2.0 Hz')).toBe(2);
    expect(freqStringToHz('1 kHz')).toBe(1000);
    expect(freqStringToHz('14.7 kHz')).toBe(14700);
  });
  it('returns null otherwise', () => {
    expect(freqStringToHz('1/8')).toBeNull();
  });
});
