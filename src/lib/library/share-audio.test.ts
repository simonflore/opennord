import { describe, it, expect } from 'vitest';
import { canShareAudio } from './share-audio';

const on = { available: true, samples: true };
const file = { bytes: new Uint8Array(4), source: 'local' as const };

describe('canShareAudio', () => {
  it('offers sharing for a file of your own, where samples can be shared', () => {
    expect(canShareAudio(on, file)).toBe(true);
  });
  it('offers none without the community, without the samples switch, or without the bytes', () => {
    expect(canShareAudio({ available: false, samples: true }, file)).toBe(false);
    expect(canShareAudio({ available: true }, file)).toBe(false);
    expect(canShareAudio(on, { source: 'local' })).toBe(false);
  });
  it('offers none for one on the Nord, or for factory content', () => {
    expect(canShareAudio(on, { ...file, source: 'nord' })).toBe(false);
    expect(canShareAudio(on, { ...file, factory: { filename: 'x.npno' } })).toBe(false);
    expect(canShareAudio(on, { ...file, isFactory: true })).toBe(false);
  });
});
