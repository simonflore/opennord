import { describe, it, expect } from 'vitest';
import { readSampleName, resolveNs3SampleByName } from './sample-name';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a synthetic byte buffer with the `hdr` marker at hdrAt, followed by
 * enough preamble so the name lands at hdrAt + 0x15 (as the spec requires),
 * then a null-terminated ASCII name.
 *
 * Layout: [hdrAt bytes of leading zeros] [hdr(3)] [0x12 bytes of 0xaa filler]
 *         [nameBytes] [0x00]
 *
 * hdrAt + 0 .. hdrAt+2  → 'hdr'
 * hdrAt + 3 .. hdrAt+20 → 0xaa filler  (18 bytes, 0x12)
 * hdrAt + 21 = hdrAt + 0x15 → name start
 */
function makeHdrBuffer(name: string, hdrAt = 0): Uint8Array {
  const HDR_BYTES = [0x68, 0x64, 0x72]; // 'hdr'
  const NAME_OFFSET = 0x15; // offset from hdrIndex to name start
  const PREAMBLE_LEN = NAME_OFFSET - HDR_BYTES.length; // 0x12 = 18 bytes
  const nameBytes = [...name].map(c => c.charCodeAt(0));
  const totalLen = hdrAt + HDR_BYTES.length + PREAMBLE_LEN + nameBytes.length + 1;
  const buf = new Uint8Array(totalLen); // zero-filled
  for (let i = 0; i < HDR_BYTES.length; i++) buf[hdrAt + i] = HDR_BYTES[i];
  for (let i = 0; i < PREAMBLE_LEN; i++) buf[hdrAt + HDR_BYTES.length + i] = 0xaa;
  for (let i = 0; i < nameBytes.length; i++) buf[hdrAt + NAME_OFFSET + i] = nameBytes[i];
  // NUL terminator is already 0x00 from Uint8Array init
  return buf;
}

// ---------------------------------------------------------------------------
// readSampleName
// ---------------------------------------------------------------------------

describe('readSampleName', () => {
  it('extracts name from buffer with hdr at offset 0', () => {
    const buf = makeHdrBuffer('My Factory Pad');
    expect(readSampleName(buf)).toBe('My Factory Pad');
  });

  it('extracts name when hdr is preceded by leading bytes', () => {
    const buf = makeHdrBuffer('SomeSample', 16);
    expect(readSampleName(buf)).toBe('SomeSample');
  });

  it('returns empty string when no hdr marker is present', () => {
    const buf = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd]);
    expect(readSampleName(buf)).toBe('');
  });

  it('returns empty string when name field is empty (immediate NUL at hdrIndex+0x15)', () => {
    // Name at hdrIndex + 0x15 = position 21; total buffer = 3 (hdr) + 18 (preamble) + 1 (NUL)
    const buf = new Uint8Array(3 + 18 + 1);
    buf[0] = 0x68; buf[1] = 0x64; buf[2] = 0x72; // 'hdr'
    // Positions 3..20 are preamble (zeros), position 21 is NUL terminator (already 0)
    expect(readSampleName(buf)).toBe('');
  });

  it('returns empty string when name contains a non-ASCII byte', () => {
    // Buffer: hdr(3) + preamble(18) + 'A'(1) + 0x80(1) + 'B'(1) + NUL(1)
    const buf = new Uint8Array(3 + 18 + 4);
    buf[0] = 0x68; buf[1] = 0x64; buf[2] = 0x72; // 'hdr'
    // Name starts at hdrIndex + 0x15 = 21
    buf[21] = 0x41; // 'A'
    buf[22] = 0x80; // non-ASCII → implementation must bail
    buf[23] = 0x42; // 'B'
    expect(readSampleName(buf)).toBe('');
  });

  it('returns empty string when hdr is beyond the 512-byte search window', () => {
    const buf = new Uint8Array(600);
    // Place hdr at byte 513 — outside the search window
    buf[513] = 0x68; buf[514] = 0x64; buf[515] = 0x72;
    buf[513 + 0x15 + 3] = 0x53; // 'S'
    expect(readSampleName(buf)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// resolveNs3SampleByName
// ---------------------------------------------------------------------------

describe('resolveNs3SampleByName', () => {
  it('resolves "3 Violins Mellotron" to a factory entry', () => {
    const result = resolveNs3SampleByName('3 Violins Mellotron');
    expect(result).not.toBeNull();
    expect(result!.sampleId).toBeTypeOf('number');
    expect(result!.name).toBe('3 Violins Mellotron');
  });

  it('resolves "Bandoneon" to a factory entry', () => {
    const result = resolveNs3SampleByName('Bandoneon');
    expect(result).not.toBeNull();
    expect(result!.sampleId).toBeTypeOf('number');
    expect(result!.name).toBe('Bandoneon');
  });

  it('returns null for "Converted" (not a catalog entry)', () => {
    expect(resolveNs3SampleByName('Converted')).toBeNull();
  });

  it('returns null for a completely made-up name', () => {
    expect(resolveNs3SampleByName('Totally Made Up Sample XYZ')).toBeNull();
  });

  it('is case-insensitive', () => {
    const upper = resolveNs3SampleByName('BANDONEON');
    expect(upper).not.toBeNull();
    expect(upper!.name).toBe('Bandoneon');
  });

  it('trims whitespace before matching', () => {
    const result = resolveNs3SampleByName('  Bandoneon  ');
    expect(result).not.toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveNs3SampleByName('')).toBeNull();
  });

  it('returned entry has sampleId, name, and optionally info/version', () => {
    const result = resolveNs3SampleByName('3 Violins Mellotron');
    expect(result).not.toBeNull();
    expect(typeof result!.sampleId).toBe('number');
    expect(typeof result!.name).toBe('string');
    // info and version are optional but should be strings when present
    if (result!.info !== undefined) expect(typeof result!.info).toBe('string');
    if (result!.version !== undefined) expect(typeof result!.version).toBe('string');
  });
});
