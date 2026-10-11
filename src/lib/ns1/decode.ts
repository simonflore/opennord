/**
 * Nord Stage Classic / Stage EX (`.nspg`) reader — the OS 5.08 / 6.08
 * descriptor record (`layout.generated.ts`, the maintainers’ tools
 * `stage-classic`). The record layout is known; where it starts in a `.nspg`
 * file is not (types.ts), so `decodeNs1` opens a file header-only with a
 * warning unless a record start is passed explicitly (RE tooling, tests). It
 * never guesses one. Never throws.
 */
import { formatCbinVersion } from '../clavia/cbin';
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { readLegacyRecord } from '../clavia/legacy-record';
import { NS1_LAYOUT, type Ns1FieldKey } from './layout.generated';
import type { Ns1Program, Ns1Record } from './types';

/** Where the record starts in a `.nspg` file: not established, so null. */
export const NS1_RECORD_START: number | null = null;

/** The record's current version; the firmware converts 0–9 up on load. */
export const NS1_RECORD_VERSION = 10;

const UNKNOWN_START =
  'Stage Classic / EX: where the program settings start inside a .nspg file is not confirmed yet, so only the file header is shown.';

/** Read one located 400-byte record (its u8 version first). Never throws. */
export function decodeNs1Record(record: Uint8Array): Ns1Record {
  const warnings: string[] = [];
  const recordVersion = record[0] ?? 0;
  if (record.length < NS1_LAYOUT.dataBytes) {
    warnings.push(`Record too short: ${record.length} bytes (the firmware record is ${NS1_LAYOUT.dataBytes}).`);
  }
  if (recordVersion < NS1_RECORD_VERSION) {
    warnings.push(`Record version ${recordVersion}: the instrument converts it to version ${NS1_RECORD_VERSION} on load; values may be off.`);
  } else if (recordVersion > NS1_RECORD_VERSION) {
    warnings.push(`Record version ${recordVersion} is newer than OpenNord reads (${NS1_RECORD_VERSION}); values may be off.`);
  }
  const { values, outOfRange } = readLegacyRecord(record, NS1_LAYOUT);
  if (outOfRange.length > 0) {
    warnings.push(`${outOfRange.length} value(s) outside the firmware's range (${outOfRange.slice(0, 4).join(', ')}${outOfRange.length > 4 ? ', …' : ''}).`);
  }
  const morphDeltas: Partial<Record<Ns1FieldKey, number[]>> = {};
  for (const f of NS1_LAYOUT.fields) if (f.deltaOf) (morphDeltas[f.deltaOf] ??= []).push(values[f.key] ?? 0);
  return { recordVersion, values, outOfRange, morphDeltas, warnings };
}

/**
 * Decode a `.nspg` file. Header only (with a warning) unless `recordStart`
 * — the file offset of the record's u8 version — is given.
 */
export function decodeNs1(bytes: Uint8Array, recordStart: number | null = NS1_RECORD_START): Ns1Program {
  if (recordStart === null) {
    const p = decodeLegacyProgram(bytes, NS1_LAYOUT, { model: 'Stage Classic / EX', dataOffset: null, unknownStart: UNKNOWN_START });
    return { ...p, format: 'nspg', record: null };
  }
  const version = formatCbinVersion(bytes);
  if (bytes.length < recordStart + NS1_LAYOUT.dataBytes) {
    return {
      parsed: true, format: 'nspg', version, recordVersion: null, layoutMatched: false, values: {}, outOfRange: [],
      _data: new Uint8Array(0), record: null, bytes,
      warnings: [`File too short for a ${NS1_LAYOUT.dataBytes}-byte record at 0x${recordStart.toString(16)}; showing the file header only.`],
    };
  }
  const data = bytes.slice(recordStart, recordStart + NS1_LAYOUT.dataBytes);
  const record = decodeNs1Record(data);
  return {
    parsed: true, format: 'nspg', version, recordVersion: record.recordVersion, layoutMatched: true,
    values: record.values, outOfRange: record.outOfRange, _data: data, record, bytes, warnings: record.warnings,
  };
}
