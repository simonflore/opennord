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
  /**
   * Pre-drawbar organ lead-in (body bytes 124-125). Candidate region per the
   * Stage organ param order: o:113-1 KB zones [4b] | o:113-5 octave shift [4b] |
   * o:114-1 susped [1b] | o:114-2 organ model [3b] | o:114-5 preset [1b].
   * These two bytes vary only for organ-edited presets, so they hold the organ
   * lead-in, but the all-default corpus can't isolate the individual sub-fields
   * yet — surfaced as a raw 2-byte region, not value-decoded. Candidate.
   *
   * Optional so the organ's public `{ upper, lower }` drawbar shape (read via a
   * structural cast in the shared program view) stays unambiguous.
   */
  _leadIn?: Uint8Array;
  /** Raw organ-area bytes outside the drawbar regions (body 120-186 excl. drawbars) — for RE. */
  _rawAux: Uint8Array;
}

/**
 * Section/layer enable flags (body bytes 5-6). Candidate region per the Stage
 * master param order: m:084-5 organ section on/off, m:084-6 piano section
 * on/off, m:095-3 organ layer on/off. Both observed bits behave like 1-bit
 * on/off flags, but no corpus preset has a section explicitly disabled to
 * confirm semantics — candidate, surfaced as decoded bits + raw bytes.
 */
export interface Ne6SectionEnable {
  /**
   * Body byte 5, bit 0. Reads 0 exactly for the two organ-drawbar-edited
   * presets, 1 elsewhere — candidate section/layer-enable flag.
   * Maps to Stage m:084-5 / m:095-3 organ enable signature.
   */
  organEnableBit: number;
  /**
   * Body byte 6, bit 7 (0x80). Set for all corpus presets but one — candidate
   * piano/section-enable flag. Maps to Stage m:084-6 piano section on/off.
   */
  pianoEnableBit: number;
  /** Raw bytes 5-6 the flags were extracted from. */
  _raw: Uint8Array;
}

/**
 * Sample/piano section (body cluster C, bytes 38-50). Candidate region per the
 * Stage piano param order: a packed type/slot/variation header
 * (p:244-3 piano type [3b] | p:244-6 model slot [5b] | p:245-3 variation [2b])
 * followed by the 32-bit sample reference (p:245-5 piano model ID/name [32b]).
 */
export interface Ne6Sample {
  /**
   * Packed type/slot/variation header (body bytes 38-39), immediately preceding
   * the 32-bit ID. Maps to Stage p:244-3 piano type [3b] / p:244-6 model slot
   * [5b] / p:245-3 variation [2b]. Candidate — no labeled ground truth to
   * value-verify, surfaced as raw bytes.
   */
  _header: Uint8Array;
  /**
   * The 32-bit sample reference (body bytes 40-43, the four ID bytes after the
   * header). Maps to Stage p:245-5 piano model ID/name [32b]. High-entropy and
   * unique per preset — candidate, exposed as the four raw ID bytes.
   */
  modelId: Uint8Array;
  /** Raw cluster C bytes 38-50 — richest-varying body region, for ongoing RE. */
  _raw: Uint8Array;
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
  /** Section/layer enable flags (body bytes 5-6) — candidate, Stage master order. */
  readonly sectionEnable: Ne6SectionEnable;
  /** Sample/piano section (body cluster C, bytes 38-50) — candidate, Stage piano order. */
  readonly sample: Ne6Sample;
  /** Raw body cluster B (body bytes 20-28) — purpose not yet decoded. */
  readonly _clusterB: Uint8Array;
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
