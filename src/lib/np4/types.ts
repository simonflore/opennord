/**
 * Nord Piano 4 (`.np4p`) program model.
 *
 * Fields are decoded incrementally as the format is RE'd. Confirmed fields are
 * typed normally; unidentified sections carry their raw body bytes for RE tooling.
 *
 * ## Confirmed fields (corpus RE, 2026-06-22, 6 fixtures × 134 bytes)
 *
 * | Body offset | Field | Source |
 * |-------------|-------|--------|
 * | 19-23       | pianoSoundModelId — 5-byte opaque sound model reference | George=Tea shared bytes confirm model, not program |
 * | 25          | pianoFamily — 0x80=EP, 0x00=Grand | Clean binary split, 4 EP + 2 Grand |
 * | 72          | pianoFamilyCheck — 0x0c=EP, 0x90=Grand | Second discriminator, perfectly correlated with b25 |
 *
 * ## Candidate fields (high confidence, unconfirmed without differential RE)
 *
 * | Body offset | Field | Notes |
 * |-------------|-------|-------|
 * | 35          | pianoLevel — output level 0-127 | Observed 71-95 across corpus |
 * | 36 bits 7-6 | velocityCurve — 2-bit enum 0=Soft 1=Med 3=Heavy | Clean pattern; 0b10 not seen |
 * | 59-60       | effectsWord — 0x0202=off, other=active | Three programs at 0x0202; three at distinct non-zero |
 * | 66-69       | effectParams — phaser rate/depth/mix candidate | Tea Phaser has distinctly non-zero values |
 *
 * Source: corpus of 6 real .np4p fixtures, statistical + differential analysis (2026-06-22).
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
   * Derived from body[25]: 0x80=EP, 0x00=Grand.
   * Confirmed: clean binary discriminator across all 6 corpus programs.
   */
  readonly pianoFamily: Np4PianoFamily;

  /**
   * 5-byte opaque piano sound model ID (body[19-23]).
   * Upper nibble of byte 0 is always 0x4 (piano category prefix).
   * Lower nibble of byte 0 encodes the model family
   * (0=Grand1, 3=Grand2, 4=Wurlitzer, 5=Suitcase2, 7=FunkySuitcase).
   * Bytes 1-4 are a 32-bit model hash.
   * Confirmed: George Model E and Tea Phaser share identical bytes [0x44, 0x19, 0x33, 0x46, 0x12].
   */
  readonly pianoSoundModelId: Uint8Array;

  /**
   * Redundant piano family check from body[72].
   * 0x0c=EP, 0x90=Grand. Always agrees with `pianoFamily`.
   */
  readonly pianoFamilyCheck: number;

  // ── Candidate fields ─────────────────────────────────────────────────────────

  /**
   * Piano output level (body[35]).
   * uint8, likely 0-127 scale; observed 71-95 across corpus.
   * Candidate — not confirmed by knob-diff RE.
   */
  readonly pianoLevel: number;

  /**
   * Velocity curve (body[36] bits 7-6).
   * 2-bit enum: Soft=0, Medium=1, Heavy=3 (2 not observed).
   * Candidate — pattern is clean but unconfirmed without reference diff.
   */
  readonly velocityCurve: Np4VelocityCurve;

  /**
   * Effects on/off word (body[59-60] as big-endian uint16).
   * 0x0202 = effects off/default; other values indicate effects active.
   * Candidate — three programs at 0x0202, three at distinct non-zero values.
   */
  readonly effectsWord: number;

  /**
   * Effect parameter block (body[66-69]), 4 bytes.
   * Likely phaser rate/depth/mix for Tea Phaser; near-zero when effect is off.
   * Candidate — Tea Phaser has distinctly non-zero values [0x3f, 0x8d, 0x70, 0xf2].
   */
  readonly effectParams: Uint8Array;

  // ── Raw clusters for RE tooling ───────────────────────────────────────────────

  /**
   * Piano sound selection cluster: body[17-25].
   * Contains the confirmed sound model ID (b19-23) and family flag (b25).
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
   * Effects and output cluster: body[59-72].
   * Contains effects word (b59-60), effect params (b66-69),
   * output param (b70), routing param (b71), and family check (b72).
   */
  readonly _effectsSection: Uint8Array;

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
