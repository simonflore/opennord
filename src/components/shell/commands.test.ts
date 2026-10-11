import { describe, it, expect } from 'vitest';
import { rankCommands, type Command } from './commands';

const cmd = (group: Command['group'], label: string, hint?: string): Command => ({ id: `${group}:${label}`, group, label, hint, run: () => {} });

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
    const ranked = rankCommands([cmd('Programs', 'Big Grain Pad'), cmd('Programs', 'Program Grand')], 'gra');
    // Both have a word starting with "gra"; the shorter label wins the tie.
    expect(ranked.map((c) => c.label)).toEqual(['Big Grain Pad', 'Program Grand']);
  });

  it('keeps only the best matches before grouping them', () => {
    const many = [...Array.from({ length: 3 }, (_, i) => cmd('Samples', `Pad ${i}`)), cmd('Programs', 'Big pad')];
    // 'Big pad' matches mid-label, so it misses a limit of 3 even though programs list before samples.
    expect(rankCommands(many, 'pad', 3).map((c) => c.label)).toEqual(['Pad 0', 'Pad 1', 'Pad 2']);
  });

  it('needs every word, and searches the hint too', () => {
    expect(labels('grand a:11')).toEqual(['Sunday Grand']);
    expect(labels('grand organ')).toEqual([]);
  });

  it('ignores case and extra spaces', () => {
    expect(labels('  BIG  ')).toEqual(['Big Organ']);
  });
});
