/**
 * Nord Piano 5 (`.np5p`) program model.
 *
 * Field names map to Stage oracle params (group p = piano section) by cross-model
 * alignment; CLAUDE.md requires every decoded field be traceable to its source.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 25 fixtures × 237-byte bodies):
 *   - CBIN header: slot @0x0e, category @0x10, version @0x14 (1.01)
 *   - formatTag: body[3-4] = 0x65 0x0c (LE16 = 0x0c65), constant NP5 body sub-format ID
 *   - layerBActive: body[7] bit 3 (mask 0x08) — Stage 230-3 layer on/off (group p)
 *   - soundSlotLayer{A,B}.pianoModelId: body[61-64]/[93-96] — Stage 245-5 (group p)
 *
 * Candidate fields (strong corpus evidence, not yet confirmed by differential RE):
 *   - body[5-6] — likely 16-bit program/sound reference ID
 *   - Cluster B (body[18-32]) — primary program parameters (volume, transpose, arp, FX routing)
 *   - soundSlotLayer{A,B}.volume: body[58]/[90] — Stage 230-7 (group p)
 *   - soundSlotLayer{A,B}.pianoType: body[60]/[92] — Stage 244-3 (group p)
 *   - fxSlotLayer{A,B}.transpose: body[134]/[192] — Stage 243-5 (group p, tentative)
 *
 * Slot framing: layer A sound 0x1f @body[57] (payload body[58-66]); layer B sound
 * 0x1f @body[89]; layer A FX 0x39 @body[121] (payload body[122-135]); layer B FX
 * 0x39 @body[179].
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
 *
 * Named fields below are cross-model-mapped against the Stage oracle (group p,
 * the piano section). Confirmed = `pianoModelId`; candidate = `volume`/`pianoType`.
 */
export interface Np5SoundSlot {
  /**
   * Section volume — Stage oracle param 230-7 "volume" (group p). [candidate]
   * Slot payload byte 0 (body[58] layer A / body[90] layer B):
   * low 7 bits = level 0-127; high bit (0x80) = active/morph flag.
   * Default 0xbf (low7 = 63, the common Nord unity level) dominates the corpus.
   */
  readonly volume: number;

  /**
   * Active/morph flag carried in the high bit (0x80) of the volume byte.
   * Surfaced alongside `volume` since the two share a byte. [candidate]
   */
  readonly volumeActive: boolean;

  /**
   * Piano type — Stage oracle param 244-3 "piano type" (group p). [candidate]
   * 3-bit enum 0-7: 0=Grand 1=Upright 2=Electric 3=Clav 4=Digital 5=Misc
   * (per values.generated 244-3, shared with ns3 PIANO_TYPE). Read byte-aligned
   * from body[60]/[92] low 3 bits; the exact bit boundary is shifted by the
   * preceding sub-byte slot/variation field, so the label is approximate.
   */
  readonly pianoType: number;

  /**
   * Piano/EP model ID — Stage oracle param 245-5 "piano model ID/name"
   * (group p; cf. Piano 4 body[19-23]). [confirmed]
   * 32-bit high-entropy model identifier exposed as its 4 raw bytes
   * (body[61-64] layer A / body[93-96] layer B). Same instrument -> same ID
   * (e.g. EP_Flu and Wurlitzer both 1f af 44 88; default grand 12 05 09 53).
   * Bit-aligned (~body bit 489-492); byte-aligned read is a close approximation.
   */
  readonly pianoModelId: Uint8Array;

  /** Raw 9-byte sound-slot payload — kept for fields not yet pinned. */
  readonly _raw: Uint8Array;
}

/**
 * Layer A or B FX/EQ slot — the 14-byte record at body[122-135] (layer A)
 * or body[180-193] (layer B), preceded by type-marker 0x39.
 *
 * Byte[13] (body[135] / body[193]) takes 0x00 or 0x80 — purpose unknown.
 */
export interface Np5FxSlot {
  /**
   * Octave/transpose offset — Stage oracle param 243-5 "octave shift"
   * (group p) [tentative / candidate].
   * FX-slot byte 12 (body[134] layer A / body[192] layer B) takes only
   * 0x20/0x28/0x30 across the corpus with bit 5 (0x20) pinned; bits 3-4
   * encode the offset 0/1/2. Mapping to "octave shift" is tentative — the
   * value set is too narrow to confirm a centered octave field, and the byte
   * lives in the FX record so it may be an FX-local offset.
   */
  readonly transpose: number;

  /** Raw 14-byte FX/EQ payload — kept for fields not yet pinned. */
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
