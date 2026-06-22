/**
 * Nord Piano 5 (`.np5p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 25 fixtures × 237-byte bodies):
 *   - CBIN header: slot @0x0e, category @0x10, version @0x14 (1.01)
 *   - format_tag: body[3-4] = 0x65 0x0c (LE16 = 0x0c65), constant NP5 body sub-format ID
 *   - layer_b_active: body[7] bit 3 (mask 0x08): 1 = layer B active
 *
 * Candidate fields (strong corpus evidence, not yet confirmed by differential RE):
 *   - body[5-6] — likely 16-bit program/sound reference ID
 *   - Cluster B (body[18-32]) — primary program parameters (volume, transpose, arp, FX routing)
 *   - Cluster C (body[58-66]) — layer A sound slot (9 bytes, type-marker 0x1f at body[57])
 *   - Cluster D (body[90-98]) — layer B sound slot (same 9-byte layout as C)
 *   - Cluster E (body[122-135]) — layer A FX/EQ (14 bytes, type-marker 0x39 at body[121])
 *   - Cluster F (body[180-193]) — layer B FX/EQ (14 bytes, type-marker 0x39 at body[179])
 *
 * Body structure: record-oriented — each sound/FX record is preceded by a
 * type-marker byte and padded to 32 bytes (sound) or 58 bytes (FX) with zeros.
 * 175 of 237 body bytes are constant across all 25 fixtures (74%).
 *
 * Source: 25-file corpus statistical analysis (2026-06-22).
 */

/**
 * Layer A or B sound slot — the 9-byte record at body[58-66] (layer A)
 * or body[90-98] (layer B), preceded by type-marker 0x1f.
 *
 * The default/inactive pattern is: bf 80 00 12 05 09 53 e0 00.
 * Bytes [3-6] = 12 05 09 53 recur in ~52% of patches and may represent
 * the standard grand-piano sample bank reference.
 */
export interface Np5SoundSlot {
  /** Raw 9-byte sound-slot payload — pending differential RE for field layout. */
  readonly _raw: Uint8Array;
}

/**
 * Layer A or B FX/EQ slot — the 14-byte record at body[122-135] (layer A)
 * or body[180-193] (layer B), preceded by type-marker 0x39.
 *
 * Byte[12] (body[134] / body[192]) takes values 0x20/0x28/0x30 — likely
 * a per-layer transpose or octave offset (bits 3-4, with bit 5 always set).
 * Byte[13] (body[135] / body[193]) takes 0x00 or 0x80 — purpose unknown.
 */
export interface Np5FxSlot {
  /** Raw 14-byte FX/EQ payload — pending differential RE for field layout. */
  readonly _raw: Uint8Array;
}

/**
 * Decoded Nord Piano 5 program.
 *
 * `parsed: true` marks this as a genuine NP5 decode.
 * Consumers should narrow on `parsed` before accessing NP5-specific fields.
 */
export interface Np5Program {
  readonly parsed: true;
  /** Program version string derived from CBIN versionRaw, e.g. "1.01". */
  readonly version: string;

  // ── Confirmed fields ────────────────────────────────────────────────────────

  /**
   * NP5 body sub-format tag — confirmed constant 0x0c65 (LE16 = bytes 0x65 0x0c)
   * across all 25 fixtures. Body bytes [3-4].
   */
  readonly formatTag: number;

  /**
   * Layer B active flag — body[7] bit 3 (mask 0x08).
   * True for the 4 confirmed dual-layer patches:
   * Grand_EP_Bass, Harp_Piano, PianoSynthB, Shimmer_Piano.
   * Confirmed by corpus differential RE (2026-06-22).
   */
  readonly layerBActive: boolean;

  // ── Candidate fields (meaningful names; layout pending differential RE) ─────

  /**
   * Layer A sound slot — body[58-66], type-marker 0x1f at body[57].
   * Encodes which piano/EP/synth sound is loaded for layer A.
   * Candidate: 9-byte record mirrors cluster D (layer B).
   */
  readonly soundSlotLayerA: Np5SoundSlot;

  /**
   * Layer B sound slot — body[90-98], type-marker 0x1f at body[89].
   * Structurally identical to layer A slot. Default/inactive pattern:
   * bf 80 00 12 05 09 53 e0 00 (present in 12 of 25 patches).
   */
  readonly soundSlotLayerB: Np5SoundSlot;

  /**
   * Layer A FX/EQ slot — body[122-135], type-marker 0x39 at body[121].
   * Candidate: compressor, reverb type/amount, EQ, transpose offset.
   */
  readonly fxSlotLayerA: Np5FxSlot;

  /**
   * Layer B FX/EQ slot — body[180-193], type-marker 0x39 at body[179].
   * Structurally mirrors layer A FX slot.
   */
  readonly fxSlotLayerB: Np5FxSlot;

  // ── Raw clusters for RE tooling ─────────────────────────────────────────────

  /**
   * body[5-7] — 3 raw bytes. Program header / sound-ref cluster.
   * body[5-6] vary per program (possible 16-bit sound reference ID);
   * body[7] carries the layer-B active flag (bit 3) and always has bit 5 set.
   */
  readonly _programHeader: Uint8Array;

  /**
   * body[18-32] — 15 raw bytes. Primary program parameters.
   * Candidate: master volume/level, transpose, MIDI channel, arpeggiator, FX routing.
   * Needs differential RE to pin individual fields.
   */
  readonly _primaryParams: Uint8Array;

  /** Full raw body for RE tooling (237 bytes). */
  readonly _rawBody: Uint8Array;

  /** RE notes and decode anomalies. */
  readonly warnings: readonly string[];

  /**
   * Original file bytes — kept so undecoded data is never lost and USB transfer
   * can round-trip the file without re-encoding.
   */
  bytes: Uint8Array;

  /** Program name — NOT stored in the file body, injected from the filename on import. */
  name?: string;
}
