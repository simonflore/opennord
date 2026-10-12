import { describe, it, expect } from 'vitest';
import { HARDWARE_VALIDATED, READ_FAMILIES, READ_MODELS } from './line';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { statusFor } from '../../lib/clavia/validation';

describe('landing-page coverage numbers', () => {
  it('counts every model with a program reader, straight from validation.ts', () => {
    const expected = ALL_MODELS.filter((m) => !['unsupported', 'unknown'].includes(statusFor(m.id, 'file-read').status));
    expect(READ_MODELS).toEqual(expected);
    expect(READ_MODELS.length).toBeGreaterThan(20);
  });
  it('names only hardware-validated models as validated', () => {
    expect(HARDWARE_VALIDATED.map((m) => m.id)).toEqual(['stage-4']);
  });
  it('groups them into families that add up, with the C-series under Organ', () => {
    expect(READ_FAMILIES.reduce((n, f) => n + f.models, 0)).toBe(READ_MODELS.length);
    expect(READ_FAMILIES.map((f) => f.family)).toEqual(expect.arrayContaining(['Stage', 'Electro', 'Piano', 'Grand', 'Lead', 'Wave', 'Organ']));
    expect(READ_FAMILIES.some((f) => /^C\d/.test(f.family))).toBe(false);
  });
});
