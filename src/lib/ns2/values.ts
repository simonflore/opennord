/**
 * A Stage 2 / 2 EX program's stored settings, as the instrument plays them: the
 * record read against the OS 3.00 layout (layout.generated.ts), an older record
 * version converted the way the firmware converts it on load (convert.ts). No
 * display tables: decode.ts turns these values into words. Kept apart so a caller
 * that needs only the values (the writer, a model-agnostic reader) doesn't take
 * the display tables with them.
 */
import {
  legacyData, legacyDataOffset, legacyLayoutVersion, legacyRecordVersion, legacyTrailerBytes, readLegacyRecord,
} from '../clavia/legacy-record';
import { NS2_LAYOUT, type Ns2FieldKey } from './layout.generated';
import { convertNs2 } from './convert';

const LAYOUT_VERSION = NS2_LAYOUT.recordVersion ?? 7;

export interface Ns2Values {
  /** Where the record data starts in the file. */
  readonly dataOffset: number;
  readonly recordVersion: number;
  /** Every layout field as the instrument plays it. */
  readonly values: Partial<Record<Ns2FieldKey, number>>;
  readonly outOfRange: readonly Ns2FieldKey[];
  readonly warnings: readonly string[];
}

/** A Stage 2 program's settings, as the instrument plays them. Never throws. */
export function readNs2Values(bytes: Uint8Array): Ns2Values {
  const warnings: string[] = [];
  // Data at 0x2E behind the NSM-era header (no trailer, 565 bytes), else at 0x1A
  // followed by the 2-byte trailer (547).
  const dataOffset = legacyDataOffset(bytes, NS2_LAYOUT);
  const trailerBytes = legacyTrailerBytes(bytes);
  // The record's own u16 version (in front of the data) is the one the firmware
  // goes by; the CBIN version field (0x14, LE) carries a copy on both headers.
  const own = legacyLayoutVersion(bytes, NS2_LAYOUT);
  const recordVersion = own <= LAYOUT_VERSION ? own : legacyRecordVersion(bytes);
  const data = legacyData(bytes, dataOffset, trailerBytes);
  const whole = data.length >= NS2_LAYOUT.dataBytes;
  if (!whole) {
    warnings.push(
      `This file is shorter than a Stage 2 program (${bytes.length} bytes, expected ` +
      `${dataOffset + NS2_LAYOUT.dataBytes + trailerBytes}); settings past the end show as 0.`,
    );
  }
  if (recordVersion > LAYOUT_VERSION) {
    warnings.push('This program was saved in a newer Stage 2 format than OpenNord knows; some settings may show wrong.');
  } else if (recordVersion < LAYOUT_VERSION && whole) {
    warnings.push(
      'This program was saved by an older Stage 2 OS. The Nord updates it when it loads it, ' +
      'and OpenNord shows it updated the same way.',
      ...convertNs2(data, recordVersion),
    );
  }
  const { values, outOfRange } = readLegacyRecord(data, NS2_LAYOUT);
  return { dataOffset, recordVersion, values, outOfRange, warnings };
}
