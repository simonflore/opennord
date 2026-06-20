import { describe, it, expect } from 'vitest';
import { identifyNordFile } from './nord-file';

/** Build a minimal CBIN header for testing (tag @+0x08, fields per docs/FORMAT.md). */
function cbin(tag: string, formatType: number, f: { bank?: number; loc?: number; cat?: number; ver?: number } = {}): Uint8Array {
  const b = new Uint8Array(64);
  b.set([0x43, 0x42, 0x49, 0x4e]); // "CBIN"
  b[0x04] = formatType;
  for (let i = 0; i < tag.length; i++) b[0x08 + i] = tag.charCodeAt(i);
  b[0x0c] = f.bank ?? 0;
  b[0x0e] = f.loc ?? 0;
  b[0x10] = f.cat ?? 0;
  b[0x14] = (f.ver ?? 0) & 0xff;
  b[0x15] = ((f.ver ?? 0) >> 8) & 0xff;
  return b;
}

describe('identifyNordFile', () => {
  it('names a whole-line model from the registry (Electro 6) + NSM header fields', () => {
    const info = identifyNordFile(cbin('ne6p', 1, { bank: 5, loc: 19, ver: 102 }));
    expect(info).toMatchObject({
      recognized: true, tag: 'ne6p', kind: 'program',
      modelId: 'electro-6', modelName: 'Nord Electro 6', modelGeneration: 'NW1-v3',
    });
    expect(info.slot).toBe('F:34');     // shared NSM-era header decode
    expect(info.version).toBe('1.02');
  });

  it('decodes a Stage 3 (ns3f, NSM-era) header — slot/category/version', () => {
    const info = identifyNordFile(cbin('ns3f', 1, { bank: 5, loc: 19, cat: 21, ver: 304 }));
    expect(info).toMatchObject({
      recognized: true, tag: 'ns3f', generation: 'Stage 3', kind: 'performance',
      formatType: 1, headerDecoded: true, version: '3.04', fullyDecoded: false,
    });
    expect(info.slot).toBe('F:34'); // formatSlot(5, 19)
    expect(info.category).toBe(21);
  });

  it('decodes the Stage 2 (ns2p, legacy format 0) header — raw slot + shared category, no version', () => {
    // RE'd by diffing 6 real .ns2p: location is the raw program number (SUMMER 69
    // → slot 69), category shares the enum (12 = Synth), 0x14 is not the version.
    const info = identifyNordFile(cbin('ns2p', 0, { bank: 3, loc: 69, cat: 12, ver: 6 }));
    expect(info).toMatchObject({ recognized: true, generation: 'Stage 2', kind: 'program', formatType: 0, headerDecoded: true, fullyDecoded: false });
    expect(info.slot).toBe('D:69');          // raw location, not the NSM page-encoding
    expect(info.categoryName).toBe('Synth');
    expect(info.version).toBeUndefined();    // legacy header has no OS version here
  });

  it('marks a Stage 4 program fully decodable', () => {
    const info = identifyNordFile(cbin('ns4p', 1, { bank: 7, loc: 81, cat: 0, ver: 313 }));
    expect(info.generation).toBe('Stage 4');
    expect(info.fullyDecoded).toBe(true);
    expect(info.version).toBe('3.13');
  });

  it('reports non-CBIN data as unrecognized', () => {
    const info = identifyNordFile(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    expect(info.recognized).toBe(false);
    expect(info.generation).toBe('unknown');
  });

  // Tier A librarian fix (2026-06-20): ne4p/ne5p use the legacy (formatType 0) header
  // layout, same as ns2p — but generationOf() returns 'unknown' for them, so the
  // legacy decode branch (else if generation === 'Stage 2') was never reached.
  // Fix: key the legacy branch on formatType === 0, not generation === 'Stage 2'.
  it('decodes ne5p (Electro 5, legacy formatType 0) header — slot/category, no version', () => {
    // Synthetic buffer: formatType 0 @ 0x04, tag 'ne5p', bank 2, loc 20, cat 0xFF (sentinel)
    // Mirrors the real fixture layout (confirmed from fixtures/electro-5/*.ne5p).
    // category 0xFF means "not set" in this format — should survive and not be overridden.
    const b = cbin('ne5p', 0, { bank: 2, loc: 20, cat: 0xff });
    const info = identifyNordFile(b);
    expect(info).toMatchObject({
      recognized: true, tag: 'ne5p', kind: 'program',
      formatType: 0, headerDecoded: true, fullyDecoded: false,
    });
    // category sentinel 0xFF should be present (not undefined — the field IS decoded)
    expect(info.category).toBe(0xff);
    // categoryName for 0xFF is undefined (not in the table) — that's correct
    expect(info.categoryName).toBeUndefined();
    // ne5p uses sequential 1-based slot display: loc 20 → C:21 (electro5Slot)
    expect(info.slot).toBe('C:21');
    // legacy header has no firmware version field — version must be undefined
    expect(info.version).toBeUndefined();
  });

  it('decodes ne4p (Electro 4, legacy formatType 0) header — slot/real category, no version', () => {
    // Synthetic buffer: formatType 0 @ 0x04, tag 'ne4p', bank 0, loc 40, cat 14 (User)
    // Mirrors the real fixture (fixtures/electro-4/Infectd Square 1 FS.ne4p).
    const b = cbin('ne4p', 0, { bank: 0, loc: 40, cat: 14 });
    const info = identifyNordFile(b);
    expect(info).toMatchObject({
      recognized: true, tag: 'ne4p', kind: 'program',
      formatType: 0, headerDecoded: true, fullyDecoded: false,
    });
    expect(info.category).toBe(14);
    expect(info.categoryName).toBe('User');
    expect(info.slot).toBe('A:40');
    expect(info.version).toBeUndefined();
  });

  // Tier A lead-4 wiring fix (2026-06-20): lead4Slot must be called for nl4p so the
  // product emits the same 1-based sequential string that the unit test validates.
  // Before this fix, identifyNordFile returned the raw 'B:41' (bank:location) instead
  // of the correct 'B:42' (lead4Slot sequential-1-based); the function was dead code.
  it('decodes nl4p (Lead 4, legacy formatType 0) header — 1-based sequential slot via lead4Slot', () => {
    // Synthetic: bank 1, loc 41, cat 7 (Pad). Matches the fixture comment in slot.ts:
    //   lead4Slot(1, 41) → "B:42"  (not the raw "B:41")
    const b = cbin('nl4p', 0, { bank: 1, loc: 41, cat: 7 });
    const info = identifyNordFile(b);
    expect(info).toMatchObject({
      recognized: true, tag: 'nl4p', kind: 'program',
      formatType: 0, headerDecoded: true, fullyDecoded: false,
      modelId: 'lead-4', modelName: 'Nord Lead 4',
    });
    // lead4Slot(1, 41) → "B:42" — 1-based sequential, NOT raw "B:41"
    expect(info.slot).toBe('B:42');
    expect(info.version).toBeUndefined();
  });
});
