import { describe, it, expect } from 'vitest';
import { parseNs4Preset } from './preset';
import { blankPreset as preset } from './gt-fixtures';

describe('parseNs4Preset', () => {
  it('decodes an organ preset (.ns4o) with drawbars', () => {
    const p = parseNs4Preset(preset('ns4o', 183));
    expect(p?.engine).toBe('organ');
    expect(p?.layers.length).toBeGreaterThanOrEqual(1);
    const names = p!.layers[0].rows.map((r) => r.name);
    expect(names).toContain('organ model');
    expect(names).toContain('drawbar 1');
    expect(names).toContain('drawbar 9');
  });

  it('decodes a piano preset (.ns4n)', () => {
    const p = parseNs4Preset(preset('ns4n', 195));
    expect(p?.engine).toBe('piano');
    expect(p!.layers[0].rows.map((r) => r.name)).toContain('piano type');
  });

  it('decodes a synth preset (.ns4y) with a filter', () => {
    const p = parseNs4Preset(preset('ns4y', 541));
    expect(p?.engine).toBe('synth');
    expect(p!.layers[0].rows.map((r) => r.name)).toContain('filter type');
  });

  it('exposes one layer per enabled voice (A/B/C), each with rows', () => {
    const p = parseNs4Preset(preset('ns4y', 541));
    expect(p!.layers.every((l) => ['A', 'B', 'C'].includes(l.letter))).toBe(true);
    expect(p!.layers[0].rows.length).toBeGreaterThan(0);
  });

  it('returns null for a program, a sample, or an older-generation preset', () => {
    expect(parseNs4Preset(preset('ns4p', 868))).toBeNull(); // full program, not a preset
    expect(parseNs4Preset(preset('ns3y', 200))).toBeNull(); // Stage 3 preset — not decoded here
    expect(parseNs4Preset(new Uint8Array(64))).toBeNull();  // not a CBIN file
  });
});
