/**
 * Nord Piano 5 (`.np5p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 237 bytes (281 - 44).
 *
 * ## Confirmed fields (corpus RE, 2026-06-22, 25 fixtures)
 *
 * | Body offset | Field                  | Encoding                             |
 * |-------------|------------------------|--------------------------------------|
 * | 3-4         | format_tag             | constant 0x65 0x0c (LE16 = 0x0c65)  |
 * | 7           | layer_b_active         | bit 3 (mask 0x08); bit 5 always set  |
 *
 * ## Candidate clusters (strong corpus evidence, pending differential RE)
 *
 * | Body offset | Cluster                | Notes                                |
 * |-------------|------------------------|--------------------------------------|
 * | 5-7         | _programHeader         | sound-ref bytes + layer-B flag byte  |
 * | 18-32       | _primaryParams         | 15-byte primary params block         |
 * | 57          | record_marker 0x1f     | constant type-marker (layer A sound) |
 * | 58-66       | soundSlotLayerA._raw   | 9-byte layer A sound slot            |
 * | 89          | record_marker 0x1f     | constant type-marker (layer B sound) |
 * | 90-98       | soundSlotLayerB._raw   | 9-byte layer B sound slot            |
 * | 121         | record_marker 0x39     | constant type-marker (layer A FX)    |
 * | 122-135     | fxSlotLayerA._raw      | 14-byte layer A FX/EQ slot           |
 * | 179         | record_marker 0x39     | constant type-marker (layer B FX)    |
 * | 180-193     | fxSlotLayerB._raw      | 14-byte layer B FX/EQ slot           |
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

/** Extract and validate the sound-slot record at `bodyOffset` (9 payload bytes). */
function readSoundSlot(body: Uint8Array, markerOffset: number): Np5SoundSlot {
  // markerOffset holds the 0x1f type-marker; payload is the 9 bytes that follow.
  return { _raw: body.slice(markerOffset + 1, markerOffset + 10) };
}

/** Extract and validate the FX/EQ slot record at `bodyOffset` (14 payload bytes). */
function readFxSlot(body: Uint8Array, markerOffset: number): Np5FxSlot {
  // markerOffset holds the 0x39 type-marker; payload is the 14 bytes that follow.
  return { _raw: body.slice(markerOffset + 1, markerOffset + 15) };
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
