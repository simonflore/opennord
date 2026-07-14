import { describe, it, expect } from 'vitest';
import { sampleCategoryName, SAMPLE_CATEGORY } from './sample-categories';

describe('sampleCategoryName', () => {
  it('maps the full sample main-category enum (ids 1–18)', () => {
    const expected = [
      'Bass', 'Drums', 'Accordion/Harm', 'Effects', 'Guitar/Plucked', 'Organ',
      'Percussion', 'Piano', 'Strings', 'Synth', 'Choir', 'Brass', 'Orchestral',
      'Misc', 'User', 'Mellotron', 'Rhythmic', 'Wind',
    ];
    expected.forEach((name, i) => expect(sampleCategoryName(i + 1)).toBe(name));
  });
  it('leaves id 0 (internal "None") unmapped', () => {
    expect(sampleCategoryName(0)).toBeUndefined();
  });
  it('returns undefined for unconfirmed ids and no id', () => {
    expect(sampleCategoryName(99)).toBeUndefined();
    expect(sampleCategoryName(undefined)).toBeUndefined();
  });
  it('does not reuse the program category table (15 = User here, not User 2)', () => {
    expect(SAMPLE_CATEGORY[15]).toBe('User');
  });
});
