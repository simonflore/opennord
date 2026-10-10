import { describe, it, expect } from 'vitest';
import { presetKindForTag } from './preset-kind';
import { MODELS } from './partitions';

describe('presetKindForTag', () => {
  it('maps Stage-line preset tags to their kind', () => {
    expect(presetKindForTag('ns4o')).toBe('organ-preset');
    expect(presetKindForTag('ns4n')).toBe('piano-preset');
    expect(presetKindForTag('ns4y')).toBe('synth-preset');
    expect(presetKindForTag('ns3y')).toBe('synth-preset');
    expect(presetKindForTag('ns2s')).toBe('synth-preset'); // Stage 2 Synth (OS 3.00 FUN_3007046c)
  });
  it('does not treat nl4s (Lead programs) or program tags as presets', () => {
    expect(presetKindForTag('nl4s')).toBeUndefined();
    expect(presetKindForTag('ns4p')).toBeUndefined();
    expect(presetKindForTag('NS4O')).toBe('organ-preset'); // case-insensitive
  });
  it('does not treat Stage 2 Settings (ns2y) or Stage 3 Songs (ns3s) as presets', () => {
    expect(presetKindForTag('ns2y')).toBeUndefined();
    expect(presetKindForTag('ns3s')).toBeUndefined();
  });
  it('agrees with the partition registry for every Stage-line partition fourcc', () => {
    for (const id of ['stage-2', 'stage-2-ex', 'stage-3', 'stage-4'] as const) {
      for (const p of MODELS[id].partitions) {
        if (!p.fourcc) continue;
        const isPreset = p.kind === 'organ-preset' || p.kind === 'piano-preset' || p.kind === 'synth-preset';
        expect(presetKindForTag(p.fourcc), `${id} ${p.fourcc}`).toBe(isPreset ? p.kind : undefined);
      }
    }
  });
});
