import { describe, it, expect } from 'vitest';
import { audioToShare } from './share-audio';

const on = { available: true, samples: true };
const file = { id: 'folder:a', name: 'A', bytes: new Uint8Array(4), source: 'local' as const };

describe('audioToShare', () => {
  it('offers sharing for a file of your own, where samples can be shared', () => {
    expect(audioToShare(on, file)).toEqual(file);
    expect(audioToShare(on, { ...file, id: 'backup:1:a', source: 'backup' })?.id).toBe('backup:1:a');
  });
  it('offers none without the community, without the samples switch, or without the bytes', () => {
    expect(audioToShare({ available: false, samples: true }, file)).toBeUndefined();
    expect(audioToShare({ available: true }, file)).toBeUndefined();
    expect(audioToShare(on, { id: 'folder:a', name: 'A', source: 'local' })).toBeUndefined();
  });
  it('offers none for one on the Nord, or for factory content', () => {
    expect(audioToShare(on, { ...file, source: 'nord' })).toBeUndefined();
    expect(audioToShare(on, { ...file, factory: { filename: 'x.npno' } })).toBeUndefined();
    expect(audioToShare(on, { ...file, isFactory: true })).toBeUndefined();
  });
  it('shares the copy on this computer of a row found in several places', () => {
    const row = { ...file, members: [{ id: 'folder:a', source: 'local' as const, name: 'A' }, { id: 'nord:A:11', source: 'nord' as const, name: 'A' }] };
    expect(audioToShare(on, row)?.id).toBe('folder:a');
  });
});
