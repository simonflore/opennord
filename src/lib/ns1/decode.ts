/**
 * Nord Stage Classic / Stage EX (`.nspg`) reader — the OS 5.08 / 6.08
 * descriptor record (`layout.generated.ts`, scripts/gen-fw-program-maps.py
 * `stage-classic`) read through the shared legacy program reader.
 *
 * Framing is the one CBIN rule every Nord file follows (clavia/cbin.ts
 * `cbinRecord`): the record — its u8 version first, then 399 data bytes — sits
 * at 0x2C behind an NSM-era header and at 0x18 behind a legacy one (then the
 * 2-byte trailer), so a whole file is 444 or 426 bytes. NSM never parses the
 * body; it passes on what the instrument sends. The alignment is not yet
 * confirmed on a real file, so the coverage map calls it a candidate. A file
 * longer than the record (padding the firmware notes don't show) still reads,
 * with a size note. Never throws.
 */
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { outOfRangeWarning } from '../clavia/block-chain';
import { legacyMorphDeltas, readLegacyRecord } from '../clavia/legacy-record';
import { NS1_LAYOUT } from './layout.generated';
import type { Ns1Program, Ns1Record } from './types';

/** The record's current version; the firmware converts 0–9 up on load. */
export const NS1_RECORD_VERSION = 10;

/** Older record versions the firmware converts on load. */
const CONVERTED = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Bytes in the whole record: the u8 version + the data. */
export const NS1_RECORD_BYTES = (NS1_LAYOUT.versionBytes ?? 1) + NS1_LAYOUT.dataBytes;

/** Read one 400-byte record (its u8 version first). Never throws. */
export function decodeNs1Record(record: Uint8Array): Ns1Record {
  const warnings: string[] = [];
  const recordVersion = record[0] ?? 0;
  if (record.length < NS1_RECORD_BYTES) {
    warnings.push(`Record too short: ${record.length} bytes (the firmware record is ${NS1_RECORD_BYTES}).`);
  }
  if (recordVersion < NS1_RECORD_VERSION) {
    warnings.push(`Record version ${recordVersion}: the instrument converts it to version ${NS1_RECORD_VERSION} on load; values may be off.`);
  } else if (recordVersion > NS1_RECORD_VERSION) {
    warnings.push(`Record version ${recordVersion} is newer than the firmware read (${NS1_RECORD_VERSION}); values may be off.`);
  }
  const { values, outOfRange } = readLegacyRecord(record, NS1_LAYOUT, NS1_LAYOUT.versionBytes ?? 1);
  if (outOfRange.length > 0) warnings.push(outOfRangeWarning(outOfRange));
  return { recordVersion, values, outOfRange, morphDeltas: legacyMorphDeltas(NS1_LAYOUT, values), warnings };
}

/** Decode a `.nspg` file (full bytes, CBIN header included). */
export function decodeNs1(bytes: Uint8Array): Ns1Program {
  const p = decodeLegacyProgram(bytes, NS1_LAYOUT, { model: 'Stage Classic / EX', converted: CONVERTED });
  const record: Ns1Record | null = p.layoutMatched
    ? { recordVersion: p.recordVersion ?? 0, values: p.values, outOfRange: p.outOfRange, morphDeltas: legacyMorphDeltas(NS1_LAYOUT, p.values), warnings: p.warnings }
    : null;
  return { ...p, format: 'nspg', record };
}
