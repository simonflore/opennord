import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { crc16ccitt, sealTrailerChecksum, storedTrailerChecksum, verifyTrailerChecksum } from './crc16';

/** The textbook bit-by-bit CRC-16/CCITT-FALSE, as a reference for the table-driven one. */
function bitwise(data: Uint8Array): number {
  let crc = 0xffff;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

const noise = (n: number, seed = 1) => {
  let s = seed;
  return Uint8Array.from({ length: n }, () => (s = (s * 1103515245 + 12345) & 0x7fffffff) >> 16);
};

describe('crc16ccitt', () => {
  it('matches the CRC-16/CCITT-FALSE check value', () => {
    expect(crc16ccitt(new TextEncoder().encode('123456789'))).toBe(0x29b1);
  });

  it('matches the bit-by-bit definition on every byte value and on noise', () => {
    expect(crc16ccitt(Uint8Array.from({ length: 256 }, (_, i) => i))).toBe(bitwise(Uint8Array.from({ length: 256 }, (_, i) => i)));
    for (const n of [0, 1, 2, 7, 1000, 65537]) expect(crc16ccitt(noise(n, n + 1))).toBe(bitwise(noise(n, n + 1)));
  });

  it('continues a running CRC across slices', () => {
    const data = noise(100_000);
    let crc = 0xffff;
    for (let at = 0; at < data.length; at += 7777) crc = crc16ccitt(data.subarray(at, at + 7777), crc);
    expect(crc).toBe(crc16ccitt(data));
  });

  it('seals a trailer in place', () => {
    const file = noise(5000);
    expect(sealTrailerChecksum(file)).toBe(file);
    expect(verifyTrailerChecksum(file)).toBe(true);
    expect(storedTrailerChecksum(file)).toBe(crc16ccitt(file.subarray(0, 4998)));
    expect(() => sealTrailerChecksum(new Uint8Array(2))).toThrow();
  });

  it('verifies a synthetic LE trailer', () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const crc = crc16ccitt(payload);
    const file = new Uint8Array([...payload, crc & 0xff, crc >> 8]);
    expect(verifyTrailerChecksum(file)).toBe(true);
    file[0] ^= 0xff;
    expect(verifyTrailerChecksum(file)).toBe(false);
  });
});

// Corpus proof of the shared legacy trailer convention: LE CRC-16/CCITT-FALSE
// over the whole file except the final 2 bytes closes .nwp, .nl4s/.nl4p and
// .nlas/.nlap. Zero-trailer files (checksum absent) are exempt.
describe('legacy file trailer checksum (corpus)', () => {
  const FIXTURES = join(__dirname, '../../../fixtures');
  const cases: Array<[dir: string, ext: string]> = [
    ['wave', '.nwp'],
    ['lead-4', '.nl4s'],
    ['lead-4', '.nl4p'],
    ['lead-a1', '.nlas'],
    ['lead-a1', '.nlap'],
  ];

  for (const [dir, ext] of cases) {
    const dirPath = join(FIXTURES, dir);
    it.skipIf(!existsSync(dirPath))(`every ${ext} fixture carries a valid trailer`, () => {
      for (const name of readdirSync(dirPath).filter(f => f.endsWith(ext))) {
        const bytes = new Uint8Array(readFileSync(join(dirPath, name)));
        const stored = bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
        if (stored === 0) continue; // trailer absent (one known .nlas oddball)
        expect(verifyTrailerChecksum(bytes), `${dir}/${name}`).toBe(true);
      }
    });
  }
});
