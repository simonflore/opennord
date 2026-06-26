/**
 * Nord Wave 2 (`.nw2p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 1044 bytes (1088 - 44).
 *
 * Four voice slots each exactly 244 bytes, followed by a 68-byte global tail:
 * | Slot | Body range  | Drawbar offset | Drawbar encoding            |
 * |------|-------------|----------------|-----------------------------|
 * | 0    | [0-243]     | body[143-147]  | 5 bytes, 9 nibbles (NE6)    |
 * | 1    | [244-487]   | body[387-391]  | 5 bytes, 9 nibbles (NE6)    |
 * | 2    | [488-731]   | body[631-635]  | 5 bytes, 9 nibbles (NE6)    |
 * | 3    | [732-975]   | body[875-879]  | 5 bytes, 9 nibbles (NE6)    |
 * | tail | [976-1043]  | —              | 68-byte global tail          |
 *
 * Drawbar encoding: 9 × 4-bit nibbles, high nibble first.
 *   bytes[0-3] = bars 1-8 (2 per byte), byte[4] high nibble = bar 9,
 *   byte[4] low nibble = trailing (always 0 in the 26-file corpus).
 *
 * Waveform selector (candidate, body local[77-79] per slot):
 *   local[77] = oscFlag (0xfe=standard, 0xff=extended/wavetable mode)
 *   local[78] = bank    (0=classic synth waveforms, 1=wavetable catalog)
 *   local[79] = id      (waveform index; low=synth primitive, high=named wavetable)
 *
 * NOTE on skeleton bug: the original DRAWBAR_OFFSETS were [144, 388, 631, 876].
 * Offsets for slots 0, 1, and 3 were off by 1 (the first byte 0x37 at local[143]
 * was misidentified as constant padding; it is in fact part of the drawbar block,
 * encoding bars 1 and 2 as nibbles [3, 7] — the default position in 25/26 fixtures).
 * Source: Eli Bass 6 fixture confirms non-default bars=[3,7,7,7,7,7,7,7,4] starting
 * at the corrected offset.
 *
 * Source: 26-file corpus statistical analysis (2026-06-22).
 */

import { CBIN_BODY_OFFSET as BODY_OFFSET, formatCbinVersion } from '../clavia/cbin';
import { readDrawbars } from '../clavia/drawbars';
import type { Nw2VoiceSlot, Nw2Waveform, Nw2Program } from './types';

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

// Corrected drawbar anchor offsets within the body (previously off by 1 for slots 0,1,3)
// Slot local offset 143: slot0=143, slot1=244+143=387, slot2=488+143=631, slot3=732+143=875
const DRAWBAR_OFFSETS = [143, 387, 631, 875] as const;
// Slot start offsets (body-relative), confirmed by ~244-byte period
const SLOT_STARTS = [0, 244, 488, 732] as const;
const SLOT_SIZE = 244;

/**
 * Decode the waveform / oscillator selector from body local[77-79].
 * Confidence: candidate — statistically derived from 26 fixtures, not hardware-validated.
 */
function readWaveform(slotBody: Uint8Array): Nw2Waveform {
  return {
    oscFlag: u8(slotBody, 77),
    bank: u8(slotBody, 78),
    id: u8(slotBody, 79),
  };
}

function readSlot(body: Uint8Array, slotIndex: number): Nw2VoiceSlot {
  const drawbarOffset = DRAWBAR_OFFSETS[slotIndex];
  const slotStart = SLOT_STARTS[slotIndex];
  const slotBody = body.slice(slotStart, slotStart + SLOT_SIZE);
  // Slot starts with the Stage synth engine layout: bit0 = layer on/off, bits1-7 = volume.
  // Confirmed: slots 1-3 read on={0,1} + volume 0-112; slot 0 is off (all-zero) in the corpus.
  // Stage oracle: y layer on/off [1b] + y volume [7b] (group y — every engine's leading fields).
  const head = slotBody[0] ?? 0;
  return {
    on: (head >>> 7) === 1,
    volume: head & 0x7f,
    drawbars: readDrawbars(body, drawbarOffset),
    waveform: readWaveform(slotBody),
    // The 7-byte oscillator/waveform region local[77-83] — oscFlag + bank + id + 4 unknown bytes.
    // Candidate: full extent of this region not yet decoded.
    _oscWaveformRegion: slotBody.slice(77, 84),
    _raw: slotBody,
  };
}

/** Decode a Nord Wave 2 program body (full file bytes including CBIN header). */
export function decodeNw2(bytes: Uint8Array): Nw2Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }
  const body = bytes.slice(BODY_OFFSET);

  const version = formatCbinVersion(bytes);

  return {
    parsed: true,
    version,
    slots: [readSlot(body, 0), readSlot(body, 1), readSlot(body, 2), readSlot(body, 3)],
    // Global preamble: body[0-4], constant across all 26 fixtures (00 00 01 2d 3f).
    // byte[2]=0x01 may be a format version marker.
    _globalPreamble: body.slice(0, 5),
    // Global tail: body[976-1043] (68 bytes), follows all four slots.
    _globalTail: body.slice(976, 1044),
    _rawBody: body,
    bytes,
    warnings,
  };
}
