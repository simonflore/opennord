import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseClaviaFile } from './formats';
import { parseNs4Program } from './ns4/parse';

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(fileURLToPath(new URL(`./ns4/__fixtures__/${name}`, import.meta.url))));
}

/** Minimal CBIN header with a given tag + format type (per docs/FORMAT.md). */
function cbin(tag: string, formatType: number, ver = 0): Uint8Array {
  const b = new Uint8Array(64);
  b.set([0x43, 0x42, 0x49, 0x4e]); // "CBIN"
  b[0x04] = formatType;
  for (let i = 0; i < tag.length; i++) b[0x08 + i] = tag.charCodeAt(i);
  b[0x14] = ver & 0xff;
  b[0x15] = (ver >> 8) & 0xff;
  return b;
}

describe('parseClaviaFile', () => {
  it('routes a Stage 4 program to the ns4 codec and decodes it fully', () => {
    const bytes = fixture('BreakFreeSolo.ns4p');
    const file = parseClaviaFile(bytes);
    expect(file.model).toBe('ns4');
    expect(file.info.generation).toBe('Stage 4');
    expect(file.program.parsed).toBe(true);
  });

  it('is byte-identical to parseNs4Program for a Stage 4 program (zero behavior change)', () => {
    const bytes = fixture('BreakFreeSolo.ns4p');
    // Same decoded structure as the direct parser the codec wraps.
    expect(JSON.stringify(parseClaviaFile(bytes).program, skipBytes))
      .toEqual(JSON.stringify(parseNs4Program(bytes), skipBytes));
  });

  it('recognizes a Stage 3 file by generation but returns the unparsed shell (no ns3 codec yet)', () => {
    const file = parseClaviaFile(cbin('ns3f', 1, 304));
    expect(file.model).toBe('ns3');
    expect(file.info.generation).toBe('Stage 3');
    expect(file.program.parsed).toBe(false); // Tier 2 will decode this
  });

  it('reports unknown for a non-CBIN blob', () => {
    const file = parseClaviaFile(new Uint8Array([1, 2, 3, 4]));
    expect(file.model).toBe('unknown');
    expect(file.info.recognized).toBe(false);
  });
});

function skipBytes(k: string, v: unknown): unknown {
  return k === 'bytes' ? undefined : v;
}
