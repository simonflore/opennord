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
 * Slot source selector (local[77-80]) — CONFIRMED 2026-07-04 against the
 * Elijah Fox Signature Sound Bank Bundle's meta.xml dependency list (ground
 * truth: per-program `depCnt` + `depN` sample filenames):
 *   - local[77] = slot source kind: 0xfe = oscillator (analog/wavetable/FM),
 *     0xff = sample from the Nord Sample Library partition. Across all 26
 *     programs the count of 0xff slots equals the program's meta.xml depCnt,
 *     and slot order matches dep order.
 *   - sample slots: 10-bit sample index, big-endian, ending 2 bits into
 *     local[80]: ((local[78]<<8 | local[79]) << 2) | (local[80] >> 6).
 *     Evidence: the same sample reused across programs keeps the same index
 *     (Wurlitzer 3.1 = 0x51f in three programs; Men+Women Mm = 0x196 in two),
 *     and related library entries are adjacent (E Guitar LP 55 = 0x2c8 /
 *     E Guitar S 62 = 0x2c9; Grandmas Upright/RainPiano = 0x517/0x518).
 *     Indices cluster by category in alphabetical category order (Choir <
 *     Guitar < Piano < Strings…), i.e. this is the device's sorted sample-list
 *     position — bundle-verified, so treat cross-device stability as unproven.
 *   - oscillator slots: local[79] = waveform selector; the all-default
 *     "Sine Pad" program reads 0 on all four slots, anchoring 0 = Sine (the
 *     first Basic-category waveform in the Nord Wave 2 User Manual v1.2x
 *     Edition G, p.20). Full selector→waveform table still unmapped.
 *
 * Source: 26-file corpus statistical analysis (2026-06-22); slot source
 * selector confirmed vs bundle meta.xml + manual anchor (2026-07-04).
 */

/** 9 drawbar positions (4-bit nibbles, 0-8 each) — identical encoding to NE6. */
export interface Nw2Drawbars {
  /** 9 drawbar values, bars 1-9 (standard Hammond order: 16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'). */
  readonly bars: readonly number[];
  /** Low nibble of byte 4 — always 0 in corpus; reserved for future RE. */
  readonly _trailing: number;
}

/**
 * Slot sound source (body local[77-80]).
 *
 * `kind` is CONFIRMED against bundle meta.xml dependency counts (see module
 * header): 0xff slots are Nord Sample Library samples, 0xfe slots are
 * oscillator waveforms (analog/wavetable/FM — the Wave 2's four oscillator
 * types minus Sample, per the user manual p.20).
 */
export interface Nw2Waveform {
  /** Slot source kind — sample slots carry a library index, oscillator slots a waveform selector. */
  readonly kind: 'oscillator' | 'sample';
  /** Raw source flag byte (body local[77]): 0xfe = oscillator, 0xff = sample. */
  readonly oscFlag: number;
  /**
   * Sample slots only: 10-bit sample-list index,
   * ((local[78]<<8 | local[79]) << 2) | (local[80] >> 6). Same sample → same
   * index across programs (bundle-verified); cross-device stability unproven.
   */
  readonly sampleIndex?: number;
  /**
   * Oscillator slots only: waveform selector (body local[79]).
   * 0 = Sine ("Sine Pad" anchor; first Basic waveform in the manual).
   * Other observed values (1-9) not yet mapped to the manual's category lists.
   */
  readonly waveformId?: number;
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
