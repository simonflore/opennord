import { describe, it, expect } from 'vitest';
import { matchesQuery, sortWithFavorites } from './browse';

describe('matchesQuery', () => {
  it('empty query matches anything', () => {
    expect(matchesQuery('Wurli Dream', '')).toBe(true);
    expect(matchesQuery('Wurli Dream', '   ')).toBe(true);
  });
  it('case-insensitive substring', () => {
    expect(matchesQuery('Deep Stab', 'deep')).toBe(true);
    expect(matchesQuery('Deep Stab', 'STAB')).toBe(true);
    expect(matchesQuery('Deep Stab', 'organ')).toBe(false);
  });
});

describe('sortWithFavorites', () => {
  const items = [
    { id: 'a', name: 'Cello' },
    { id: 'b', name: 'Apple' },
    { id: 'c', name: 'Banjo' },
  ];
  const byName = (x: { name: string }, y: { name: string }) => x.name.localeCompare(y.name);

  it('sorts by key when no favorites', () => {
    expect(sortWithFavorites(items, new Set(), byName).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });
  it('floats favorites first, then key within each group', () => {
    expect(sortWithFavorites(items, new Set(['a']), byName).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
  it('orders multiple favorites by key within the favorites group', () => {
    // a=Cello, c=Banjo both favorited → sorted by name (Banjo, Cello), then non-fav b=Apple
    expect(sortWithFavorites(items, new Set(['a', 'c']), byName).map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });
  it('is stable for equal keys and does not mutate input', () => {
    const copy = [...items];
    const out = sortWithFavorites(items, new Set(), () => 0);
    expect(out.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(items).toEqual(copy);
  });
});
