/**
 * A whole legacy program file read against a record layout — the legacy-record
 * counterpart of block-chain.ts `decodeFwProgram`, shared by the later ColdFire
 * readers (Electro 5, Piano 3, Piano 2, Nord Piano, Stage Classic / EX).
 *
 * The file holds the record version in the CBIN version field (u16 LE at 0x14)
 * and the record data from a model-specific offset (0x1A for the u16-version
 * records), then a 2-byte trailer. The reader checks the version against the
 * one the firmware writes (and the older ones it converts on load), the file
 * size against the record, and reads every field through legacy-record.ts.
 * Where the record start is not established it returns the header only, with
 * a warning, rather than guess. Pure; never throws; model → clavia.
 */
import { formatCbinVersion } from './cbin';
import { legacyRecordVersion, readLegacyRecord, type LegacyLayout } from './legacy-record';

export interface LegacyProgram<K extends string> {
  readonly parsed: true;
  /** The CBIN version field at 0x14 as text, e.g. "0.04" (the record version ÷ 100). */
  readonly version: string;
  /** The record version the reader checked, or null when the layout has none or the record was not located. */
  readonly recordVersion: number | null;
  /** True when the record was read against the layout; false = header only. */
  readonly layoutMatched: boolean;
  /** Decoded values by generated field key; empty when `layoutMatched` is false. */
  readonly values: Partial<Record<K, number>>;
  /** Fields outside their descriptor range (the firmware resets these to default on load). */
  readonly outOfRange: readonly K[];
  /** The record bytes that were read (empty when not read). */
  readonly _data: Uint8Array;
  /** RE notes and decode anomalies. */
  readonly warnings: readonly string[];
  /** Original file bytes, kept so undecoded data is never lost. */
  bytes: Uint8Array;
  /** Program name — not stored in the file, injected from the filename on import. */
  name?: string;
}

/** Where a model's record sits in its file and which versions its firmware reads. */
export interface LegacyRecordSpec {
  /** Model name for messages, e.g. "Electro 5". */
  readonly model: string;
  /** File offset of the record data, or null while it is not established: the file then opens header-only. */
  readonly dataOffset: number | null;
  /** Older record versions the firmware converts on load: read with the current layout, with a warning. */
  readonly converted?: readonly number[];
  /** The warning shown when `dataOffset` is null. */
  readonly unknownStart?: string;
}

/**
 * Read a legacy program file: the record version at 0x14 (when the layout has
 * one), then the record data from `spec.dataOffset`, then the 2-byte trailer.
 * A version the firmware neither reads nor converts, a record start that is
 * not established or a file too short for the record returns the header only
 * with a warning. Never throws.
 */
export function decodeLegacyProgram<K extends string>(
  bytes: Uint8Array, layout: LegacyLayout<K>, spec: LegacyRecordSpec,
): LegacyProgram<K> {
  const warnings: string[] = [];
  const version = formatCbinVersion(bytes);
  const located = spec.dataOffset !== null;
  const recordVersion = !located || layout.recordVersion === null || bytes.length < 0x16 ? null : legacyRecordVersion(bytes);
  const headerOnly = (why: string): LegacyProgram<K> => ({
    parsed: true, version, recordVersion, layoutMatched: false, values: {}, outOfRange: [],
    _data: new Uint8Array(0), warnings: [...warnings, why], bytes,
  });

  if (spec.dataOffset === null) {
    return headerOnly(spec.unknownStart ?? `Where the ${spec.model} program record starts in this file is not known yet; showing the file header only.`);
  }
  const expected = spec.dataOffset + layout.dataBytes + 2;
  if (bytes.length < spec.dataOffset + layout.dataBytes) {
    return headerOnly(`File too short: ${bytes.length} bytes (a ${spec.model} program is ${expected}). Showing the file header only.`);
  }
  const current = layout.recordVersion;
  if (current !== null && recordVersion !== current) {
    if (recordVersion !== null && spec.converted?.includes(recordVersion)) {
      warnings.push(
        `Program format version ${recordVersion}: the ${spec.model} converts it to version ${current} on load. ` +
        `It is read with the version-${current} layout, so a few values may be off.`);
    } else {
      const also = spec.converted?.length ? ` and converts ${spec.converted.join(', ')}` : '';
      return headerOnly(
        `Program format version ${recordVersion ?? '?'} is not one the ${spec.model} firmware reads ` +
        `(it reads version ${current}${also}). Showing the file header only.`);
    }
  }
  if (bytes.length !== expected) {
    warnings.push(`Program file is ${bytes.length} bytes, the ${spec.model} firmware record makes ${expected}.`);
  }
  const data = bytes.slice(spec.dataOffset, spec.dataOffset + layout.dataBytes);
  const { values, outOfRange } = readLegacyRecord(data, layout);
  if (outOfRange.length > 0) {
    warnings.push(`${outOfRange.length} value(s) outside the firmware's range (${outOfRange.slice(0, 4).join(', ')}${outOfRange.length > 4 ? ', …' : ''}).`);
  }
  return { parsed: true, version, recordVersion, layoutMatched: true, values, outOfRange, _data: data, warnings, bytes };
}
