import { describe, it, expect } from 'vitest';
import { NW1_PARAMETERS, NW1_SAMPLE_CATEGORIES } from './params.reference';

describe('NW1_PARAMETERS reference', () => {
  it('has a non-trivial parameter set with unique names', () => {
    expect(NW1_PARAMETERS.length).toBeGreaterThan(20);
    const names = NW1_PARAMETERS.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every parameter has a known panel section', () => {
    const sections = new Set(['osc', 'filter', 'env', 'lfo', 'amp', 'fx', 'voice']);
    for (const p of NW1_PARAMETERS) {
      expect(sections.has(p.section), p.name).toBe(true);
    }
  });

  it('enum parameters carry a non-empty ordered value list', () => {
    for (const p of NW1_PARAMETERS) {
      if (p.values) expect(p.values.length, p.name).toBeGreaterThan(1);
    }
  });

  it('exposes the firmware sample-category vocabulary', () => {
    expect(NW1_SAMPLE_CATEGORIES).toContain('Acoustic');
    expect(NW1_SAMPLE_CATEGORIES.length).toBeGreaterThan(10);
  });
});
