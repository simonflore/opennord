import { describe, it, expect } from 'vitest';
import { rankCommands, type Command } from './commands';

const cmd = (group: Command['group'], label: string, keywords?: string): Command => ({ id: `${group}:${label}`, group, label, keywords, run: () => {} });

const ALL = [
  cmd('Pages', 'Programs'),
  cmd('Pages', 'Device'),
  cmd('Programs', 'Sunday Grand', 'A:11'),
  cmd('Programs', 'Grand Strings', 'B:21'),
  cmd('Programs', 'Big Organ'),
  cmd('Samples', 'Grandpa Choir'),
];

const labels = (q: string) => rankCommands(ALL, q).map((c) => c.label);

describe('rankCommands', () => {
  it('lists only the pages with no query', () => {
    expect(labels('')).toEqual(['Programs', 'Device']);
  });

  it('ranks a label that starts with the word first, and keeps each group together', () => {
    expect(labels('grand')).toEqual(['Grand Strings', 'Sunday Grand', 'Grandpa Choir']);
  });

  it('scores a word by its best place in the label, not its first', () => {
    // "Program Grand" has "gra" inside "Program" first, but also at the start of "Grand";
    // it must tie with "Big Grain Pad" (word start) and beat "Telegraph" (inside a word only).
    const ranked = rankCommands([cmd('Programs', 'Telegraph'), cmd('Programs', 'Big Grain Pad'), cmd('Programs', 'Program Grand')], 'gra');
    expect(ranked.map((c) => c.label)).toEqual(['Big Grain Pad', 'Program Grand', 'Telegraph']);
  });

  it('breaks a tie by the shorter label, then alphabetically', () => {
    const ranked = rankCommands([cmd('Programs', 'Grand Strings'), cmd('Programs', 'Grand'), cmd('Programs', 'Grand Piano')], 'grand');
    expect(ranked.map((c) => c.label)).toEqual(['Grand', 'Grand Piano', 'Grand Strings']);
  });

  it('keeps only the best matches before grouping them', () => {
    const many = [...Array.from({ length: 3 }, (_, i) => cmd('Samples', `Pad ${i}`)), cmd('Programs', 'Big pad')];
    // 'Big pad' matches mid-label, so it misses a limit of 3 even though programs list before samples.
    expect(rankCommands(many, 'pad', 3).map((c) => c.label)).toEqual(['Pad 0', 'Pad 1', 'Pad 2']);
  });

  it('needs every word, and searches the keywords (slot) too', () => {
    expect(labels('grand a:11')).toEqual(['Sunday Grand']);
    expect(labels('grand organ')).toEqual([]);
  });

  it('ignores case and extra spaces', () => {
    expect(labels('  BIG  ')).toEqual(['Big Organ']);
  });
});
