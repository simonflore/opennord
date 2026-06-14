import { describe, it, expect } from 'vitest';
import { classifyFile } from './classify';

describe('classifyFile', () => {
  it('recognizes program & preset extensions', () => {
    expect(classifyFile('My Patch.ns4p')).toBe('program');
    expect(classifyFile('x.ns4l')).toBe('program');
    expect(classifyFile('organ.ns4o')).toBe('program');
    expect(classifyFile('piano.ns4n')).toBe('program');
    expect(classifyFile('synth.ns4y')).toBe('program');
  });

  it('recognizes bundles and samples', () => {
    expect(classifyFile('backup.ns4b')).toBe('bundle');
    expect(classifyFile('snare.nsmp')).toBe('sample');
    expect(classifyFile('snare.nsmp3')).toBe('sample');
    expect(classifyFile('snare.nsmp4')).toBe('sample');
  });

  it('is case-insensitive and path-aware, ignores others', () => {
    expect(classifyFile('Bank 1/Lead.NS4P')).toBe('program');
    expect(classifyFile('notes.txt')).toBeNull();
    expect(classifyFile('folder/')).toBeNull();
  });
});
