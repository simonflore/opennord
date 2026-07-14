import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeNs4Checksum, verifyNs4Checksum, patchNs4Checksum } from './checksum';

function loadFixture(filename: string): Uint8Array {
  return new Uint8Array(
    readFileSync(fileURLToPath(new URL(`../ns4/__fixtures__/${filename}`, import.meta.url))),
  );
}

// Expected checksums verified by Python: zlib.crc32(data[44:]) & 0xFFFFFFFF
// and cross-checked against bytes[24:28] (little-endian) in the real files.
const FIXTURES: [string, number][] = [
  ['regressionTest.ns4p', 0xd1cc34ab],
  ['BreakFreeSolo.ns4p',   0xa53f3c54],
  ['BreakFree_chords.ns4p', 0x314a6bfe],
];

describe('computeNs4Checksum', () => {
  for (const [file, expected] of FIXTURES) {
    it(`matches stored value for ${file}`, () => {
      const bytes = loadFixture(file);
      expect(computeNs4Checksum(bytes)).toBe(expected);
    });
  }
});

describe('verifyNs4Checksum', () => {
  for (const [file] of FIXTURES) {
    it(`returns true for unmodified ${file}`, () => {
      expect(verifyNs4Checksum(loadFixture(file))).toBe(true);
    });
  }

  it('returns false when checksum byte is flipped', () => {
    const bytes = loadFixture('regressionTest.ns4p');
    bytes[24] ^= 0xff; // corrupt one byte of the stored checksum
    expect(verifyNs4Checksum(bytes)).toBe(false);
  });

  it('returns false for a buffer shorter than the header', () => {
    expect(verifyNs4Checksum(new Uint8Array([1, 2, 3]))).toBe(false);
  });
});

describe('patchNs4Checksum', () => {
  it('produces a buffer that passes verification after zeroing the checksum field', () => {
    const original = loadFixture('regressionTest.ns4p');
    const corrupted = new Uint8Array(original);
    corrupted[24] = corrupted[25] = corrupted[26] = corrupted[27] = 0;
    expect(verifyNs4Checksum(corrupted)).toBe(false);
    const fixed = patchNs4Checksum(corrupted);
    expect(verifyNs4Checksum(fixed)).toBe(true);
  });

  it('does not modify the input buffer', () => {
    const bytes = loadFixture('regressionTest.ns4p');
    const snapshot = bytes.slice();
    patchNs4Checksum(bytes);
    expect(bytes).toEqual(snapshot);
  });

  it('returns the correct checksum value in the output', () => {
    const bytes = loadFixture('BreakFreeSolo.ns4p');
    const patched = patchNs4Checksum(bytes);
    const stored =
      patched[24] | (patched[25] << 8) | (patched[26] << 16) | (patched[27] << 24);
    expect(stored >>> 0).toBe(0xa53f3c54);
  });
});
