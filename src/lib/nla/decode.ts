/**
 * Nord Lead A1 decoder (`.nlas` sounds; `.nlap` performances read for slot A).
 *
 * Legacy formatType-0 CBIN: u16 record version at file 0x14, record data from
 * **file 0x1A**, LE CRC-16 trailer in the last two bytes (`.nlas`: 26 + 95 + 2
 * = 123). Behind an NSM-era header the data starts at 0x2E and there is no
 * trailer (46 + 95 = 141): on the two such files in ns3-program-viewer's corpus
 * the reverb switch the file name states is `fx.param13` there. The field
 * layout is the Lead A1 OS 1.36 descriptor map (record sizes
 * FUN_c012414c / FUN_c01240c8), generated into `layout.generated.ts` by
 * scripts/gen-fw-program-maps.py and read through the shared legacy-record
 * reader (clavia/legacy-record.ts).
 *
 * `.nlap`: 7 bytes of performance-common settings (11 descriptors at c02a58c0),
 * then a 3-byte per-slot set for each of the four slots (2 descriptors at
 * c02a59f4: a 9-bit value 0-399 and 15 reserved bits — registered right after
 * the common set, FUN_c011768c), then 4 × 95-byte slots: 7 + 12 + 380 = the 399
 * data bytes of the 401-byte firmware record. On a real performance every slot
 * reads in range only with slot A at data byte 19, and blocks matching real
 * `.nlas` programs sit at 19 + 95k.
 *
 * Never throws: a short or odd-sized file is read as far as it goes, with a warning.
 */
import { fileTypeTag, formatCbinVersion } from '../clavia/cbin';
import { legacyFileBytes, legacyLayoutData, legacyRecordVersion, readLegacyRecord } from '../clavia/legacy-record';
import { storedTrailerChecksum } from '../clavia/crc16';
import { readBits } from '../clavia/bitstream';
import { NLA_LAYOUT, NLA_PERF_LAYOUT, type NlaFieldKey } from './layout.generated';
import type { NlaProgram, NlaSlot } from './types';

const NLAP_COMMON_BYTES = NLA_PERF_LAYOUT.dataBytes; // 7
/** The per-slot performance set: 3 bytes per slot, before the slots. */
const NLAP_SLOT_SET_BYTES = 3;
/** Slot A's data offset in a performance. */
const NLAP_SLOT_A = NLAP_COMMON_BYTES + 4 * NLAP_SLOT_SET_BYTES; // 19

/** One program record at data byte `byteOffset`; for a performance slot, its per-slot set at `setByte`. */
function readSlot(data: Uint8Array, byteOffset: number, setByte?: number): NlaSlot {
  const { values, outOfRange } = readLegacyRecord(data, NLA_LAYOUT, byteOffset);
  // The layout lists each parameter's deltas in source order; group them under it.
  const morphDeltas: Partial<Record<NlaFieldKey, number[]>> = {};
  for (const f of NLA_LAYOUT.fields) {
    if (f.deltaOf) (morphDeltas[f.deltaOf] ??= []).push(values[f.key] ?? 0);
  }
  const sourceProgram = setByte !== undefined && data.length >= setByte + NLAP_SLOT_SET_BYTES ? readBits(data, setByte * 8, 9) : 0;
  return { values, morphDeltas, outOfRange, sourceProgram };
}

/** Decode a Nord Lead A1 program (full file bytes including the CBIN header). */
export function decodeNla(bytes: Uint8Array): NlaProgram {
  const warnings: string[] = [];
  const performance = fileTypeTag(bytes) === 'nlap';
  const nlasBytes = legacyFileBytes(bytes, NLA_LAYOUT); // 123, or 141 behind an NSM-era header
  const data = legacyLayoutData(bytes, NLA_LAYOUT);
  if (data.length === 0) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ${nlasBytes})`);
  } else if (!performance && bytes.length !== nlasBytes) {
    warnings.push(`Program file is ${bytes.length} bytes, the firmware record makes ${nlasBytes}`);
  }
  const slots = performance
    ? [0, 1, 2, 3].map((k) => readSlot(data, NLAP_SLOT_A + k * NLA_LAYOUT.dataBytes, NLAP_COMMON_BYTES + k * NLAP_SLOT_SET_BYTES))
    : undefined;
  const { values, morphDeltas, outOfRange } = slots?.[0] ?? readSlot(data, 0);

  return {
    parsed: true,
    version: formatCbinVersion(bytes),
    recordVersion: legacyRecordVersion(bytes),
    values,
    morphDeltas,
    performance: performance ? readLegacyRecord(data, NLA_PERF_LAYOUT).values : undefined,
    slots,
    outOfRange: slots ? slots.flatMap((sl) => sl.outOfRange) : outOfRange,
    checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0,
    _data: data,
    bytes,
    warnings,
  };
}
