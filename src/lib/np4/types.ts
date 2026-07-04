/**
 * Nord Piano 4 (`.np4p`) program model.
 *
 * Fields are decoded incrementally as the format is RE'd. Confirmed fields are
 * typed normally; unidentified sections carry their raw body bytes for RE tooling.
 *
 * Field names + offsets are derived by aligning the np4 corpus against the Stage
 * piano oracle param map (cross-model mapping, 2026-06-22). The Stage oracle is a
 * REFERENCE we transcribe from — never a runtime import (lib/ns4 is off-limits here).
 *
 * ## Confirmed fields (Ondre bundle meta.xml 2026-07-04, re-validated over the
 * ## 212-file factory-restore corpus)
 *
 * | Body offset | Field | Source |
 * |-------------|-------|--------|
 * | 19 lo-nibble | pianoSlot — piano partition slot | Matches the paired .npno's CBIN slot byte @0x0e, 6/6 bundle pairs |
 * | 20-24 bit1  | pianoModelId — family-wide 32-bit model id | BE(body[20:24])·4 + body[24]>>6; resolves via PIANO_NAMES to the correct piano name across the corpus |
 *
 * ## Candidate fields
 *
 * | Body offset | Field | Notes |
 * |-------------|-------|-------|
 * | 59-60       | fxModWord — big-endian uint16 FX-mod region head | Region sound; no clean isolated on/off bit |
 * | 66-69       | fxModParams — 4-byte FX modulation block | Tea Phaser distinctly non-zero |
 *
 * ## Falsified by the 212-file re-census (2026-07-04)
 *
 * The 6-file corpus produced spurious "confirmed" fields — all removed:
 * body[25] bit7 pianoFamily (doesn't track modelId→name family), body[72]
 * pianoFamilyCheck (16 values, not a 0x0c/0x90 binary), body[35] pianoLevel
 * (sample-section data, not a level), body[36] velocityCurve (sample section).
 * See decode.ts for the census figures.
 */

/**
 * Decoded Nord Piano 4 program.
 *
 * `parsed: true` marks this as a genuine NP4 decode.
 * Consumers should narrow on `parsed` before accessing NP4-specific fields.
 */
export interface Np4Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "1.00" or "1.01". */
  readonly version: string;

  // ── Confirmed fields (bundle-validated over the 212-file corpus) ─────────────

  /**
   * Family-wide 32-bit piano model id, MSB-packed with a 2-bit continuation:
   * BE(body[20:24])·4 + (body[24]>>6). Same id space as the Stage 4 piano
   * model id (ns4 PIANO_NAMES resolves it — resolution happens at the
   * presenter layer; ns4 is transcribe-only inside this module).
   * Confirmed 2026-07-04 vs the Ondre bundle meta.xml and re-validated over the
   * 212-file factory-restore corpus (George Model E & Tea Phaser → 1691162699 =
   * "EP5 BrightTines XL" — they share the same piano).
   */
  readonly pianoModelId: number;

  /**
   * The piano's partition slot — low nibble of body[19] (high nibble 0x4 is
   * the piano-section prefix). Matches the paired .npno's CBIN slot byte
   * (@0x0e) for all 6 bundle pairs: 4,4,7,5,3,0 across [George, Tea, Funky,
   * Jazz, Corea, Utility].
   */
  readonly pianoSlot: number;

  // ── Candidate fields ─────────────────────────────────────────────────────────

  /**
   * FX-mod region head word (body[59-60] as big-endian uint16).
   * Stage oracle: 267-1 FX mod 1 on/off + 275-5 FX mod 2 on/off region, group p.
   * Bit-packed FX-mod enable/rate field at the head of the FX sub-block (the
   * 0x1f marker at body[58] precedes it). NOTE: the earlier "0x0202 = FX off"
   * reading is DISPROVEN — Tea Phaser (an active phaser) also reads 0x0202, so
   * 0x0202 is not an off sentinel. Region placement is sound; no single bit
   * isolates a clean, verifiable FX-mod on/off flag.
   * Candidate — region confirmed, field decode not.
   */
  readonly fxModWord: number;

  /**
   * FX modulation parameter block (body[66-69]), 4 bytes.
   * Stage oracle: 267-3 FX mod 1 rate [7b] / 271-2 FX mod 1 amount [7b], group p.
   * Bit-packed rate/amount/mode for the piano FX mod section; near-zero when the
   * effect is inactive.
   * Candidate — Tea Phaser is distinctly non-zero [0x3f, 0x8d, 0x70, 0xf2]
   * (active phaser); dry Grand presets trend toward 00 00 0X 02. Block confirmed
   * to carry FX data; individual rate/amount/mode boundaries unresolved.
   */
  readonly fxModParams: Uint8Array;

  // ── Raw clusters for RE tooling ───────────────────────────────────────────────

  /**
   * Piano sound selection cluster: body[17-25].
   * Contains the confirmed slot (b19 lo-nibble) and model id (b20-b24 bit1).
   * Bytes 17-18, b25 and the low 6 bits of b24 carry per-program variation
   * (b25 was a falsified "family flag" — see decode.ts re-census notes).
   */
  readonly _soundSection: Uint8Array;

  /**
   * Sample-synth section: body[35-47].
   * Holds a device-generated sample reference (hash family — every bundle
   * program declares exactly one .nsmp3 dep, and the George-vs-Tea same-piano
   * diff covers this region contiguously) plus sample params. High-entropy
   * across the corpus; not a set of clean scalar fields.
   */
  readonly _sampleSection: Uint8Array;

  /**
   * FX and output cluster: body[59-72].
   * Contains the FX-mod word (b59-60) and FX-mod params (b66-69); the rest is
   * unidentified (b72 was a falsified "family check").
   */
  readonly _fxSection: Uint8Array;

  /** Full raw body for RE tooling. */
  readonly _rawBody: Uint8Array;
  /** RE notes and decode anomalies. */
  readonly warnings: readonly string[];
  /**
   * Original file bytes — kept so undecoded data is never lost and USB transfer
   * can round-trip the file without re-encoding.
   */
  bytes: Uint8Array;
  /** Program name — NOT stored in the file, injected from the filename on import. */
  name?: string;
}
