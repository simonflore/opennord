import { describe, it, expect } from 'vitest';
import { NL4_PARAMETERS } from './parameters.reference';

describe('NL4_PARAMETERS reference', () => {
  it('has the full documented parameter set with no duplicate CC numbers', () => {
    expect(NL4_PARAMETERS.length).toBe(92);
    const ccs = NL4_PARAMETERS.map(p => p.cc);
    expect(new Set(ccs).size).toBe(ccs.length);
  });

  it('every parameter carries exactly one of values | range', () => {
    for (const p of NL4_PARAMETERS) {
      expect(Boolean(p.values) !== Boolean(p.range), p.name).toBe(true);
    }
  });

  it('ranges are ordered [min, max] and enums are non-empty', () => {
    for (const p of NL4_PARAMETERS) {
      if (p.range) expect(p.range[0], p.name).toBeLessThanOrEqual(p.range[1]);
      if (p.values) expect(p.values.length, p.name).toBeGreaterThan(1);
    }
  });
});
