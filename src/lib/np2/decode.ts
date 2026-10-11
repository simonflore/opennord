/**
 * Nord Piano 2 (`.np2p`) reader — the Piano 2 OS 1.22 parameter descriptors
 * (`layout.generated.ts`, generated) read
 * through the shared legacy program reader: record version 2 at 0x18
 * (versions 0 and 1 converted as the firmware converts them), the 42-byte
 * record from file 0x1A, the 2-byte trailer. See types.ts. Never throws.
 */
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { recordEditor, type RecordConverter } from '../clavia/record-convert';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NP2_LAYOUT, type Np2FieldKey } from './layout.generated';
import type { Np2Program } from './types';

/** Keyboard Touch (common parameter 4) in a version 1 record → its version 2 value. */
const TOUCH_V1_TO_V2 = [0, 1, 1, 2] as const;

/**
 * The OS 1.22 load path: version 0 → 1 changes only the version; version 1 → 2
 * remaps Keyboard Touch (common parameter 4) 0, 1, 2, 3 → 0, 1, 1, 2.
 */
export const convertNp2: RecordConverter = (data, from) => {
  if (from <= 1) {
    const r = recordEditor<Np2FieldKey>(data, NP2_LAYOUT);
    r.set('common.param4', TOUCH_V1_TO_V2[r.get('common.param4')] ?? 0);
  }
  return [];
};

export function decodeNp2(bytes: Uint8Array): Np2Program {
  const p = decodeLegacyProgram(bytes, NP2_LAYOUT, { model: 'Piano 2', converted: [0, 1], convert: convertNp2 });
  return { ...p, format: 'np2p', checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0 };
}
