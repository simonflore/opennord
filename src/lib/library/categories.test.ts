import { describe, it, expect } from 'vitest';
import { LIBRARY_CATEGORIES, categoryForPath } from './categories';

describe('LIBRARY_CATEGORIES', () => {
  it('lists the four categories in order with derived paths', () => {
    expect(LIBRARY_CATEGORIES.map((c) => c.id)).toEqual(['programs', 'pianos', 'samples', 'presets']);
    for (const c of LIBRARY_CATEGORIES) expect(c.path).toBe(`/library/${c.id}`);
  });

  it('marks exactly Programs and Samples ready in this sub-project', () => {
    const ready = LIBRARY_CATEGORIES.filter((c) => c.ready).map((c) => c.id);
    expect(ready).toEqual(['programs', 'samples']);
  });

  it('resolves a category from a /library/<id> path, including nested detail', () => {
    expect(categoryForPath('/library/programs')?.id).toBe('programs');
    expect(categoryForPath('/library/programs/abc123')?.id).toBe('programs');
    expect(categoryForPath('/library/samples')?.id).toBe('samples');
    expect(categoryForPath('/device')).toBeUndefined();
  });
});
