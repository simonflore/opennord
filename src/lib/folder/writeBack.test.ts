import { describe, it, expect } from 'vitest';
import { resolveWriteName } from './writeBack';

describe('resolveWriteName', () => {
  it('overwrite keeps the name', () => {
    expect(resolveWriteName('Backup.ns4b', 'overwrite', new Set(['Backup.ns4b']))).toBe('Backup.ns4b');
  });
  it('new uniquifies against existing names', () => {
    expect(resolveWriteName('Backup.ns4b', 'new', new Set(['Backup.ns4b']))).toBe('Backup (2).ns4b');
    expect(resolveWriteName('Backup.ns4b', 'new', new Set(['Backup.ns4b', 'Backup (2).ns4b']))).toBe('Backup (3).ns4b');
  });
  it('new leaves a free name untouched', () => {
    expect(resolveWriteName('New.nsmp', 'new', new Set())).toBe('New.nsmp');
  });
});
