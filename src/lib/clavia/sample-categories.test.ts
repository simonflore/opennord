import { describe, it, expect } from 'vitest';
import { sampleCategoryName, sampleCategoryLabel, SAMPLE_CATEGORY, SAMPLE_CATEGORY_LABELS } from './sample-categories';

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
});

describe('sampleCategoryLabel', () => {
  it('combines main + subcategory into the full NSE label', () => {
    // Confirmed against real files.
    expect(sampleCategoryLabel(12, 2)).toBe('Brass Ensemble');
    expect(sampleCategoryLabel(18, 2)).toBe('Wind Ensemble');
    expect(sampleCategoryLabel(10, 3)).toBe('Synth Bass');
    expect(sampleCategoryLabel(9, 3)).toBe('Strings Analog');
    expect(sampleCategoryLabel(9, 1)).toBe('Strings Solo');
    expect(sampleCategoryLabel(7, 1)).toBe('Percussion Tuned');
  });
  it('returns just the main name when the subcategory is empty or absent', () => {
    expect(sampleCategoryLabel(2, 0)).toBe('Drums');   // sub 0 = ""
    expect(sampleCategoryLabel(13, 0)).toBe('Orchestral');
    expect(sampleCategoryLabel(15)).toBe('User');      // no sub byte
  });
  it('returns undefined for an unknown main', () => {
    expect(sampleCategoryLabel(0, 0)).toBeUndefined();
    expect(sampleCategoryLabel(undefined)).toBeUndefined();
  });
  it('SAMPLE_CATEGORY_LABELS lists every combined label in id order', () => {
    expect(SAMPLE_CATEGORY_LABELS[0]).toBe('Bass');            // main 1, sub 0
    expect(SAMPLE_CATEGORY_LABELS).toContain('Brass Ensemble');
    expect(SAMPLE_CATEGORY_LABELS).toContain('Synth Bass');
    // "Bass" (main 1) precedes "Synth Bass" (main 10)
    expect(SAMPLE_CATEGORY_LABELS.indexOf('Bass')).toBeLessThan(SAMPLE_CATEGORY_LABELS.indexOf('Synth Bass'));
  });
  it('returns undefined for unconfirmed ids and no id', () => {
    expect(sampleCategoryName(99)).toBeUndefined();
    expect(sampleCategoryName(undefined)).toBeUndefined();
  });
  it('does not reuse the program category table (15 = User here, not User 2)', () => {
    expect(SAMPLE_CATEGORY[15]).toBe('User');
  });
});
