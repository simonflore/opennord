/**
 * Nord Electro 5 (`.ne5p`) program model.
 *
 * Confirmed fields (cross-model Stage-oracle alignment + corpus RE, 2026-06-22,
 * 13 fixtures × 147 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=4 → 0.04, all files)
 *   - Body 103 bytes; 62/103 bytes vary, many nibble-range blocks
 *   - organ preset 1 upper (body[21-25]) — primary organ slot
 *   - organ preset 1 lower (body[28-32])
 *   - organ preset 2 upper (body[39-43]) — second organ preset
 *   - organ preset 2 lower (body[45-49])
 *   - sampleSectionActive (body[17] bit7) — piano/sample section on/off
 *   - sampleModelId (body[7-12]) — factory sample/model reference id
 *
 * Each confirmed field carries a comment citing the Stage oracle parameter it
 * was aligned against (traceability, per CLAUDE.md).
 *
 * Constant: body[1-5]=0, body[14-16]=0, body[18]=0, body[20]=0, body[27]=0,
 *           body[34]=0, body[36-38]=0, body[44]=0, body[50]=0, body[52-54]=0,
 *           body[60]=0, body[62-70]=0, body[75]=0x08, body[76]=0, body[78-80]=0,
 *           body[81]=0x08, body[82]=0, body[98-100]=0.
 *
 * Source: 13-file corpus statistical analysis + Stage organ/piano oracle
 * alignment (2026-06-22).
 */

/** One set of 9 Hammond drawbar positions (16' … 1'). Each is 0-8. */
export interface Ne5Drawbars {
  /** [16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'] — values 0-8. */
  bars: readonly number[];
  /** Trailing 4-bit nibble packed after the 9th drawbar — purpose not yet decoded. */
  _trailing: number;
}

/**
 * Organ section. Two organ presets, each with an upper and lower manual.
 *
 * Cross-model alignment maps these to the Stage organ drawbar group (group `o`,
 * drawbar ids 117-1..136-1), nibble-relocated as in NS3 (drawbars@preset1 0xBE,
 * preset2 0xD9). Preset 1 (body[21]) is the primary/active organ slot; preset 2
 * (body[39]) is the second organ preset. The pedal manual (body[55]) is a
 * candidate — order/range fit but only a single fixture deviates.
 */
export interface Ne5Organ {
  /**
   * Organ preset 1, upper manual (body[21-25]).
   * CONFIRMED — Stage oracle: organ drawbar 1..9 (group o, ids 117-1..136-1).
   * Primary/active organ slot. VCS3 Organ carries custom voicing
   * [6,1,8,8,4,8,4,6,6] here while preset-2 (b39) is all-zero.
   * All 13 fixtures decode to valid 0-8 nibbles.
   */
  preset1Upper: Ne5Drawbars;
  /**
   * Organ preset 1, lower manual (body[28-32]).
   * CONFIRMED — Stage oracle: organ drawbar 1..9 (group o, second manual).
   * Mirrors preset-1 upper 7 bytes later. Walk of Life lower = [8,8,8,4,1,1,0,0,0].
   */
  preset1Lower: Ne5Drawbars;
  /**
   * Organ preset 2, upper manual (body[39-43]).
   * CONFIRMED — Stage oracle: organ drawbar 1..9 (group o), second organ preset
   * (analogous to NS3 preset2@0xD9). Default [8,8,8,8,0,0,0,0,0] on 12/13 files;
   * only Walk of Life (which uses organ preset 2) carries [8,8,8,8,0,3,0,0,2].
   */
  preset2Upper: Ne5Drawbars;
  /**
   * Organ preset 2, lower manual (body[45-49]).
   * CONFIRMED — Stage oracle: organ drawbar 1..9 (group o), second preset lower.
   * Default [8,8,8,8,0,0,0,0,0] on 12/13; Walk of Life = [8,8,7,5,8,3,1,3,0].
   */
  preset2Lower: Ne5Drawbars;
  /**
   * Pedal / bass manual drawbars (body[55-59]).
   * CANDIDATE — Stage oracle: organ drawbar 1..9 (group o), pedal/bass manual.
   * Default [8,0,0,0,0,0,0,0,0] (16' only) on 12/13; Walk of Life = all-8.
   * All fixtures decode to valid 0-8 nibble range; single-deviating-file evidence.
   */
  pedal: Ne5Drawbars;
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
   * Organ section with drawbar data (two presets + pedal).
   * Preset 1/2 upper+lower confirmed; pedal is a candidate.
   */
  readonly organ: Ne5Organ;
  /**
   * Piano / sample section active flag — body[17] bit 7 (0x80).
   * CONFIRMED — Stage oracle: piano section on/off (group m, id 084-6) /
   * layer on/off (group p, id 230-3). Set on all 11 sample/piano presets;
   * CLEAR on exactly the 2 organ-only presets (VCS3 Organ, Walk of Life).
   * Lower bits of body[17] do not cluster cleanly, so only bit7 is claimed.
   */
  readonly sampleSectionActive: boolean;
  /**
   * Factory sample / model reference id — body[7-12] (6 bytes).
   * CONFIRMED — Stage oracle: piano model ID/name (group p, id 245-5, 32b).
   * High-entropy id (10-11 unique values per byte) that identifies the factory
   * sample. Semantic differential passes: "Naked Piano Sample" and
   * "Nord Stage Electro Lead Samples (1)" share an identical id (80 07 90 15 19
   * 24) because they reference the same factory sample.
   * Trailing byte body[13] bit7 is a separate flag (see `sampleModelFlag`).
   */
  readonly sampleModelId: Uint8Array;
  /**
   * Sample-model trailing flag — body[13] bit 7 (0x80).
   * CONFIRMED (companion to sampleModelId) — set on CP80/DX7 Kurz/DX7 PH/WarmPad;
   * a separate flag adjacent to the model id, NOT part of the id bytes.
   */
  readonly sampleModelFlag: boolean;
  /**
   * Raw byte at body[17].
   * CONFIRMED bit: bit7 (0x80) = `sampleSectionActive`. The lower bits carry
   * additional section sub-fields that do not yet cluster to a clean enum;
   * exposed raw for ongoing RE.
   */
  readonly sectionFlags17: number;
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
   */
  readonly sectionEnableNibble: number;
  /**
   * Flag nibble: body[19].
   * CANDIDATE: 0x40 = Nord Stage Lead (2) (most-varied drawbars), 0x00 = all others.
   */
  readonly flagByte19: number;
  /**
   * Sample-section descriptor record: body[83-94] (12 bytes).
   * CANDIDATE — Stage oracle: piano model slot/variation region (group p,
   * ids 244-6 / 245-3) — sample bank reference. 6/13 files share the b83-87
   * prefix 02 00 10 06 04 (a sample-bank-type descriptor); bytes 88-94 are a
   * per-sample hash. Field boundaries / slot-variation split unverified.
   */
  readonly sampleDescriptor: Uint8Array;
  /**
   * Trailing checksum: body[101-102] (2 bytes).
   * CANDIDATE — Stage oracle: checksum (group m, id 025-1). Position (final 2
   * body bytes) and full-range behavior are consistent with the CRC-16 used
   * elsewhere in the Nord container family; algorithm unverified.
   */
  readonly _checksum: Uint8Array;
  /**
   * Sample reference / hash block: body[7-12] (6 bytes) — alias kept raw.
   * Equals `sampleModelId`; retained for RE tooling that addressed it by range.
   */
  readonly _sampleRefHash: Uint8Array;
  /**
   * Pre-drawbar cluster: body[17-33] (17 bytes, sparse).
   * Wraps sectionFlags17, nibble fields at [26]/[33], flagByte19, and the
   * preset-1 drawbars. Kept raw for RE.
   */
  readonly _organSection: Uint8Array;
  /**
   * Extra nibble group: body[71-74] (4 bytes).
   * CANDIDATE: default [8,0,0,0,0,0,0,0] (7 nibbles), Walk of Life [4,0,1,6,4,8,1,0].
   * May be a 4th drawbar set or FX nibble region.
   */
  readonly _extraNibbleGroup: Uint8Array;
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
