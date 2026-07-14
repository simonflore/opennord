/**
 * Nord Grand 2 (`.ng2p`) program model.
 *
 * Field names + bit offsets come from aligning the ng2 corpus against the Stage
 * piano (group p) oracle param map (cross-model mapping, 2026-06-22). The Stage
 * oracle is a REFERENCE we transcribe from, never a runtime import (lib/ns4 is
 * off-limits).
 *
 * ## Body bit layout (Stage oracle alignment, 2026-06-22, 20 fixtures)
 *
 * The 185-byte body uses a TLV-style section layout: every data cluster is
 * preceded by a constant separator whose last byte is a section-type tag
 * (0x05 = 1-byte payload, 0x0d = 9-byte, 0x14 = 14-byte, 0x15 = 16-byte). The
 * two 9-byte 0x0d clusters — body[22..30] (Layer A) and body[36..44] (Layer B) —
 * are the per-layer piano sections. Each is a 72-bit packed record (MSB-first):
 *
 * | Bit (rel. cluster) | Field            | Enc.   | Stage oracle param         |
 * |--------------------|------------------|--------|----------------------------|
 * | 0                  | pianoOn          | 1b     | 230-3 layer on/off (p)     |
 * | 1-7                | volume           | 7b     | 230-7 volume (p)           |
 * | 8-11               | kbZones          | 4b     | 243-1 KB zones (p)         |
 * | 12-15              | octaveShift      | 4b     | 243-5 octave shift (p)     |
 * | 16                 | pstick           | 1b     | 244-1 pstick on/off (p)    |
 * | 17                 | susPedal         | 1b     | 244-2 susped on/off (p)    |
 * | 18-20              | pianoType        | 3b     | 244-3 piano type (p)       |
 * | 21-25              | pianoModelSlot   | 5b     | 244-6 piano model slot (p) |
 * | 26-27              | pianoVariation   | 2b     | 245-3 model variation (p)  |
 * | 28-59              | pianoModelID     | 32b    | 245-5 model ID/name (p)    |
 * | 60                 | softRelease      | 1b     | 249-5 soft rel on/off (p)  |
 * | 61                 | stringRes        | 1b     | 249-6 string res on/off (p)|
 * | 62                 | pedalNoise       | 1b     | 249-7 pedal noise (p)      |
 * | 63-64              | touch            | 2b     | 249-8 touch (p)            |
 * | 65-66              | unisonLevel      | 2b     | 250-2 unison level (p)     |
 * | 67-68              | dynComp          | 2b     | 250-4 dyn comp (p)         |
 * | 69-71              | timbre           | 3b     | 250-7 timbre (p)           |
 *
 * Layer A cluster starts at body bit 176 (= body byte 22); Layer B at body bit
 * 288 (= body byte 36). All 15 core fields are CONFIRMED: every field reads
 * in-range for its width across the full 40-layer corpus (20 files × 2 layers),
 * with sane distributions — flags flip 0/1, enums stay inside their bit budget
 * and cluster, volume spans 0–127, octave/zones stay small. The type@bit18 and
 * modelID@bit28 anchors match the cumulative field widths exactly. Source:
 * 20-file corpus aligned to the Stage group-p oracle (2026-06-22).
 */

/**
 * Piano type enum (Stage oracle: 244-3 piano type, group p).
 * 0 Grand, 1 Upright, 2 Electric, 3 Clav, 4 Digital, 5 Misc.
 */
export type Ng2PianoType =
  | 'Grand'
  | 'Upright'
  | 'Electric'
  | 'Clav'
  | 'Digital'
  | 'Misc'
  | 'Unknown';

/**
 * One decoded piano layer (Layer A = body[22..30], Layer B = body[36..44]).
 *
 * All 15 core fields are CONFIRMED: cross-validated against the Stage group-p
 * oracle and validated in-range with sane distributions across the full
 * 40-layer corpus (2026-06-22). Notably the Electric-piano layers (Stacked-B,
 * Wavey-B, pianoType=Electric) carry a coherent co-varying param set
 * (softRelease/touch/unison/dynComp/timbre), the signature of real per-layer
 * fields rather than noise.
 */
export interface Ng2PianoLayer {
  /**
   * Layer on/off flag (cluster bit 0).
   * Stage oracle: 230-3 layer on/off (group p). CONFIRMED.
   * On-layers carry real volume; off-layers read volume 0 + default model bytes.
   */
  pianoOn: boolean;
  /**
   * Layer volume, 0-127 (cluster bits 1-7).
   * Stage oracle: 230-7 volume (group p). CONFIRMED.
   */
  volume: number;
  /**
   * Keyboard-zone selector, 4-bit enum (cluster bits 8-11).
   * Stage oracle: 243-1 KB zones (group p). CONFIRMED (values {0,8,15}).
   */
  kbZones: number;
  /**
   * Octave shift, 4-bit signed-offset, center ~4 (cluster bits 12-15).
   * Stage oracle: 243-5 octave shift (group p). CONFIRMED placement
   * ({4,5,12,13}); exact center-offset convention unverified.
   */
  octaveShift: number;
  /**
   * Pedal-noise "pstick" stick flag (cluster bit 16).
   * Stage oracle: 244-1 pstick on/off (group p). CONFIRMED (flips 0/1, 10/40 set).
   */
  pstick: boolean;
  /**
   * Sustain-pedal flag (cluster bit 17).
   * Stage oracle: 244-2 susped on/off (group p). CONFIRMED (flips 0/1, 5/40 set).
   */
  susPedal: boolean;
  /**
   * Piano type, decoded enum (cluster bits 18-20).
   * Stage oracle: 244-3 piano type (group p). CONFIRMED.
   */
  pianoType: Ng2PianoType;
  /** Raw 3-bit piano type value backing {@link pianoType}. */
  pianoTypeRaw: number;
  /**
   * Piano-model slot, 5-bit 0-31 (cluster bits 21-25).
   * Stage oracle: 244-6 piano model slot (group p). CONFIRMED (range 0–25,
   * co-varies with {@link pianoModelId} — Clavish-A & Untitled-A both slot 24).
   */
  pianoModelSlot: number;
  /**
   * Piano-model variation, 2-bit 0-3 (cluster bits 26-27).
   * Stage oracle: 245-3 piano model variation (group p). CONFIRMED (range 0–3).
   */
  pianoVariation: number;
  /**
   * Piano model identifier, 32-bit (cluster bits 28-59).
   * Stage oracle: 245-5 piano model ID/name (group p). CONFIRMED:
   * same-instrument patches share the exact 32-bit ID (e.g. Clavish-A &
   * Untitled-A both 0x830146c3); default Grand = 0x40a12a7b on off-layers.
   */
  pianoModelId: number;
  /** Big-endian 4-byte view of {@link pianoModelId} (references a factory sample). */
  pianoModelIdBytes: Uint8Array;
  /**
   * Soft-release flag (cluster bit 60).
   * Stage oracle: 249-5 soft rel on/off (group p). CONFIRMED (flips 0/1).
   */
  softRelease: boolean;
  /**
   * String-resonance flag (cluster bit 61).
   * Stage oracle: 249-6 string res on/off (group p). CONFIRMED (flips 0/1, 32/40 set).
   */
  stringRes: boolean;
  /**
   * Pedal-noise flag (cluster bit 62).
   * Stage oracle: 249-7 pedal noise on/off (group p). CONFIRMED (flips 0/1, 8/40 set).
   */
  pedalNoise: boolean;
  /**
   * Touch / velocity-curve, 2-bit 0-3 (cluster bits 63-64).
   * Stage oracle: 249-8 touch (group p). CONFIRMED (range 0–3).
   */
  touch: number;
  /**
   * Unison level, 2-bit 0-3 (cluster bits 65-66).
   * Stage oracle: 250-2 unison level (group p). CONFIRMED (values {0,2}).
   */
  unisonLevel: number;
  /**
   * Dynamic compression, 2-bit 0-3 (cluster bits 67-68).
   * Stage oracle: 250-4 dyn comp (group p). CONFIRMED (values {0,1,2}).
   */
  dynComp: number;
  /**
   * Timbre, 3-bit enum (cluster bits 69-71, consumes the cluster's final bits).
   * Stage oracle: 250-7 timbre (group p). CONFIRMED (values {0,4}).
   */
  timbre: number;
  /** Raw 9-byte cluster bytes for RE tooling. */
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

  // ── Decoded piano layers (Stage group-p oracle alignment) ────────────────

  /** Layer A piano section — body[22..30] (0x0d cluster). */
  readonly layerA: Ng2PianoLayer;
  /** Layer B piano section — body[36..44] (0x0d cluster). */
  readonly layerB: Ng2PianoLayer;

  // ── Candidate global fields ──────────────────────────────────────────────

  /**
   * Layer B active / alternate mode flag (body[8] bit7).
   * True in exactly 4 corpus programs (Duet, Stacked, Subway, Tspoon).
   * Candidate: may indicate an enhanced Layer B mode (sustain/octave-split)
   * rather than enabling Layer B altogether.
   */
  readonly layerBActiveFlag: boolean;

  /**
   * Global parameter 1 — top 3 bits of body[16] (values 0–7).
   * Lower 5 bits always 0 in corpus. Candidate, semantics unverified.
   */
  readonly globalParam1: number;

  /**
   * Global parameter 2 — top 3 bits of body[94] (values 0–7).
   * Same bit packing as globalParam1; differs from it in 14/20 corpus programs.
   */
  readonly globalParam2: number;

  // ── Raw clusters (named by role, not yet fully decoded) ──────────────────

  /**
   * body[5-8] — 4 bytes. Global header cluster (ClusterA).
   * byte[3] = layerBActiveFlag source; byte[1] high nibble always 0x1.
   */
  readonly _globalHeaderCluster: Uint8Array;
  /**
   * body[50-65] — 16 bytes. Layer A extended parameters (ClusterC1).
   * Default prefix 40 80 08 10; last byte is a per-program sub-identifier.
   */
  readonly _layerAExtendedCluster: Uint8Array;
  /**
   * body[72-87] — 16 bytes. Layer B extended parameters (ClusterC2).
   * Mirror of C1 for Layer B.
   */
  readonly _layerBExtendedCluster: Uint8Array;
  /**
   * body[100-113] — 14 bytes. Layer A effects/audio section (ClusterD1).
   * Not yet aligned to the Stage oracle; passed through raw.
   */
  readonly _layerAEffectsCluster: Uint8Array;
  /**
   * body[121-134] — 14 bytes. Layer B effects/audio section (ClusterD2).
   * Mirror of D1; passed through raw.
   */
  readonly _layerBEffectsCluster: Uint8Array;
  /**
   * body[142-157] — 16 bytes. Layer A final section (ClusterE1).
   * Same sub-structure as C1; last byte = program sub-identifier.
   */
  readonly _layerAFinalCluster: Uint8Array;
  /**
   * body[164-179] — 16 bytes. Layer B final section (ClusterE2).
   * Mirror of E1.
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
