import { describe, it, expect } from 'vitest';
import { classifyFile } from './classify';

describe('classifyFile', () => {
  it('recognizes program extensions', () => {
    expect(classifyFile('My Patch.ns4p')).toBe('program');
    expect(classifyFile('x.ns4l')).toBe('program');
  });

  it('recognizes bundles and samples', () => {
    expect(classifyFile('backup.ns4b')).toBe('bundle');
    expect(classifyFile('snare.nsmp')).toBe('sample');
    expect(classifyFile('snare.nsmp3')).toBe('sample');
    expect(classifyFile('snare.nsmp4')).toBe('sample');
    expect(classifyFile('Clavinet D6 6.1.npno')).toBe('piano');
  });

  it('is case-insensitive and path-aware, ignores others', () => {
    expect(classifyFile('Bank 1/Lead.NS4P')).toBe('program');
    expect(classifyFile('notes.txt')).toBeNull();
    expect(classifyFile('folder/')).toBeNull();
  });

  it('classifies .npno as piano, no longer as sample', () => {
    expect(classifyFile('Lib/Grand Lady D.npno')).toBe('piano');
    expect(classifyFile('s.nsmp4')).toBe('sample');   // other samples unchanged
    expect(classifyFile('p.ns4p')).toBe('program');
  });

  it('classifies organ/piano/synth preset files as preset, not program', () => {
    expect(classifyFile('Bank A/Lead.ns4o')).toBe('preset');
    expect(classifyFile('Bank A/Grand.ns4n')).toBe('preset');
    expect(classifyFile('Bank A/Pad.ns4y')).toBe('preset');
    expect(classifyFile('legacy.ns3y')).toBe('preset');
    expect(classifyFile('Prog.ns4p')).toBe('program'); // program unchanged
    expect(classifyFile('Lead4Patch.nl4s')).not.toBe('preset');
  });
});
