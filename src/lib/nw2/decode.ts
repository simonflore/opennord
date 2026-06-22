/**
 * Nord Wave 2 (`.nw2p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 1044 bytes (1088 - 44).
 *
 * Four voice slots anchored by drawbar regions (corpus RE, 2026-06-22):
 * | Slot | Drawbar body offset | File offset | Drawbar bytes |
 * |------|---------------------|-------------|---------------|
 * | 0    | 144-147             | 188-191     | 4 (8 nibbles) |
 * | 1    | 388-391             | 432-435     | 4 (8 nibbles) |
 * | 2    | 631-638             | 675-682     | 8 (16 nibbles) — upper+lower? |
 * | 3    | 876-879             | 920-923     | 4 (8 nibbles) |
 *
 * Slot boundaries are estimated from the ~244-byte period between drawbar anchors.
 * Slot sizes: 0→[0-243], 1→[244-487], 2→[488-731], 3→[732-975], global tail→[976+].
 * The global header (body[0-99]) precedes all slots.
 */

import type { Nw2Drawbars, Nw2VoiceSlot, Nw2Program } from './types';

const BODY_OFFSET = 0x2c;

// Drawbar anchor offsets within the body (file offset - 44)
const DRAWBAR_OFFSETS = [144, 388, 631, 876] as const;
// Estimated slot start offsets (body-relative), inferred from ~244-byte period
const SLOT_STARTS = [0, 244, 488, 732] as const;
const SLOT_SIZE = 244;

function readDrawbars4(body: Uint8Array, offset: number): Nw2Drawbars {
  const bars: number[] = [];
  for (let i = 0; i < 4; i++) {
    const byte = body[offset + i] ?? 0;
    bars.push((byte >>> 4) & 0xf);
    bars.push(byte & 0xf);
  }
  return { bars };
}

function readSlot(body: Uint8Array, slotIndex: number): Nw2VoiceSlot {
  const drawbarOffset = DRAWBAR_OFFSETS[slotIndex];
  const slotStart = SLOT_STARTS[slotIndex];
  return {
    drawbars: readDrawbars4(body, drawbarOffset),
    _raw: body.slice(slotStart, slotStart + SLOT_SIZE),
  };
}

export function decodeNw2(bytes: Uint8Array): Nw2Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }
  const body = bytes.slice(BODY_OFFSET);
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);
  return {
    parsed: true,
    version,
    slots: [readSlot(body, 0), readSlot(body, 1), readSlot(body, 2), readSlot(body, 3)],
    _globalHeader: body.slice(0, 100),
    _rawBody: body,
    bytes,
    warnings,
  };
}
