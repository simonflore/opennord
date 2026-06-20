import { describe, it, expect } from 'vitest';
import { vocabForTag } from './index';

describe('vocabForTag', () => {
  it('returns the Stage 4 vocab for ns4p', () => {
    const v = vocabForTag('ns4p');
    expect(v.length).toBeGreaterThan(0);
    expect(v.every((i) => i.id && i.label && i.section)).toBe(true);
    expect(new Set(v.map((i) => i.id)).size).toBe(v.length); // ids unique
  });
  it('returns empty for an unknown model tag', () => {
    expect(vocabForTag('zzzz')).toEqual([]);
  });
});
