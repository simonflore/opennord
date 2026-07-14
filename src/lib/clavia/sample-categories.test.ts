import { describe, it, expect } from 'vitest';
import { sampleCategoryName, SAMPLE_CATEGORY } from './sample-categories';

describe('sampleCategoryName', () => {
  it('resolves confirmed sample-category ids', () => {
    // Pinned empirically from labeled NSE exports (cat chunk byte 0).
    expect(sampleCategoryName(2)).toBe('Drums');
    expect(sampleCategoryName(3)).toBe('Accordion/Harm');
    expect(sampleCategoryName(12)).toBe('Brass');
    expect(sampleCategoryName(13)).toBe('Orchestral');
    expect(sampleCategoryName(15)).toBe('User');
  });
  it('returns undefined for unconfirmed ids and no id', () => {
    expect(sampleCategoryName(99)).toBeUndefined();
    expect(sampleCategoryName(undefined)).toBeUndefined();
  });
  it('does not reuse the program category table (15 = User here, not User 2)', () => {
    expect(SAMPLE_CATEGORY[15]).toBe('User');
  });
});
