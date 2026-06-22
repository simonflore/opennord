/**
 * Nord Piano 5 (`.np5p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 237 bytes (281 - 44).
 *
 * Field names map to Stage oracle params (group p = the piano section) by
 * cross-model alignment; CLAUDE.md requires every decoded field be traceable.
 *
 * ## Confirmed fields (corpus RE, 2026-06-22, 25 fixtures)
 *
 * | Body offset | Field                  | Stage oracle | Encoding                          |
 * |-------------|------------------------|--------------|-----------------------------------|
 * | 3-4         | formatTag              | n/a          | constant 0x65 0x0c (LE16 0x0c65)  |
 * | 7           | layerBActive           | 230-3        | bit 3 (mask 0x08); bit 5 always set |
 * | 61-64       | soundA pianoModelId    | 245-5        | 32-bit model ID (4 raw bytes)     |
 * | 93-96       | soundB pianoModelId    | 245-5        | 32-bit model ID (4 raw bytes)     |
 *
 * ## Candidate fields (strong corpus evidence, pending differential RE)
 *
 * | Body offset | Field                  | Stage oracle | Notes                             |
 * |-------------|------------------------|--------------|-----------------------------------|
 * | 58 / 90     | soundX volume          | 230-7        | low7 = level 0-127; bit7 = active |
 * | 60 / 92     | soundX pianoType       | 244-3        | 3-bit enum (byte-aligned approx)  |
 * | 134 / 192   | fxX transpose          | 243-5†       | bits 3-4 (0x20/0x28/0x30)         |
 * | 5-7         | _programHeader         | —            | sound-ref bytes + layer-B flag    |
 * | 18-32       | _primaryParams         | —            | 15-byte primary params block      |
 *
 * † octave-shift mapping is tentative. Record markers: 0x1f at body[57]/[89]
 * (sound slots), 0x39 at body[121]/[179] (FX/EQ slots).
 *
 * ## Body structure
 *
 * Record-oriented: each sound/FX record is preceded by a type-marker byte
 * (0x1f for sound slots, 0x39 for FX slots) and padded to 32 bytes (sound)
 * or 58 bytes (FX/EQ) with trailing zeros. 175 of 237 bytes are constant (74%).
 */

import type { Np5FxSlot, Np5Program, Np5SoundSlot } from './types';

const BODY_OFFSET = 0x2c; // 44 — CBIN header length

/**
 * Constant body[3-4] value for all NP5 programs.
 * LE16 = 0x0c65 = 3173; confirmed across all 25 fixtures.
 */
const FORMAT_TAG = 0x0c65;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/** Read the LE16 format tag from body bytes 3-4. */
function readFormatTag(body: Uint8Array): number {
  return u8(body, 3) | (u8(body, 4) << 8);
}

/**
 * Extract the sound-slot record at `markerOffset` (the 0x1f type-marker byte;
 * the 9-byte payload follows). Surfaces the cross-model-mapped fields:
 *   - volume      payload[0] (body[58]/[90]) — Stage 230-7 (group p) [candidate]
 *   - pianoType   payload[2] (body[60]/[92]) — Stage 244-3 (group p) [candidate]
 *   - pianoModelId payload[3-6] (body[61-64]/[93-96]) — Stage 245-5 (group p) [confirmed]
 */
function readSoundSlot(body: Uint8Array, markerOffset: number): Np5SoundSlot {
  const payloadStart = markerOffset + 1;
  const _raw = body.slice(payloadStart, payloadStart + 9);

  // Stage 230-7 "volume" (group p): low 7 bits = level 0-127, bit 7 = active flag.
  const volByte = u8(body, payloadStart + 0);
  const volume = volByte & 0x7f;
  const volumeActive = (volByte & 0x80) !== 0;

  // Stage 244-3 "piano type" (group p): 3-bit enum, byte-aligned approximation.
  const pianoType = u8(body, payloadStart + 2) & 0x07;

  // Stage 245-5 "piano model ID/name" (group p): 32-bit model ID, 4 raw bytes.
  const pianoModelId = body.slice(payloadStart + 3, payloadStart + 7);

  return { volume, volumeActive, pianoType, pianoModelId, _raw };
}

/**
 * Extract the FX/EQ slot record at `markerOffset` (the 0x39 type-marker byte;
 * the 14-byte payload follows). Surfaces the cross-model-mapped field:
 *   - transpose  payload[12] (body[134]/[192]) — Stage 243-5 (group p) [candidate, tentative]
 */
function readFxSlot(body: Uint8Array, markerOffset: number): Np5FxSlot {
  const payloadStart = markerOffset + 1;
  const _raw = body.slice(payloadStart, payloadStart + 14);

  // Stage 243-5 "octave shift" (group p) [tentative]: bits 3-4 (0x20/0x28/0x30),
  // bit 5 always set. Decode to the 0/1/2 offset carried in bits 3-4.
  const transpose = (u8(body, payloadStart + 12) >>> 3) & 0x03;

  return { transpose, _raw };
}

/** Decode a Nord Piano 5 program body (full file bytes including CBIN header). */
export function decodeNp5(bytes: Uint8Array): Np5Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  // Confirmed: NP5 body sub-format tag (constant across all 25 fixtures)
  const formatTag = readFormatTag(body);
  if (formatTag !== FORMAT_TAG) {
    warnings.push(`Unexpected format tag: 0x${formatTag.toString(16)} (expected 0x${FORMAT_TAG.toString(16)})`);
  }

  // Confirmed: layer B active — body[7] bit 3
  // Bit 5 (0x20) is always set; bit 3 (0x08) selects dual-layer mode.
  const layerBActive = (u8(body, 7) & 0x08) !== 0;

  return {
    parsed: true,
    version,

    // Confirmed fields
    formatTag,
    layerBActive,

    // Candidate: layer A sound slot (type-marker 0x1f at body[57], 9 payload bytes)
    soundSlotLayerA: readSoundSlot(body, 57),

    // Candidate: layer B sound slot (type-marker 0x1f at body[89], 9 payload bytes)
    soundSlotLayerB: readSoundSlot(body, 89),

    // Candidate: layer A FX/EQ slot (type-marker 0x39 at body[121], 14 payload bytes)
    fxSlotLayerA: readFxSlot(body, 121),

    // Candidate: layer B FX/EQ slot (type-marker 0x39 at body[179], 14 payload bytes)
    fxSlotLayerB: readFxSlot(body, 179),

    // Raw clusters for RE tooling
    _programHeader: body.slice(5, 8),   // body[5-7]: sound-ref bytes + layer-B flag byte
    _primaryParams: body.slice(18, 33), // body[18-32]: 15-byte primary params block

    _rawBody: body,
    bytes,
    warnings,
  };
}
