import { describe, it, expect } from 'vitest';
import { cloudEntryBase, cloudEntryId, cloudItemsOf, extensionOf } from './cloud-entries';

const items = [
  { fingerprint: 'x1', kind: 'program' as const, filename: 'Warm Pad.ns4p', slot: 'A:11' },
  { fingerprint: 'x2', kind: 'sample' as const, filename: 'Flute.NSMP4' },
];

describe('cloud entries', () => {
  it('ids a cloud entry by its fingerprint', () => {
    expect(cloudEntryId('x1')).toBe('cloud:x1');
    expect(cloudEntryBase(items[0])).toEqual({ id: 'cloud:x1', name: 'Warm Pad', source: 'cloud', fingerprint: 'x1', slot: 'A:11' });
  });
  it('picks the items of one kind', () => {
    expect(cloudItemsOf(items, 'sample').map((i) => i.fingerprint)).toEqual(['x2']);
  });
  it('lists a file kept in two slots once', () => {
    const twice = [...items, { ...items[0], slot: 'A:12' }];
    expect(cloudItemsOf(twice, 'program')).toEqual([items[0]]);
  });
  it('reads a filename’s extension in lower case, or nothing', () => {
    expect(extensionOf('Flute.NSMP4')).toBe('nsmp4');
    expect(extensionOf('noext')).toBeUndefined();
  });
});
