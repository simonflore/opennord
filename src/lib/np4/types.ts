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
 * ## Confirmed fields (Stage oracle alignment, 2026-06-22, 6 fixtures × 134 bytes)
 *
 * | Body offset | Field | Stage oracle param | Source |
 * |-------------|-------|--------------------|--------|
 * | 19-23       | pianoModelId — 5-byte model reference | 245-5 piano model ID/name [32b], group p | George=Tea shared bytes confirm model, not program |
 * | 25          | pianoFamily — bit7: 1=EP, 0=Grand | 244-3 piano type [3b], group p (binarized) | Clean binary split, 4 EP + 2 Grand |
 * | 72          | pianoFamilyCheck — 0x0c=EP, 0x90=Grand | 244-3 piano type [3b], group p (redundant) | Second discriminator, perfectly correlated with b25 |
 *
 * ## Candidate fields (high confidence, unconfirmed without differential RE)
 *
 * | Body offset | Field | Stage oracle param | Notes |
 * |-------------|-------|--------------------|-------|
 * | 35          | pianoLevel — output level 0-127 | 230-7 volume [7b], group p | Observed 71-95 across corpus; bit7 always clear |
 * | 36 bits 7-6 | velocityCurve — 2-bit enum | 249-8 touch [2b], group p | 0,1,3 observed; label mapping unverified |
 * | 59-60       | fxModWord — big-endian uint16 FX-mod region head | 267-1 FX mod 1 on/off + 275-5 FX mod 2 on/off | Region sound; no clean isolated on/off bit |
 * | 66-69       | fxModParams — 4-byte FX modulation block | 267-3 FX mod 1 rate [7b] / 271-2 FX mod 1 amount [7b] | Tea Phaser distinctly non-zero |
 *
 * Source: 6 real .np4p fixtures aligned against the Stage piano (group p) param map (2026-06-22).
 */

/** Piano family: which instrument type is loaded in this program. */
export type Np4PianoFamily = 'EP' | 'Grand';

/** Velocity curve setting (byte 36 bits 7-6). */
export type Np4VelocityCurve = 'Soft' | 'Medium' | 'Heavy' | 'Unknown';

/**
 * Decoded Nord Piano 4 program.
 *
 * `parsed: true` marks this as a genuine NP4 decode.
 * Consumers should narrow on `parsed` before accessing NP4-specific fields.
 */
export interface Np4Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "1.00". */
  readonly version: string;

  // ── Confirmed fields ────────────────────────────────────────────────────────

  /**
   * Piano family (EP vs Grand).
   * Stage oracle: 244-3 piano type [3b], group p (binarized in np4).
   * Derived from body[25] bit7: 1=EP/Electric family, 0=Grand family.
   * (np4 collapses the Stage 3-bit piano-type enum to a single discriminating
   * flag; the full type is implied by the model-family nibble at body[19].)
   * Confirmed: clean binary discriminator across all 6 corpus programs;
   * redundantly confirmed by `pianoFamilyCheck` (body[72]).
   */
  readonly pianoFamily: Np4PianoFamily;

  /**
   * 5-byte piano model reference (body[19-23]).
   * Stage oracle: 245-5 piano model ID/name [32b], group p.
   * body[19] = 0x4N: high nibble 0x4 is the piano category prefix; low nibble N
   * is the model-family selector (0=Grand1, 3=Grand2, 4=Wurlitzer, 5=Suitcase2,
   * 7=FunkySuitcase). body[20-23] are the Stage 32-bit modelID (the model hash).
   * Confirmed: George Model E and Tea Phaser (two different Wurlitzer EP programs)
   * share identical bytes [0x44, 0x19, 0x33, 0x46, 0x12] — proves it identifies
   * the MODEL, not the program.
   */
  readonly pianoModelId: Uint8Array;

  /**
   * Model-family selector — low nibble of body[19].
   * Derived from `pianoModelId[0] & 0x0f`. Distinguishes models within a family
   * (e.g. Grand1 vs Grand2, Wurlitzer vs Suitcase2 vs FunkySuitcase).
   * Confirmed: 4,4,7,5,3,0 across [George, Tea, Funky, Jazz, Corea, Utility].
   */
  readonly pianoModelFamily: number;

  /**
   * Redundant piano family check from body[72].
   * Stage oracle: 244-3 piano type [3b], group p (second copy in the FX/output
   * sub-block). 0x0c=EP, 0x90=Grand. Always agrees with `pianoFamily`.
   */
  readonly pianoFamilyCheck: number;

  // ── Candidate fields ─────────────────────────────────────────────────────────

  /**
   * Piano output level (body[35]).
   * Stage oracle: 230-7 volume [7b], group p.
   * 7-bit value, 0-127 scale (bit7 always clear); observed 71-95 across corpus.
   * Candidate — not confirmed by knob-diff RE.
   */
  readonly pianoLevel: number;

  /**
   * Velocity curve / touch (body[36] bits 7-6).
   * Stage oracle: 249-8 touch [2b], group p.
   * 2-bit enum: Soft=0, Medium=1, Heavy=3 (2 not observed).
   * Candidate — value range fits a 2-bit field but the value→label mapping is
   * unverified (no semantic differential).
   */
  readonly velocityCurve: Np4VelocityCurve;

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
   * Contains the confirmed model ID (b19-23) and family flag (b25).
   * Bytes 17-18 and 24 carry per-program variation (transpose/tuning candidate).
   */
  readonly _soundSection: Uint8Array;

  /**
   * Piano engine parameters cluster: body[35-47].
   * Contains confirmed level (b35) and velocity curve (b36 bits 7-6).
   * Bytes 37-47 likely encode pedal noise, string resonance, release, cabinet, etc.
   */
  readonly _pianoParams: Uint8Array;

  /**
   * FX and output cluster: body[59-72].
   * Contains the FX-mod word (b59-60), FX-mod params (b66-69),
   * output param (b70), routing param (b71), and family check (b72).
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
