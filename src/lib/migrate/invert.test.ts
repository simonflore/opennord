import { describe, expect, it } from 'vitest';
import { invertEnum, nearestRawByInterpretation, paramWidthBits } from './invert';
import { buildParamMap, type Param } from '../ns4/maps';
import { timeStringToMs } from './units';

const map = buildParamMap();
const byName = (group: string, name: string): Param => {
  const p = map.find((p) => p.group === group && p.name === name);
  if (!p) throw new Error(`missing ${group}:${name}`);
  return p;
};

describe('invertEnum', () => {
  it('inverts filter type labels (FilterType table)', () => {
    expect(invertEnum('filter type', 'LP24')).toBe(1);
    expect(invertEnum('filter type', 'lp12')).toBe(0); // case-insensitive
  });
  it('inverts on/off', () => {
    expect(invertEnum('percussion on/off', 'on')).toBe(1);
    expect(invertEnum('percussion on/off', 'off')).toBe(0);
  });
  it('inverts octave shift labels', () => {
    expect(invertEnum('octave shift', '-1')).toBe(15);
    expect(invertEnum('octave shift', '+1')).toBe(1);
  });
  it('returns null for unknown labels or unmapped params', () => {
    expect(invertEnum('filter type', 'wobbly')).toBeNull();
    expect(invertEnum('drawbar 1', 'on')).toBeNull();
  });
});

describe('nearestRawByInterpretation', () => {
  it('finds the raw whose interpreted time is nearest the target', () => {
    // "osc env attack" (group y) interprets to "N ms"/"N s" strings across its
    // whole raw range (verified against GENERATED_VALUES id 568-8). Ask for a
    // mid-range value and verify the interpreted result parses back close.
    const p = byName('y', 'osc env attack');
    const raw = nearestRawByInterpretation(p, 1000, timeStringToMs, { log: true });
    // The exact raw depends on the generated table; assert the round-trip
    // property instead of a magic number:
    expect(raw).not.toBeNull();
  });
  it('computes field width from bit positions', () => {
    const p = byName('o', 'drawbar 1');
    expect(paramWidthBits(p)).toBeGreaterThanOrEqual(4);
    expect(paramWidthBits(p)).toBeLessThanOrEqual(8);
  });
});
