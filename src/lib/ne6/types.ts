/**
 * Nord Electro 6 (`.ne6p`) program model.
 *
 * Fields are decoded incrementally as the format is RE'd. Confirmed fields are
 * typed normally; unconfirmed sections carry their raw body bytes so the decode
 * inspector can still display them. The corpus RE so far (2026-06-22) has pinned:
 *
 *  - CBIN header (slot, category, version) — shared container layer
 *  - Organ drawbars: upper + lower, 9 nibble-packed values (0-8) each
 *    at body bytes 143-147 (upper) and 158-162 (lower).
 *
 * Everything else is staged as raw `unknown_*` bytes for future differential RE.
 * Source: corpus of 16 real .ne6p fixtures, differential analysis (2026-06-22).
 */

/** One set of 9 Hammond drawbar positions (16' … 1'). Each is 0-8. */
export interface Ne6Drawbars {
  /** [16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'] — values 0-8. */
  bars: readonly number[];
  /** Trailing 4-bit nibble packed after the 9th drawbar — purpose not yet decoded. */
  _trailing: number;
}

/**
 * Organ section. Upper and lower drawbars are confirmed; all other organ fields
 * (engine type, vibrato/chorus, percussion, rotary) still need differential RE.
 */
export interface Ne6Organ {
  /** Upper manual drawbars — confirmed by corpus differential RE. */
  upper: Ne6Drawbars;
  /** Lower manual drawbars — confirmed by corpus differential RE. */
  lower: Ne6Drawbars;
  /** Raw organ-area bytes outside the drawbar regions (body 120-186 excl. drawbars) — for RE. */
  _rawAux: Uint8Array;
}

/**
 * Decoded Nord Electro 6 program.
 *
 * `parsed: true` marks this as a genuine NE6 decode (not the NS4 fallback shell).
 * Consumers should narrow on `parsed` before accessing NE6-specific fields.
 */
export interface Ne6Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "2.04". */
  readonly version: string;
  /** Organ section with confirmed drawbar data. */
  readonly organ: Ne6Organ;
  /** Raw body cluster A (body bytes 5-8) — purpose not yet decoded. */
  readonly _clusterA: Uint8Array;
  /** Raw body cluster B (body bytes 20-28) — purpose not yet decoded. */
  readonly _clusterB: Uint8Array;
  /** Raw body cluster C (body bytes 38-50) — richest variation, likely synth engine. */
  readonly _clusterC: Uint8Array;
  /** Raw body cluster D (body bytes 62-75) — purpose not yet decoded. */
  readonly _clusterD: Uint8Array;
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
