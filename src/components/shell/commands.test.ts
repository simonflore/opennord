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

  it('ranks a label that starts with the word above one that contains it', () => {
    expect(labels('grand')).toEqual(['Grand Strings', 'Grandpa Choir', 'Sunday Grand']);
  });

  it('needs every word, and searches the hint too', () => {
    expect(labels('grand a:11')).toEqual(['Sunday Grand']);
    expect(labels('grand organ')).toEqual([]);
  });

  it('ignores case and extra spaces', () => {
    expect(labels('  BIG  ')).toEqual(['Big Organ']);
  });
});
