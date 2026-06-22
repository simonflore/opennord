/**
 * Nord Electro 4 (`.ne4p`) program model.
 *
 * Fields are decoded incrementally as the format is RE'd. Confirmed fields are
 * typed normally; unconfirmed sections carry their raw body bytes so the decode
 * inspector can still display them.
 *
 * Confirmed (corpus RE + cross-model Stage-oracle alignment, 2026-06-22, 16
 * fixtures × 136 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=103 → 1.03, all files)
 *   - Body 92 bytes; very sparse — 33/92 bytes vary; long zero-padding runs between params
 *   - Three organ drawbar slots: body[4-8] (default 1), body[16-20] (active/edited),
 *     body[25-29] (default 2). Each is 9 nibble-packed values (0-8), high-nibble-first
 *     (identical scheme to NE6 at body[143-147]).
 *     Stage oracle: params 117-1..136-1 "drawbar 1..9" (group o).
 *
 * Source: 16-file corpus statistical analysis + Stage-line oracle field map (2026-06-22).
 */

/** One set of 9 Hammond drawbar positions (16' … 1'). Each is 0-8. */
export interface Ne4Drawbars {
  /** [16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'] — values 0-8. */
  bars: readonly number[];
  /** Trailing 4-bit nibble packed after the 9th drawbar — purpose not yet decoded. */
  _trailing: number;
}

/**
 * Organ section for the NE4.
 *
 * The NE4 stores three drawbar slots — Electro's two organ presets plus the
 * live/edited registration. `presetDefault1` (body[4-8]) and `presetDefault2`
 * (body[25-29]) are byte-identical factory-default blocks across all 16 corpus
 * files; `active` (body[16-20]) tracks patch identity and is the block the user
 * actually edits.
 *
 * Stage oracle for all three: params 117-1..136-1 "drawbar 1..9" (group o).
 */
export interface Ne4Organ {
  /**
   * Active / edited upper-manual drawbars — body[16-20].
   * Confirmed by 16-fixture corpus differential RE; tracks patch identity.
   * Stage oracle: 117-1..136-1 drawbar 1..9 (group o, layer-2 variant begBit 1176+).
   */
  active: Ne4Drawbars;
  /**
   * Default organ-preset slot 1 — body[4-8].
   * Constant across all 16 corpus files (factory default = 8,8,0,0,0,0,0,8,8);
   * a byte-for-byte twin of the body[25-29] block.
   * Stage oracle: 117-1..136-1 drawbar 1..9 (group o).
   */
  presetDefault1: Ne4Drawbars;
  /**
   * Default organ-preset slot 2 — body[25-29].
   * Constant across all 16 corpus files; identical to body[4-8].
   * Stage oracle: 117-1..136-1 drawbar 1..9 (group o).
   */
  presetDefault2: Ne4Drawbars;
  /**
   * Vib/chorus + percussion flags candidate — body[20]lo + body[21].
   * Stage oracle: 141-1 vib/chorus on/off, 141-2 percussion on/off, 141-3 perc
   * harm 3rd, 141-4 perc decay fast, 141-5 perc vol soft (group o). In the Stage
   * catalog these 5 single-bit flags fall immediately after drawbar 9, exactly
   * where body[20]lo/body[21] sit. body[21]lo is constrained to 4/6 and body[20]lo
   * to 0/10/11 — small ranges consistent with packed flags. 9 drawbar nibbles =
   * 36 bits is NOT byte-aligned, so exact bit positions are unverified (candidate);
   * raw nibbles are exposed for the inspector.
   *   [0] = body[20]lo, [1] = body[21]hi, [2] = body[21]lo
   */
  _vibPercFlags: readonly [number, number, number];
  /**
   * @deprecated Alias of `active`. Kept so existing decode-inspector / test code
   * referencing `upper` continues to resolve.
   */
  upper: Ne4Drawbars;
  /**
   * @deprecated Alias of `_vibPercFlags`. Kept for backward compatibility.
   */
  _extraNibs: readonly [number, number, number];
}

/**
 * Sample (Piano/Sample section) reference + voice params.
 *
 * The Electro sample section reuses the Stage piano model-ID encoding: a high-
 * entropy ID identifying the loaded factory sample set, followed by per-sound
 * voice parameters (touch/timbre/level).
 */
export interface Ne4Sample {
  /**
   * Factory sample-set reference ID — body[37-41] (~40-bit raw ID), exposed as
   * its 5 raw bytes. Programs built on the same sample set share these bytes;
   * sibling sounds differ only in the low bytes. No name table to resolve the ID
   * yet, so it stays a raw reference (candidate).
   * Stage oracle: piano model ID/name [32b] (group p, e.g. 152-x model ID); the
   * Electro sample section reuses the piano model-ID encoding.
   */
  refId: Uint8Array;
  /**
   * Per-sound voice parameters — body[43-44] (level / timbre / zone).
   * In the sq1-vs-sq2 differential (same sample set, two different sounds) these
   * two bytes change while the refId stays fixed — i.e. sound-level edits layered
   * on the same sample. Exact field split unverified (candidate).
   * Stage oracle: piano touch/timbre/level family (group p, e.g. 159-x timbre,
   * 095-7 volume).
   */
  voiceParams: Uint8Array;
}

export interface Ne4Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "1.03". */
  readonly version: string;
  /**
   * Section enable / program-mode flags — body[0] (1-byte bitfield).
   * Observed: 0x04 (default, 13/16 files), 0x38, 0xf6. 3 distinct values across
   * corpus, consistent with a small section/mode bitfield; correlates loosely with
   * sample-set/category (0x38/0xf6 only on 'Lead Samples' files). Exact bit map
   * unverified (candidate).
   * Stage oracle: 084-5 organ section on/off + 084-6 piano section on/off + 084-7
   * synth section on/off (group m). Electro omits synth, so the precise layout
   * differs from the Stage 3-bit section-enable field.
   */
  readonly sectionFlags: number;
  /** Organ section: three drawbar slots + vib/perc flags candidate. */
  readonly organ: Ne4Organ;
  /** Piano/Sample section: factory sample reference ID + voice params. */
  readonly sample: Ne4Sample;
  /**
   * Sample/synth section parameters: body[37-45] (9 bytes).
   * Superset of `sample.refId` (body[37-41]); kept as raw bytes for the inspector
   * until the remaining fields (body[42], 45) are pinned by differential RE.
   */
  readonly _organSection: Uint8Array;
  /**
   * Secondary program parameters: body[51-63] (13 bytes).
   * High variance; patches from the same sample set share a common prefix.
   * Likely: zone params, voice-level settings. Kept as raw bytes.
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
   * @deprecated Use `sectionFlags`.
   */
  readonly _byte0: number;
  /**
   * @deprecated Use organ, sample, _organSection, _sampleSection, _tail0, _tail1, _tail23.
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
