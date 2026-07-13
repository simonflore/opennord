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
  it('decodes an organ preset (.ns4o) into the Organ section with drawbars', () => {
    const p = parseNs4Preset(preset('ns4o', 183));
    expect(p?.engine).toBe('organ');
    expect(p?.groups.map((g) => g.label)).toEqual(['Organ']);
    const names = p!.rows.map((r) => r.name);
    expect(names).toContain('organ model');
    expect(names).toContain('drawbar 1');
    expect(names).toContain('drawbar 9');
  });

  it('decodes a piano preset (.ns4n) into the Piano section', () => {
    const p = parseNs4Preset(preset('ns4n', 195));
    expect(p?.engine).toBe('piano');
    expect(p?.groups.map((g) => g.label)).toEqual(['Piano']);
    expect(p!.rows.map((r) => r.name)).toContain('piano type');
  });

  it('decodes a synth preset (.ns4y) into the Synth section with a filter', () => {
    const p = parseNs4Preset(preset('ns4y', 541));
    expect(p?.engine).toBe('synth');
    expect(p?.groups.map((g) => g.label)).toEqual(['Synth']);
    expect(p!.rows.map((r) => r.name)).toContain('filter type');
  });

  it('builds a headline for organ (model · drawbars)', () => {
    const p = parseNs4Preset(preset('ns4o', 183));
    // Zeroed body → the first enum value; the point is the shape is populated.
    expect(p?.headline).toMatch(/·/);
  });

  it('returns null for a program, a sample, or an older-generation preset', () => {
    expect(parseNs4Preset(preset('ns4p', 868))).toBeNull(); // full program, not a preset
    expect(parseNs4Preset(preset('ns3y', 200))).toBeNull(); // Stage 3 preset — not decoded here
    expect(parseNs4Preset(new Uint8Array(64))).toBeNull();  // not a CBIN file
  });
});
