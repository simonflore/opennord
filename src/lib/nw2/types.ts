/**
 * Nord Wave 2 (`.nw2p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 26 fixtures × 1088 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, version @0x14 (3.01)
 *   - Four voice slots, each exactly 244 bytes (body[0-243], [244-487],
 *     [488-731], [732-975]), followed by a 68-byte global tail (body[976-1043]).
 *   - Drawbars: 5-byte nibble-packed regions per slot, 9 drawbars (NE6 encoding).
 *     Correct body offsets: slot0=143, slot1=387, slot2=631, slot3=875.
 *     Note: the original skeleton used off-by-one offsets (144/388/–/876).
 *
 * Drawbar encoding: 9 × 4-bit nibbles packed high-nibble-first across 5 bytes.
 *   bytes[0-3] = bars 1-8 (2 per byte), byte[4] high nibble = bar 9,
 *   byte[4] low nibble = trailing (always 0 in corpus).
 *   Default position across 25/26 factory programs: [3,7,3,7,3,7,3,7,0].
 *
 * Candidate fields (statistically derived, not yet hardware-validated):
 *   - local[77] = oscillator flag (0xfe=standard, 0xff=extended/wavetable)
 *   - local[78] = waveform bank (0=classic synth, 1=extended wavetables)
 *   - local[79] = waveform/wavetable index
 *
 * Source: 26-file corpus statistical analysis (2026-06-22).
 */

/** 9 drawbar positions (4-bit nibbles, 0-8 each) — identical encoding to NE6. */
export interface Nw2Drawbars {
  /** 9 drawbar values, bars 1-9 (standard Hammond order: 16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'). */
  readonly bars: readonly number[];
  /** Low nibble of byte 4 — always 0 in corpus; reserved for future RE. */
  readonly _trailing: number;
}

/**
 * Oscillator / waveform selection for one voice slot.
 * Source: corpus RE (2026-06-22); confidence = candidate (not hardware-validated).
 */
export interface Nw2Waveform {
  /**
   * Oscillator mode flag (body local[77]).
   * 0xfe = standard mode; 0xff = extended/wavetable mode.
   */
  readonly oscFlag: number;
  /**
   * Waveform bank selector (body local[78]).
   * 0 = classic synth waveforms (Sine, Saw, Square, …); 1 = named wavetable catalog.
   */
  readonly bank: number;
  /**
   * Waveform or wavetable index within the bank (body local[79]).
   * Low values (0, 2, 3, 7) = classic synth waveforms.
   * High values (e.g. 0x65=Choir, 0xb2=E Guitar, 0x95=?) = named wavetable catalog entries.
   */
  readonly id: number;
}

/** One voice slot in a Wave 2 program (exactly 244 bytes). */
export interface Nw2VoiceSlot {
  /**
   * Slot layer on/off (slot-local bit 0). Confirmed: slots 1-3 vary {0,1};
   * slot 0 is off in the corpus. Stage oracle: y layer on/off [1b].
   */
  readonly on: boolean;
  /**
   * Slot volume 0-127 (slot-local bits 1-7). Confirmed: varies 0-112 across the
   * corpus. Stage oracle: y volume [7b] (leading field of every synth engine).
   */
  readonly volume: number;
  /**
   * Drawbar values for this slot (9 bars).
   * Confirmed by nibble-range detection across 26 fixtures.
   */
  readonly drawbars: Nw2Drawbars;
  /**
   * Waveform / oscillator selection.
   * Confidence: candidate — derived from corpus pattern, not hardware-validated.
   */
  readonly waveform: Nw2Waveform;
  /**
   * The raw 5-byte waveform-selector region (body local[77-83]).
   * Includes oscFlag, bank, id plus 4 more bytes not yet decoded.
   * Confidence: candidate.
   */
  readonly _oscWaveformRegion: Uint8Array;
  /** Raw slot bytes (full 244-byte slot region) for future RE tooling. */
  readonly _raw: Uint8Array;
}

export interface Nw2Program {
  readonly parsed: true;
  readonly version: string;
  /** Four voice slots, each exactly 244 bytes. */
  readonly slots: readonly [Nw2VoiceSlot, Nw2VoiceSlot, Nw2VoiceSlot, Nw2VoiceSlot];
  /**
   * Global 5-byte body preamble (body[0-4]).
   * Constant across all 26 fixtures: 00 00 01 2d 3f.
   * byte[2]=0x01 may encode format version; bytes[3-4] are unknown.
   */
  readonly _globalPreamble: Uint8Array;
  /**
   * Global tail bytes (body[976-1043], 68 bytes).
   * Follows all four slots. Partially constant with candidate varying regions.
   */
  readonly _globalTail: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
