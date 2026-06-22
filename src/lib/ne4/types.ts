/**
 * Nord Electro 4 (`.ne4p`) program model.
 *
 * Fields are decoded incrementally as the format is RE'd. Confirmed fields are
 * typed normally; unconfirmed sections carry their raw body bytes so the decode
 * inspector can still display them.
 *
 * Confirmed (corpus RE, 2026-06-22, 16 fixtures × 136 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=103 → 1.03, all files)
 *   - Body 92 bytes; very sparse — 33/92 bytes vary; long zero-padding runs between params
 *   - Upper drawbars: body[16-20], 9 nibble-packed values (0-8), high-nibble-first
 *     (identical scheme to NE6 at body[143-147])
 *
 * Source: 16-file corpus statistical analysis (2026-06-22).
 */

/** One set of 9 Hammond drawbar positions (16' … 1'). Each is 0-8. */
export interface Ne4Drawbars {
  /** [16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'] — values 0-8. */
  bars: readonly number[];
  /** Trailing 4-bit nibble packed after the 9th drawbar — purpose not yet decoded. */
  _trailing: number;
}

/**
 * Organ section for the NE4. Only the upper manual is confirmed; lower/pedal
 * sections appear to be stored with firmware-default values in this corpus
 * (all 16 files show the same constant block at body[22-36]).
 */
export interface Ne4Organ {
  /** Upper manual drawbars — confirmed by 16-fixture corpus differential RE. */
  upper: Ne4Drawbars;
  /**
   * 3 extra nibbles immediately following the 9th drawbar nibble:
   *   extra1 = body[20]lo  (organ section level candidate: 0, 10, or 11)
   *   extra2 = body[21]hi  (rotary/vibrato candidate: 0/3/9/11/13)
   *   extra3 = body[21]lo  (section flags candidate: 4 or 6 only)
   * All three are candidates — not yet pinned by differential RE.
   */
  _extraNibs: readonly [number, number, number];
}

export interface Ne4Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "1.03". */
  readonly version: string;
  /**
   * Program type/mode byte: body[0].
   * Observed: 0x04 (default, 13/16 files), 0x38 (1 file), 0xf6 (2 files).
   * Likely a bitfield encoding instrument section config or program category flags.
   */
  readonly _byte0: number;
  /** Organ section with confirmed upper drawbar data. */
  readonly organ: Ne4Organ;
  /**
   * Sample/synth section parameters: body[37-45] (9 bytes).
   * High nibble variance — NOT drawbar-encoded. Likely encodes sample bank,
   * sample index, root key, and/or pitch/tuning params for the Piano/Sample section.
   * Renamed from _clusterB; kept as raw bytes until differential RE pins fields.
   */
  readonly _organSection: Uint8Array;
  /**
   * Secondary program parameters: body[51-63] (13 bytes).
   * High variance; patches from the same sample set share a common prefix.
   * Likely: sample ID (bytes 51-52 or 51-53), root/zone params, voice-level settings.
   * Renamed from _clusterC; kept as raw bytes.
   */
  readonly _sampleSection: Uint8Array;
  /**
   * Sparse parameter at body[68].
   * Lo nibble = 0 or 8 (bit-3 flag); hi nibble = 1/2/3/9 (level or mode value).
   * Candidate: Piano/Sample section level or transpose/octave setting.
   */
  readonly _tail0: number;
  /**
   * Sparse parameter at body[79].
   * Same hi/lo nibble pattern as _tail0; hi nibble spans 0-13.
   * Isolated between two 10-byte zero-padding blocks.
   */
  readonly _tail1: number;
  /**
   * Program-specific bytes at body[90-91].
   * Unique per program (byte-identical copies share same values). Not a file checksum.
   * Could be sample routing params, effect settings, or an intra-body identifier.
   */
  readonly _tail23: Uint8Array;
  /**
   * @deprecated Use organ, _organSection, _sampleSection, _tail0, _tail1, _tail23 instead.
   * Kept for backward compatibility with existing cluster size tests.
   */
  readonly _clusterA: Uint8Array;
  /** @deprecated Use _organSection instead. Kept for backward compatibility. */
  readonly _clusterB: Uint8Array;
  /** @deprecated Use _sampleSection instead. Kept for backward compatibility. */
  readonly _clusterC: Uint8Array;
  /**
   * @deprecated Use _tail0, _tail1, _tail23 instead.
   * Contains [body[68], body[79], body[90], body[91]].
   */
  readonly _tail: Uint8Array;
  /** Full raw body for RE tooling. */
  readonly _rawBody: Uint8Array;
  /** RE notes and decode anomalies. */
  readonly warnings: readonly string[];
  /**
   * Original file bytes — kept so undecoded data is never lost and USB transfer
   * ("Send to Nord") can round-trip the file without re-encoding.
   */
  bytes: Uint8Array;
  /** Program name — NOT stored in the file, injected from the filename on import. */
  name?: string;
}
