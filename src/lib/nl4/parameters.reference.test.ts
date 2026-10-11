import { describe, it, expect } from 'vitest';
import { NL4_PARAMETERS } from './parameters.reference';
import { NL4_LAYOUT, NL4_PERF_LAYOUT } from './layout.generated';

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

  it('names every CC-carrying firmware descriptor after its manual entry', () => {
    const byCc = new Map(NL4_PARAMETERS.map((p) => [p.cc, p]));
    for (const f of [...NL4_LAYOUT.fields, ...NL4_PERF_LAYOUT.fields]) {
      if (f.cc === undefined || f.name.startsWith('param ')) continue;
      const ref = byCc.get(f.cc);
      expect(ref, f.name).toBeDefined();
      expect(f.name.startsWith(ref!.name), f.name).toBe(true);
    }
  });

  it('carries the firmware cardinality notes (Lead 4 OS 1.32 descriptors)', () => {
    const noted = NL4_PARAMETERS.filter((p) => p.firmware).map((p) => p.name).sort();
    expect(noted).toEqual(['Delay Tempo', 'Osc 2 Noise KBT', 'Osc 2 Waveform', 'Pitch Bend Range', 'Reverb Model']);
  });

  it('ranges are ordered [min, max] and enums are non-empty', () => {
    for (const p of NL4_PARAMETERS) {
      if (p.range) expect(p.range[0], p.name).toBeLessThanOrEqual(p.range[1]);
      if (p.values) expect(p.values.length, p.name).toBeGreaterThan(1);
    }
  });
});
