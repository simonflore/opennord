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
 *   - slot+49 : enum2        (enum 0-6, per-slot mirrored; census 2026-07-04)
 *   - slot+84 : enum3        (enum 0-3, per-slot mirrored; census 2026-07-04)
 *
 * ## Hardware-free ceiling (Phase 5, 2026-07-04)
 *
 * Wave 1 resists further hardware-free decode: the 1,018-file corpus is all
 * distinct artist patches with **no natural minimal pairs** (the miner found 2
 * at K=2), so differential RE via near-duplicates yields nothing. The firmware
 * (`nw1/params.reference.ts`, from research/nwe/os.cab) supplies the parameter
 * NAME + enum pool, but the byte→name mapping needs a differential the corpus
 * can't provide. So the byte-aligned selectors above are surfaced (offsets
 * corpus-confirmed) but left UNNAMED — naming them, and the sub-byte voice
 * fields, needs a hardware single-knob differential. Do not assign firmware
 * names on cardinality match alone (that overfit was the np4 6-file mistake).
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
    // Two more byte-aligned per-slot selectors surfaced by the 1,018-file census
    // (2026-07-04): both mirror across the +140 slot stride and are low-
    // cardinality. Names not yet assigned — the firmware oracle
    // (params.reference.ts) supplies the candidate param pool, but the byte→name
    // mapping needs a differential the corpus lacks (no natural minimal pairs).
    enum2: u8(body, slotOffset + 49),
    enum3: u8(body, slotOffset + 84),
    _raw: body.slice(slotOffset, slotOffset + SLOT_LEN),
  };
}

/** Decode the shared global / FX / master tail block at body[280-289]. */
function readGlobal(body: Uint8Array): Nw1Global {
  return {
    mode: u8(body, GLOBAL_OFFSET) & 0x0f,
    // body[286]: near-binary global flag (0/1 in 1017/1018 files). Candidate.
    toggle: u8(body, GLOBAL_OFFSET + 6) & 0x01,
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
