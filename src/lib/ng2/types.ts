/**
 * Nord Grand 2 (`.ng2p`) program model.
 *
 * Fields are decoded incrementally as the format is RE'd. Confirmed/candidate
 * fields are typed normally; unidentified sections are kept as raw Uint8Array
 * clusters so the decode inspector can still display them.
 *
 * ## Structure overview (20-file corpus RE, 2026-06-22)
 *
 * The 185-byte body uses a TLV-style section layout: every data cluster is
 * preceded by a constant separator whose last byte is a section-type tag
 * (0x05 = 1-byte payload, 0x0d = 9-byte, 0x14 = 14-byte, 0x15 = 16-byte).
 * Data clusters appear in symmetric Layer A / Layer B pairs at consistent
 * body offsets.
 *
 * ## Candidate fields (corpus RE)
 *
 * | Body offset | Field                  | Confidence  |
 * |-------------|------------------------|-------------|
 * | 8 bit7      | layerB_activeFlag      | candidate   |
 * | 16 bits[7:5]| globalParam1           | candidate   |
 * | 94 bits[7:5]| globalParam2           | candidate   |
 * | 101         | layerA.pianoModel      | candidate   |
 * | 122         | layerB.pianoModel      | candidate   |
 *
 * Source: 20-file corpus statistical analysis (2026-06-22).
 */

/**
 * Parameters decoded from the Layer A or Layer B effects cluster (D1/D2,
 * body[100-113] / body[121-134]).
 */
export interface Ng2LayerEffects {
  /**
   * Piano model/voice bank index (uint8, values 1–18 in corpus).
   * body[101] for Layer A (D1[1]), body[122] for Layer B (D2[1]).
   * Candidate: small-integer distribution matches Nord Grand 2 piano voice count.
   */
  pianoModel: number;
  /** Raw cluster bytes for RE tooling (14 bytes). */
  _raw: Uint8Array;
}

/**
 * Decoded Nord Grand 2 program.
 *
 * `parsed: true` marks this as a genuine NG2 decode.
 * Consumers should narrow on `parsed` before accessing NG2-specific fields.
 */
export interface Ng2Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "1.02". */
  readonly version: string;

  // ── Candidate global fields ──────────────────────────────────────────────

  /**
   * Layer B active / alternate mode flag (body[8] bit7).
   * True in exactly 4 corpus programs (Duet, Stacked, Subway, Tspoon).
   * Candidate: may indicate an enhanced Layer B mode (sustain/octave-split),
   * rather than enabling Layer B altogether (Layer B data is present in many
   * programs where this is false).
   */
  readonly layerBActiveFlag: boolean;

  /**
   * Global parameter 1 — top 3 bits of body[16] (values 0–7).
   * body[16] has lower 5 bits always 0; only bits[7:5] carry data.
   * Candidate interpretation: master transpose semitones or program-level flag.
   * Needs differential RE to pin semantics.
   */
  readonly globalParam1: number;

  /**
   * Global parameter 2 — top 3 bits of body[94] (values 0–7).
   * Same bit packing as globalParam1. Differs from globalParam1 in 14/20 corpus
   * programs, indicating it tracks a separate parameter (possibly octave shift).
   */
  readonly globalParam2: number;

  // ── Candidate layer fields ───────────────────────────────────────────────

  /** Layer A effects section — contains pianoModel and raw cluster bytes. */
  readonly layerA: Ng2LayerEffects;
  /** Layer B effects section — contains pianoModel and raw cluster bytes. */
  readonly layerB: Ng2LayerEffects;

  // ── Raw clusters (named by role, not yet fully decoded) ──────────────────

  /**
   * body[5-8] — 4 bytes. Global header cluster (ClusterA).
   * byte[3] = layerBActiveFlag source; byte[1] high nibble always 0x1.
   */
  readonly _globalHeaderCluster: Uint8Array;
  /**
   * body[22-30] — 9 bytes. Layer A primary parameters (ClusterB1).
   * Default pattern: 00 84 00 24 0a 12 a7 b4 00 across 9 corpus programs.
   */
  readonly _layerAPrimaryCluster: Uint8Array;
  /**
   * body[36-44] — 9 bytes. Layer B primary parameters (ClusterB2).
   * Mirror of B1 for Layer B; 5 corpus programs match B1's default pattern.
   */
  readonly _layerBPrimaryCluster: Uint8Array;
  /**
   * body[50-65] — 16 bytes. Layer A extended parameters (ClusterC1).
   * Default prefix 40 80 08 10; last byte is a per-program sub-identifier.
   */
  readonly _layerAExtendedCluster: Uint8Array;
  /**
   * body[72-87] — 16 bytes. Layer B extended parameters (ClusterC2).
   * Mirror of C1 for Layer B; last byte (body[87]) = per-program sub-identifier.
   */
  readonly _layerBExtendedCluster: Uint8Array;
  /**
   * body[142-157] — 16 bytes. Layer A final section (ClusterE1).
   * Same sub-structure as C1; last byte (body[157]) = program sub-identifier.
   */
  readonly _layerAFinalCluster: Uint8Array;
  /**
   * body[164-179] — 16 bytes. Layer B final section (ClusterE2).
   * Mirror of E1; last byte (body[179]) matches body[157] in 12/20 programs.
   */
  readonly _layerBFinalCluster: Uint8Array;

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
