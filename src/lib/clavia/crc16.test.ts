import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { crc16ccitt, verifyTrailerChecksum } from './crc16';

describe('crc16ccitt', () => {
  it('matches the CRC-16/CCITT-FALSE check value', () => {
    expect(crc16ccitt(new TextEncoder().encode('123456789'))).toBe(0x29b1);
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
