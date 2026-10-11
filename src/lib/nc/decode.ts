/**
 * Nord C2 (`.ncpg`) reader — the C2 OS 2.00 parameter containers
 * (`layout.generated.ts`, the maintainers’ tools `c2`) read through
 * the shared legacy program reader: record version 100 at 0x18 (the only one
 * the firmware reads), the 269-byte record from file 0x1A (alignment medium),
 * the 2-byte trailer. See types.ts. Never throws.
 */
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NCP_LAYOUT } from './layout.generated';
import type { NcProgram } from './types';

export function decodeNc(bytes: Uint8Array): NcProgram {
  const p = decodeLegacyProgram(bytes, NCP_LAYOUT, { model: 'C2' });
  return { ...p, format: 'ncpg', checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0 };
}
