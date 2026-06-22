/**
 * Nord Wave 2 (`.nw2p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 26 fixtures × 1088 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, version @0x14 (3.01)
 *   - Four voice slots, each ~244 bytes, anchored by drawbar regions.
 *   - Drawbars: 4-byte nibble-packed regions within each slot (same encoding
 *     as Electro 6 but only 8 nibbles per region — 8 drawbars, not 9).
 *     Slot 3 has an extended 8-byte drawbar block (16 nibbles).
 *
 * Drawbar encoding: same 4-bit nibble packing as ne6 (0-8 per bar, high nibble first).
 *
 * The ~244-byte period was inferred from drawbar anchor positions:
 *   slot0 drawbar @body[144], slot1 @body[388], slot2 @body[631], slot3 @body[876].
 *
 * Source: 26-file corpus statistical analysis (2026-06-22).
 */

/** 8 drawbar positions (4-bit nibbles, 0-8 each). Wave 2 uses 8 bars, not 9. */
export interface Nw2Drawbars {
  bars: readonly number[];
}

/** One voice slot in a Wave 2 program. */
export interface Nw2VoiceSlot {
  /** Drawbar values for this slot (8 bars). Confirmed by nibble-range detection. */
  drawbars: Nw2Drawbars;
  /** Raw slot bytes for future RE (full ~244-byte slot region). */
  _raw: Uint8Array;
}

export interface Nw2Program {
  readonly parsed: true;
  readonly version: string;
  /** Four voice slots, each anchored by a drawbar region. */
  readonly slots: readonly [Nw2VoiceSlot, Nw2VoiceSlot, Nw2VoiceSlot, Nw2VoiceSlot];
  /** Global header area before the first slot (body[0-99]). */
  readonly _globalHeader: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
