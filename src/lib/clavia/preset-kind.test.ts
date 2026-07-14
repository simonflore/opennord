import { describe, it, expect } from 'vitest';
import { presetKindForTag } from './preset-kind';

describe('presetKindForTag', () => {
  it('maps Stage-line preset tags to their kind', () => {
    expect(presetKindForTag('ns4o')).toBe('organ-preset');
    expect(presetKindForTag('ns4n')).toBe('piano-preset');
    expect(presetKindForTag('ns4y')).toBe('synth-preset');
    expect(presetKindForTag('ns3y')).toBe('synth-preset');
    expect(presetKindForTag('ns2y')).toBe('synth-preset');
  });
  it('does not treat nl4s (Lead programs) or program tags as presets', () => {
    expect(presetKindForTag('nl4s')).toBeUndefined();
    expect(presetKindForTag('ns4p')).toBeUndefined();
    expect(presetKindForTag('NS4O')).toBe('organ-preset'); // case-insensitive
  });
});
