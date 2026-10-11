/**
 * Nord C2D (`.nc2p`) decoder.
 *
 * Legacy formatType-0 CBIN: the record sits at file 0x18 — a u16 record
 * version (100), then the 345-byte parameter bitstream from **file 0x1A** —
 * and the last two bytes are the trailer: 24 + 2 + 345 + 2 = 373. The field
 * layout is the C2D OS 1.12 container list (FUN_300200AE), generated into
 * `layout.generated.ts` by scripts/gen-fw-program-maps.py and read through
 * the shared legacy-record reader (clavia/legacy-record.ts), which lets a
 * repeated container overwrite its first copy as the firmware does. Never throws.
 */
import { formatCbinVersion } from '../clavia/cbin';
import { readLegacyFile } from '../clavia/legacy-record';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NC2_LAYOUT, type Nc2FieldKey } from './layout.generated';
import type { Nc2Manual, Nc2Program } from './types';

/** Record versions the firmware reads. */
export const NC2_RECORD_VERSIONS = [100] as const;

const NINE = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Decode a Nord C2D program (full file bytes including the CBIN header). */
export function decodeNc2(bytes: Uint8Array): Nc2Program {
  const r = readLegacyFile(bytes, NC2_LAYOUT, NC2_RECORD_VERSIONS);
  const g = (key: Nc2FieldKey) => r.values[key] ?? 0;
  const manual = (m: 0 | 1): Nc2Manual => ({
    b3Drawbars: ([0, 1, 2, 3] as const).map((s) => NINE.map((i) => g(`b3Drawbars${m}_${s}.param${i}`))),
  });
  return {
    parsed: true,
    version: formatCbinVersion(bytes),
    recordVersion: r.recordVersion,
    manuals: [manual(0), manual(1)],
    pedalDrawbars: [g('pedalADrawbars0.param0'), g('pedalADrawbars0.param1')],
    effectSwitches: ([0, 1, 2, 3] as const).map((s) => ([0, 1, 2, 3] as const).map((i) => g(`fxSwitch${s}.param${i}`))),
    values: r.values,
    outOfRange: r.outOfRange,
    complete: r.complete,
    checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0,
    _data: r.data,
    bytes,
    warnings: r.warnings,
  };
}
