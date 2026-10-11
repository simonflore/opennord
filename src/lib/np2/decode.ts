/**
 * Nord Piano 2 (`.np2p`) reader — the Piano 2 OS 1.22 parameter descriptors
 * (`layout.generated.ts`, generated) read
 * through the shared legacy program reader: record version 2 at 0x14
 * (version 1 read with a warning: the firmware converts it), the 42-byte
 * record from file 0x1A, the 2-byte trailer. See types.ts. Never throws.
 */
import { LEGACY_DATA_OFFSET } from '../clavia/legacy-record';
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NP2_LAYOUT } from './layout.generated';
import type { Np2Program } from './types';

export function decodeNp2(bytes: Uint8Array): Np2Program {
  const p = decodeLegacyProgram(bytes, NP2_LAYOUT, { model: 'Piano 2', dataOffset: LEGACY_DATA_OFFSET, converted: [1] });
  return { ...p, format: 'np2p', checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0 };
}
