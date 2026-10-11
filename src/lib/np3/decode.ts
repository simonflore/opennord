/**
 * Nord Piano 3 (`.np3p`) reader — the Piano 3 OS 2.04 parameter containers
 * (`layout.generated.ts`, generated) read
 * through the shared legacy program reader: record version 4 at 0x18, the
 * 53-byte record from file 0x1A, the 2-byte trailer. See types.ts. Never throws.
 */
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NP3_LAYOUT } from './layout.generated';
import type { Np3Program } from './types';

export function decodeNp3(bytes: Uint8Array): Np3Program {
  const p = decodeLegacyProgram(bytes, NP3_LAYOUT, { model: 'Piano 3' });
  return { ...p, format: 'np3p', checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0 };
}
