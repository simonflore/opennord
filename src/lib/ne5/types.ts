/**
 * Nord Electro 5 (`.ne5p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 13 fixtures × 147 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=4 → 0.04, all files)
 *   - Body 103 bytes; 62/103 bytes vary, many nibble-range blocks
 *   - upperDrawbarsB (body[39-43]): confirmed by all-nibble-range detection + corpus variation
 *   - lowerDrawbarsB (body[45-49]): confirmed by all-nibble-range detection + corpus variation
 *   - pedalDrawbarsB (body[55-59]): candidate, consistent 0-8 nibble range across all fixtures
 *   - upperDrawbarsA (body[21-25]): candidate — VCS3 organ shows custom values; may be alternate layer
 *   - lowerDrawbarsA (body[28-32]): candidate — mirrors upperDrawbarsA structure
 *
 * Constant: body[1-5]=0, body[14-16]=0, body[18]=0, body[20]=0, body[27]=0,
 *           body[34]=0, body[36-38]=0, body[44]=0, body[50]=0, body[52-54]=0,
 *           body[60]=0, body[62-70]=0, body[75]=0x08, body[76]=0, body[78-80]=0,
 *           body[81]=0x08, body[82]=0, body[98-100]=0.
 *
 * Source: 13-file corpus statistical analysis (2026-06-22).
 */

/** One set of 9 Hammond drawbar positions (16' … 1'). Each is 0-8. */
export interface Ne5Drawbars {
  /** [16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'] — values 0-8. */
  bars: readonly number[];
  /** Trailing 4-bit nibble packed after the 9th drawbar — purpose not yet decoded. */
  _trailing: number;
}

/**
 * Organ section. The B-slot drawbars (body[39-43] upper, body[45-49] lower) are
 * confirmed by corpus RE. Pedal drawbars are a strong candidate. The A-slot
 * drawbars (body[21-25] upper, body[28-32] lower) are candidates — they show
 * valid nibble range and custom values on real organ presets, but their role
 * (alternate layer vs. section copy) is unresolved without differential RE.
 */
export interface Ne5Organ {
  /**
   * Upper manual drawbars — primary slot (body[39-43]).
   * CONFIRMED by corpus: 11/13 files share default [8,8,8,8,0,0,0,0,0]; VCS3 Organ
   * and Walk of Life Nord Samples carry program-specific values.
   */
  upper: Ne5Drawbars;
  /**
   * Lower manual drawbars — primary slot (body[45-49]).
   * CONFIRMED by corpus: mirrors upper; Walk of Life = classic B3 lower voicing.
   */
  lower: Ne5Drawbars;
  /**
   * Pedal drawbars (body[55-59]).
   * CANDIDATE: default = [8,0,0,0,0,0,0,0,0] (16' only); Walk of Life = all-8.
   * All fixtures decode to valid 0-8 nibble range.
   */
  pedal: Ne5Drawbars;
  /**
   * Upper manual drawbars — secondary slot (body[21-25]).
   * CANDIDATE: VCS3 Organ = [6,1,8,8,4,8,4,6,6] custom; most sample presets =
   * [8,8,8,0,0,0,0,0,0] or [8,0,0,0,0,0,0,0,0]. Role unclear vs. upper.
   */
  upperAlt: Ne5Drawbars;
  /**
   * Lower manual drawbars — secondary slot (body[28-32]).
   * CANDIDATE: mirrors upperAlt structure. Walk of Life = [8,8,8,8,0,6,6,7,7].
   */
  lowerAlt: Ne5Drawbars;
}

/**
 * Decoded Nord Electro 5 program.
 *
 * `parsed: true` marks this as a genuine NE5 decode (not the NS4 fallback shell).
 * Consumers should narrow on `parsed` before accessing NE5-specific fields.
 */
export interface Ne5Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "0.04". */
  readonly version: string;
  /**
   * Organ section with drawbar data.
   * B-slot (upper/lower) confirmed; pedal + A-slot (upperAlt/lowerAlt) are candidates.
   */
  readonly organ: Ne5Organ;
  /**
   * Program type / mode flags: body[0].
   * CANDIDATE: 9 unique values (0x00, 0x14, 0x2c, 0x74, 0xa8, 0xc0, 0xc8, 0xec, 0xfc).
   * Likely encodes which sections (organ/piano/sample) are active and their routing.
   * Bit-level decode requires differential RE with section toggles.
   */
  readonly programTypeFlags: number;
  /**
   * Section enable nibble: body[6].
   * CANDIDATE: 4 unique values (0x00, 0x01, 0x27, 0x40).
   * 0x01 = most sample presets; 0x40 = Kawai SK7 / Naked Piano / Nord Stage Lead (1);
   * 0x27 = Walk of Life; 0x00 = DX7 Kurz.
   */
  readonly sectionEnableNibble: number;
  /**
   * Section flags byte: body[17].
   * CANDIDATE: 6 unique values (0x00, 0x04, 0xac, 0xb0, 0xb8, 0xbc).
   * Bits 7,5,4 (0x90 base) commonly set; correlates with drawbar patterns.
   */
  readonly sectionFlags17: number;
  /**
   * Flag nibble: body[19].
   * CANDIDATE: 0x40 = Nord Stage Lead (2) (most-varied drawbars), 0x00 = all others.
   */
  readonly flagByte19: number;
  /**
   * Single-bit flag: body[13].
   * CANDIDATE: 0x80 = CP80/DX7 Kurz/DX7 PH/WarmPad; 0x00 = others.
   */
  readonly flagByte13: number;
  /**
   * Sample reference / hash block: body[7-12] (6 bytes).
   * UNKNOWN: full 0x00-0xFF range, 10-11 unique values per byte.
   * Likely sample bank reference or program fingerprint. Decode requires catalog cross-ref.
   */
  readonly _sampleRefHash: Uint8Array;
  /**
   * Pre-drawbar cluster: body[17-33] (17 bytes, sparse).
   * Renamed from _clusterB — wraps sectionFlags17, nibble fields at [26]/[33],
   * and flagByte19. Still mostly unidentified; kept raw for RE.
   * @deprecated Split into named fields once differential RE confirms layout.
   */
  readonly _organSection: Uint8Array;
  /**
   * Extra nibble group: body[71-74] (4 bytes).
   * CANDIDATE: default [8,0,0,0,0,0,0,0] (7 nibbles), Walk of Life [4,0,1,6,4,8,1,0].
   * May be a 4th drawbar set (e.g., second upper layer) or FX nibble region.
   */
  readonly _extraNibbleGroup: Uint8Array;
  /**
   * Sample reference block: body[83-97] (15 bytes).
   * UNKNOWN: 6 files share pattern 02 00 10 06 04 at [83-87]; likely a structured
   * sample-bank reference record. Full decode requires Nord sample catalog index.
   */
  readonly _clusterC: Uint8Array;
  /**
   * Trailing checksum: body[101-102] (2 bytes).
   * CANDIDATE: all 13 files differ; consistent with CRC-16 (algorithm unverified).
   */
  readonly _checksum: Uint8Array;
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
