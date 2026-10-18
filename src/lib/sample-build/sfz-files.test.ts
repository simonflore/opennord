import { describe, it, expect } from 'vitest';
import { normalisePath, sampleResolver } from './sfz-files';

describe('sampleResolver', () => {
  const resolveSample = sampleResolver(['Grand/Grand.sfz', 'Grand/Samples/C4v1.wav', 'Grand/Samples/D4v1.wav', 'Other/D4v1.wav']);

  it('finds a recording relative to the instrument\'s folder, whatever the case and separators', () => {
    expect(resolveSample('Grand/Grand.sfz', 'samples\\c4V1.WAV')).toBe('Grand/Samples/C4v1.wav');
    expect(resolveSample('Grand/Sub/x.sfz', '../Samples/C4v1.wav')).toBe('Grand/Samples/C4v1.wav');
  });

  it('falls back to the only file of that name, and gives up when two share it', () => {
    expect(resolveSample('Grand/Grand.sfz', 'elsewhere/C4v1.wav')).toBe('Grand/Samples/C4v1.wav');
    expect(resolveSample('Grand/Grand.sfz', 'elsewhere/D4v1.wav')).toBeUndefined();
  });

  it('normalises paths', () => {
    expect(normalisePath('A\\b/./c/../D.wav')).toBe('a/b/d.wav');
  });
});
