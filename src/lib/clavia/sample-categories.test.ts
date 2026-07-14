import { describe, it, expect } from 'vitest';
import { sampleCategoryName, SAMPLE_CATEGORY } from './sample-categories';

describe('sampleCategoryName', () => {
  it('resolves ids confirmed from labeled NSE exports', () => {
    expect(sampleCategoryName(2)).toBe('Drums');
    expect(sampleCategoryName(3)).toBe('Accordion/Harm');
    expect(sampleCategoryName(12)).toBe('Brass');
    expect(sampleCategoryName(13)).toBe('Orchestral');
    expect(sampleCategoryName(15)).toBe('User');
  });
  it('resolves ids weak-labeled from the factory fixture corpus', () => {
    expect(sampleCategoryName(1)).toBe('Bass');           // "BassGit"
    expect(sampleCategoryName(5)).toBe('Guitar/Plucked'); // "12 String Guitar"
    expect(sampleCategoryName(6)).toBe('Organ');          // "Cathedral Organ"
    expect(sampleCategoryName(7)).toBe('Percussion');     // "Vibes"
    expect(sampleCategoryName(8)).toBe('Piano');          // "ElGrand CP80"
    expect(sampleCategoryName(9)).toBe('Strings');        // "Spitfire String Quintet"
    expect(sampleCategoryName(11)).toBe('Choir');         // "Men+Women"
  });
  it('leaves unconfirmed ids (not in the corpus) unmapped', () => {
    for (const id of [0, 4, 10, 14, 16, 17, 18]) expect(sampleCategoryName(id)).toBeUndefined();
  });
  it('returns undefined for unconfirmed ids and no id', () => {
    expect(sampleCategoryName(99)).toBeUndefined();
    expect(sampleCategoryName(undefined)).toBeUndefined();
  });
  it('does not reuse the program category table (15 = User here, not User 2)', () => {
    expect(SAMPLE_CATEGORY[15]).toBe('User');
  });
});
