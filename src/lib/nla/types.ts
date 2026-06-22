/**
 * Nord Lead A1 Sound (`.nlas`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 51 nlas fixtures × 123 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=7, all files)
 *   - Body 79 bytes at file offset 0x2c; a MIDI-style 7-bit-packed parameter
 *     BITSTREAM (NOT byte-aligned fields), beginning at bit 4 of body[0].
 *   - body[0] high nibble is a constant-0 header (verified: 0 in all 51 files).
 *   - bytes 77-78 are a 16-bit body checksum (50/51 distinct — max entropy,
 *     end-of-body, matches Clavia/CBIN checksum convention). Not a parameter.
 *   - Constant-0 section padding bytes: 32, 48-50, 53, 61, 71, 74-75
 *     (all verified const-0 across the corpus).
 *
 * Per-parameter attribution (which 7-bit slot = cutoff vs attack vs LFO rate)
 * is NOT derivable from this unlabeled corpus: every fixture is a distinct
 * finished patch (no single-knob-delta pairs) and field widths are mixed
 * (7-bit knobs interleaved with 1-3 bit enums/flags), so a fixed 7-bit grid
 * does not cleanly resolve every field. The candidate sections below are
 * ordering-based inferences from the standard Nord Lead front-panel layout
 * (osc → filter → envelopes → LFO/arp → FX/voice) and are passed through as
 * raw byte slices, prefixed `_` until differential RE pins the bit layout.
 *
 * Source: 51-file corpus statistical analysis (2026-06-22).
 */
export interface NlaProgram {
  readonly parsed: true;
  readonly version: string;
  /**
   * Constant-0 high nibble of body[0] — the bitstream header marker. The 7-bit
   * parameter stream begins immediately after, at bit offset 4. Confirmed 0 in
   * all 51 fixtures.
   */
  readonly headerNibble: number;
  /**
   * 16-bit body checksum (bytes 77-78, big-endian). 50/51 distinct across the
   * corpus — a CRC/checksum over the program data, not a parameter.
   */
  readonly checksum: number;
  /**
   * Oscillator + filter section (candidate). body[1-31], 31 bytes. By Nord
   * front-panel ordering this region most likely holds osc shape/config and
   * filter type/cutoff/resonance plus the amp/mod envelopes packed in. Raw
   * pending differential RE.
   */
  readonly _oscFilterSection: Uint8Array;
  /**
   * LFO / arpeggiator section (candidate). body[33-47], 15 bytes. Mix of
   * 1-2 bit enum flags and 7-bit values consistent with LFO rate/amount/
   * waveform + arp on/rate/mode. Raw pending differential RE.
   */
  readonly _lfoArpSection: Uint8Array;
  /**
   * Effects + voice/global section (candidate). body[51-76], 26 bytes (with
   * sparse constant-0 padding at 53, 61, 71, 74-75). Candidate for reverb/
   * delay/chorus/drive + voice mode/glide/unison/octave. Raw pending RE.
   */
  readonly _fxVoiceSection: Uint8Array;
  /** Full 79-byte body, for re-derivation and future field mapping. */
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
