/**
 * A whole legacy program file read against a record layout — the legacy-record
 * counterpart of block-chain.ts `decodeFwProgram`, shared by the later ColdFire
 * readers (Electro 5, Piano 3, Piano 2, Nord Piano, C2, Stage Classic / EX).
 *
 * The framing is legacy-record.ts `readLegacyFile`: the record (its version
 * first) at file 0x18 after a legacy header (0x2C after an NSM-era one), the
 * data after the version, then the 2-byte trailer of a legacy file. On top of
 * it this adds what these readers share: the record version checked against
 * the one the firmware writes (older ones it converts are read with a warning,
 * any other opens header-only) and a file too short for the record
 * header-only. Pure; never throws; model → clavia.
 */
import { formatCbinVersion } from './cbin';
import { readLegacyFile, type LegacyLayout, legacyRecordVersion } from './legacy-record';

export interface LegacyProgram<K extends string> {
  readonly parsed: true;
  /** The CBIN version field at 0x14 as text, e.g. "0.04" (NSM's copy of the record version ÷ 100). */
  readonly version: string;
  /** The record version stored in front of the data, or null when the layout has none or the record was not located. */
  readonly recordVersion: number | null;
  /** True when the record was read against the layout; false = header only. */
  readonly layoutMatched: boolean;
  /** Decoded values by generated field key; empty when `layoutMatched` is false. */
  readonly values: Partial<Record<K, number>>;
  /** Fields outside their descriptor range (the firmware resets these to default on load). */
  readonly outOfRange: readonly K[];
  /** The record data that was read (empty when not read). */
  readonly _data: Uint8Array;
  /** RE notes and decode anomalies. */
  readonly warnings: readonly string[];
  /** Original file bytes, kept so undecoded data is never lost. */
  bytes: Uint8Array;
  /** Program name — not stored in the file, injected from the filename on import. */
  name?: string;
}

/** What a model's firmware reads. */
export interface LegacyRecordSpec {
  /** Model name for messages, e.g. "Electro 5". */
  readonly model: string;
  /** Older record versions the firmware converts on load: read with the current layout, with a warning. */
  readonly converted?: readonly number[];
}

/** Read a legacy program file against `layout` (see the module comment). Never throws. */
export function decodeLegacyProgram<K extends string>(
  bytes: Uint8Array, layout: LegacyLayout<K>, spec: LegacyRecordSpec,
): LegacyProgram<K> {
  const version = formatCbinVersion(bytes);
  const headerOnly = (warnings: string[], recordVersion: number | null = null): LegacyProgram<K> => ({
    parsed: true, version, recordVersion, layoutMatched: false, values: {}, outOfRange: [],
    _data: new Uint8Array(0), warnings, bytes,
  });

  const r = readLegacyFile(bytes, layout, []);
  if (!r.complete) return headerOnly([...r.warnings, 'Showing the file header only.']);

  const current = layout.recordVersion;
  const reads = (v: number) => v === current || !!spec.converted?.includes(v);
  // The firmware's own copy of the version sits in front of the data; NSM keeps
  // one at 0x14. Older readers were checked on real files against 0x14 only, so
  // if the record's copy isn't one the firmware reads but NSM's is, trust NSM's
  // rather than refusing a file the old reader opened.
  const recordVersion = current === null ? null
    : !reads(r.recordVersion) && reads(legacyRecordVersion(bytes)) ? legacyRecordVersion(bytes)
    : r.recordVersion;
  const warnings: string[] = [];
  if (current !== null && recordVersion !== current) {
    if (recordVersion !== null && spec.converted?.includes(recordVersion)) {
      warnings.push(
        `Program format version ${recordVersion}: the ${spec.model} converts it to version ${current} on load. ` +
        `It is read with the version-${current} layout, so a few values may be off.`);
    } else {
      const also = spec.converted?.length ? ` and converts ${spec.converted.join(', ')}` : '';
      return headerOnly([
        `Program format version ${recordVersion} is not one the ${spec.model} firmware reads ` +
        `(it reads version ${current}${also}). Showing the file header only.`,
      ], recordVersion);
    }
  }
  return {
    parsed: true, version, recordVersion, layoutMatched: true, values: r.values, outOfRange: r.outOfRange,
    _data: r.data.slice(0, layout.dataBytes), warnings: [...warnings, ...r.warnings], bytes,
  };
}
