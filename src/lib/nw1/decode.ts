/**
 * Nord Wave (`.nwp`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 306 bytes (350 - 44).
 *
 * ## Architecture (corpus RE, 2026-06-22, 1018 fixtures)
 *
 * The body is **two parallel synth slots** at a fixed stride of +140 — this is
 * the Nord Wave's defining dual-slot voice architecture. The old "A/B/C
 * clusters" framing was wrong: clusters A+B together are Slot 1, cluster C is
 * Slot 2.
 *
 * | Region        | body range | size | status    |
 * |---------------|-----------|------|-----------|
 * | Slot 1 voice  | 0-115     | 116b | candidate |
 * | (zero pad)    | 116-139   | 24b  | constant  |
 * | Slot 2 voice  | 140-255   | 116b | confirmed (mirror, stride +140) |
 * | (zero pad)    | 256-279   | 24b  | constant  |
 * | Global / tail | 280-289   | 10b  | candidate |
 * | (zero pad)    | 290-302   | 13b  | constant  |
 * | byte[303]     | 303       | 1b   | unknown (near-const 0) |
 * | checksum      | 304-305   | 2b   | confirmed — LE CRC-16/CCITT-FALSE over file[0:-2] (clavia/crc16.ts; 1018/1018) |
 *
 * Byte-aligned per-slot fields (the rest of the voice is bit-packed and
 * straddles byte boundaries — see `coverage.ts` differential workflow to pin
 * the ADSR/cutoff/LFO fields):
 *   - slot+0  : oscSelect    (enum 0-8, mode 4)
 *   - slot+39 : steppedParam (even-only {0,2,4,6,8,10})
 *   - slot+45 : enumParam    (enum 0-7, mode 7)
 *
 * Global:
 *   - body[280] low nibble : mode/octave enum (0-15)
 *   - body[289]            : packed flag pair {0,64,128,192}
 */

import { CBIN_BODY_OFFSET as BODY_OFFSET, formatCbinVersion } from '../clavia/cbin';
import type { Nw1Global, Nw1Program, Nw1Slot } from './types';

const SLOT1_OFFSET = 0;
const SLOT2_OFFSET = 140;
const SLOT_LEN = 116;
const GLOBAL_OFFSET = 280;
const GLOBAL_LEN = 10;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/** Decode one synth slot from the body at `slotOffset` (0 or 140). */
function readSlot(body: Uint8Array, slotOffset: number): Nw1Slot {
  return {
    oscSelect: u8(body, slotOffset + 0),
    steppedParam: u8(body, slotOffset + 39),
    enumParam: u8(body, slotOffset + 45),
    _raw: body.slice(slotOffset, slotOffset + SLOT_LEN),
  };
}

/** Decode the shared global / FX / master tail block at body[280-289]. */
function readGlobal(body: Uint8Array): Nw1Global {
  return {
    mode: u8(body, GLOBAL_OFFSET) & 0x0f,
    flags: u8(body, GLOBAL_OFFSET + 9),
    _raw: body.slice(GLOBAL_OFFSET, GLOBAL_OFFSET + GLOBAL_LEN),
  };
}

export function decodeNw1(bytes: Uint8Array): Nw1Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }
  const body = bytes.slice(BODY_OFFSET);
  const version = formatCbinVersion(bytes);

  // body[304-305]: LE CRC-16/CCITT-FALSE over the whole file except the final
  // 2 bytes (clavia/crc16.ts; confirmed 1018/1018 corpus 2026-07-04).
  const checksum = u8(body, 304) | (u8(body, 305) << 8);

  return {
    parsed: true,
    version,
    slot1: readSlot(body, SLOT1_OFFSET),
    slot2: readSlot(body, SLOT2_OFFSET),
    global: readGlobal(body),
    checksum,
    _rawBody: body,
    bytes,
    warnings,
  };
}
