import { describe, it, expect } from 'vitest';
import { FULLY_TESTED, HARDWARE_VALIDATED, READ_FAMILIES, READ_MODELS, READ_TESTED_ONLY, modelList } from './line';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { statusFor } from '../../lib/clavia/validation';

describe('landing-page coverage numbers', () => {
  it('counts every model with a program reader, straight from validation.ts', () => {
    const expected = ALL_MODELS.filter((m) => !['unsupported', 'unknown'].includes(statusFor(m.id, 'file-read').status));
    expect(READ_MODELS).toEqual(expected);
    expect(READ_MODELS.length).toBeGreaterThan(20);
  });
  it('names only hardware-validated models as validated', () => {
    expect(HARDWARE_VALIDATED.map((m) => m.id).sort()).toEqual(['stage-2', 'stage-2-ex', 'stage-3', 'stage-4']);
  });
  it('groups them into families that add up, with the C-series under Organ', () => {
    expect(READ_FAMILIES.reduce((n, f) => n + f.models, 0)).toBe(READ_MODELS.length);
    expect(READ_FAMILIES.map((f) => f.family)).toEqual(expect.arrayContaining(['Stage', 'Electro', 'Piano', 'Grand', 'Lead', 'Wave', 'Organ']));
    expect(READ_FAMILIES.some((f) => /^C\d/.test(f.family))).toBe(false);
  });
  it('splits the tested models into fully tested and reading only', () => {
    expect(FULLY_TESTED.map((m) => m.id).sort()).toEqual(['stage-3', 'stage-4']);
    expect(READ_TESTED_ONLY.map((m) => m.id).sort()).toEqual(['stage-2', 'stage-2-ex']);
    expect(modelList(FULLY_TESTED)).toMatch(/^Stage \d and Stage \d$/);
  });
});
