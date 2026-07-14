import { describe, it, expect } from 'vitest';
import { parseNs4Preset } from './preset';
import { buildCbinHeader } from '../clavia/cbin';

/** A minimal Stage 4 preset: a real CBIN header of `tag` over a zeroed body of
 *  `size` bytes (the true fixed sizes: ns4o 183, ns4n 195, ns4y 541). Body stays
 *  zero — enough to exercise the shift/decode wiring without shipping factory
 *  content (the real factory presets are gitignored). Value correctness is
 *  validated separately against those fixtures; see preset.ts. */
function preset(tag: string, size: number): Uint8Array {
  const buf = new Uint8Array(size);
  buf.set(buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw: 205 }), 0);
  return buf;
}

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
