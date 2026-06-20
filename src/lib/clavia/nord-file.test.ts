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
  it('decodes a Stage 3 (ns3f, NSM-era) header — slot/category/version', () => {
    const info = identifyNordFile(cbin('ns3f', 1, { bank: 5, loc: 19, cat: 21, ver: 304 }));
    expect(info).toMatchObject({
      recognized: true, tag: 'ns3f', generation: 'Stage 3', kind: 'performance',
      formatType: 1, headerDecoded: true, version: '3.04', fullyDecoded: false,
    });
    expect(info.slot).toBe('F:34'); // formatSlot(5, 19)
    expect(info.category).toBe(21);
  });

  it('recognizes Stage 2 (ns2p, legacy format 0) but leaves the legacy header undecoded', () => {
    const info = identifyNordFile(cbin('ns2p', 0, { bank: 3, loc: 69, ver: 6 }));
    expect(info).toMatchObject({ recognized: true, generation: 'Stage 2', kind: 'program', formatType: 0, headerDecoded: false, fullyDecoded: false });
    // legacy fields are not surfaced (would be wrong — e.g. version read as 0.06)
    expect(info.version).toBeUndefined();
    expect(info.slot).toBeUndefined();
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
});
