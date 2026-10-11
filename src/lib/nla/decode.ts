/**
 * Nord Lead A1 decoder (`.nlas` sounds; `.nlap` performances read for slot A).
 *
 * Legacy formatType-0 CBIN: u16 record version at file 0x14, record data from
 * **file 0x1A**, LE CRC-16 trailer in the last two bytes (`.nlas`: 26 + 95 + 2
 * = 123). Behind an NSM-era header the data starts at 0x2E and there is no
 * trailer (46 + 95 = 141): on the two such files in ns3-program-viewer's corpus
 * the reverb switch the file name states is `fx.param13` there. The field layout is the Lead A1 OS 1.36 descriptor map (record sizes
 *), generated into `layout.generated.ts` by
 * the maintainers’ tools and read through the shared legacy-record
 * reader (clavia/legacy-record.ts).
 *
 * `.nlap`: 7 bytes of performance-common settings then the slots;
 * the firmware record (401 bytes) leaves 12 bytes unplaced, so slot A at data
 * byte 7 is medium confidence and slots B-D are not read yet.
 *
 * Never throws: a short or odd-sized file is read as far as it goes, with a warning.
 */
import { fileTypeTag, formatCbinVersion } from '../clavia/cbin';
import { legacyFileBytes, legacyLayoutData, legacyRecordVersion, readLegacyRecord } from '../clavia/legacy-record';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NLA_LAYOUT, NLA_PERF_LAYOUT, type NlaFieldKey } from './layout.generated';
import type { NlaProgram } from './types';

const NLAP_COMMON_BYTES = NLA_PERF_LAYOUT.dataBytes; // 7

/** Decode a Nord Lead A1 program (full file bytes including the CBIN header). */
export function decodeNla(bytes: Uint8Array): NlaProgram {
  const warnings: string[] = [];
  const performance = fileTypeTag(bytes) === 'nlap';
  const nlasBytes = legacyFileBytes(bytes, NLA_LAYOUT); // 123, or 141 behind an NSM-era header
  const data = legacyLayoutData(bytes, NLA_LAYOUT);
  if (data.length === 0) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ${nlasBytes})`);
  } else if (!performance && bytes.length !== nlasBytes) {
    warnings.push(`Program file is ${bytes.length} bytes, the program record makes ${nlasBytes}`);
  }
  const { values, outOfRange } = readLegacyRecord(data, NLA_LAYOUT, performance ? NLAP_COMMON_BYTES : 0);

  // The layout lists each parameter's deltas in source order; group them under it.
  const morphDeltas: Partial<Record<NlaFieldKey, number[]>> = {};
  for (const f of NLA_LAYOUT.fields) {
    if (f.deltaOf) (morphDeltas[f.deltaOf] ??= []).push(values[f.key] ?? 0);
  }

  return {
    parsed: true,
    version: formatCbinVersion(bytes),
    recordVersion: legacyRecordVersion(bytes),
    values,
    morphDeltas,
    performance: performance ? readLegacyRecord(data, NLA_PERF_LAYOUT).values : undefined,
    outOfRange,
    checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0,
    _data: data,
    bytes,
    warnings,
  };
}
