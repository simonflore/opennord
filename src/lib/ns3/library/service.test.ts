import { describe, it, expect } from 'vitest';
import { resolveSample } from './service';

describe('resolveSample', () => {
  it('resolves a known factory sampleId to its name + version', () => {
    // First documented entry of the Nord piano library (Soft Grand Sml 6.2).
    const r = resolveSample(0x3aa416ef);
    expect(r?.name).toBe('Soft Grand Sml');
    expect(r?.version).toBe('v6.2');
  });

  it('returns null for an unknown sampleId', () => {
    expect(resolveSample(0x1)).toBeNull();
  });
});
