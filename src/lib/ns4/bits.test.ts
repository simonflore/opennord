import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bytesToBitString, fileTypeTag, hasCbinMagic, locToBit, bitToLoc, readField } from './bits';
import { buildParamMap } from './maps';
import { decodeAllParams } from './coverage';

// The real ns4decode regression fixture (a genuine Nord Stage 4 program) — our
// ground truth. Expected values cross-checked against ns4decode's own CSV output.
const bytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))),
);

describe('bits engine — validated against the ns4decode regression fixture', () => {
  it('recognizes the file magic and type', () => {
    expect(bytes.length).toBe(868);
    expect(hasCbinMagic(bytes)).toBe(true);
    expect(fileTypeTag(bytes)).toBe('ns4p');
  });

  it('round-trips location strings <-> absolute bit indices', () => {
    expect(locToBit('009-1')).toBe(64);
    expect(bitToLoc(64)).toBe('009-1');
    expect(locToBit('025-1')).toBe(192);
    expect(locToBit('028-8')).toBe(223);
  });

  it('reads in-byte and 32-bit cross-byte fields correctly', () => {
    const bits = bytesToBitString(bytes);
    // bank = H (0-7 => A-H), from master map 013-6..013-8
    expect(readField(bits, locToBit('013-6'), locToBit('013-8'))).toBe(7);
    // 32-bit checksum from 025-1..028-8 — matches the expected CSV exactly
    expect(readField(bits, locToBit('025-1'), locToBit('028-8'))).toBe(2872364241);
  });
});

describe('ported param map decodes the fixture', () => {
  const decoded = decodeAllParams(bytes, buildParamMap());
  const valueOf = (name: string) => decoded.find((d) => d.name === name)?.value;

  it('decodes master fields to their expected values', () => {
    expect(valueOf('file type')).toBe(readFieldAscii('ns4p'));
    expect(valueOf('bank')).toBe(7);
    expect(valueOf('checksum')).toBe(2872364241);
  });

  it('produces a non-trivial set of parameters (master + piano + FX)', () => {
    expect(decoded.length).toBeGreaterThan(20);
  });
});

/** "ns4p" as the integer its 32 bits would decode to (for the 'file type' field). */
function readFieldAscii(s: string): number {
  let v = 0;
  for (const ch of s) v = v * 256 + ch.charCodeAt(0);
  return v;
}
