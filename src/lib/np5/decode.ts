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
 * ## Confirmed core piano cluster (Stage group-p oracle, NW1-v4 like Grand 2)
 *
 * Each layer carries a 72-bit MSB-first "core" cluster — the Stage piano
 * params laid out contiguously, morph variants dropped. Base = body bit 461
 * (layer A) / 717 (layer B), fixed by the modelId anchor at base+28 (= body
 * bit 489 / 745) and the pianoType anchor at base+18. Confirmed fields
 * (in-range + sane distribution across all 25 fixtures): layerOn, volume
 * (100-119), kbZones, octaveShift (0 / ±1), pianoType (Grand/Upright/Electric/
 * Digital/Misc), pianoModelId (32b). The bit-aligned modelId additionally
 * unifies Vintage == Wah_Clav, which the byte-aligned read split by one bit.
 * See {@link decodePianoCore} and `types.ts` Np5PianoCore. Remaining cluster
 * fields (pstick/susped/modelSlot/variation/softRel/stringRes/pedalNoise/
 * touch/unison/dynComp/timbre) stay in-range but are labeled candidate.
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

import { CBIN_BODY_OFFSET as BODY_OFFSET, formatCbinVersion } from '../clavia/cbin';
import { readBits } from '../clavia/bitstream';
import type {
  Np5FxSlot,
  Np5PianoCore,
  Np5PianoType,
  Np5Program,
  Np5SoundSlot,
} from './types';

/** Body bit offset of the Layer A core piano cluster (modelId anchor at +28 = bit 489). */
const CORE_A_BIT = 461;
/** Body bit offset of the Layer B core piano cluster (modelId anchor at +28 = bit 745). */
const CORE_B_BIT = 717;

/**
 * Constant body[3-4] value for all NP5 programs.
 * LE16 = 0x0c65 = 3173; confirmed across all 25 fixtures.
 */
const FORMAT_TAG = 0x0c65;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/** Map the 3-bit Stage piano-type value to a label (244-3 piano type, group p). */
function pianoTypeLabel(raw: number): Np5PianoType {
  switch (raw) {
    case 0:
      return 'Grand';
    case 1:
      return 'Upright';
    case 2:
      return 'Electric';
    case 3:
      return 'Clav';
    case 4:
      return 'Digital';
    case 5:
      return 'Misc';
    default:
      return 'Unknown';
  }
}

/**
 * Decode one 72-bit core piano cluster at body bit offset `base`
 * (CORE_A_BIT for body bit 461, CORE_B_BIT for body bit 717). The Stage
 * group-p piano section laid out contiguously, MSB-first. See {@link Np5PianoCore}
 * for the bit map and Stage oracle citations.
 */
function decodePianoCore(body: Uint8Array, base: number): Np5PianoCore {
  const pianoTypeRaw = readBits(body, base + 18, 3); // 244-3 piano type (anchor)
  const pianoModelId = readBits(body, base + 28, 32) >>> 0; // 245-5 model ID (anchor)
  const pianoModelIdBytes = new Uint8Array([
    (pianoModelId >>> 24) & 0xff,
    (pianoModelId >>> 16) & 0xff,
    (pianoModelId >>> 8) & 0xff,
    pianoModelId & 0xff,
  ]);

  return {
    // ── CONFIRMED fields ──────────────────────────────────────────────────
    layerOn: readBits(body, base + 0, 1) === 1, // 230-* layer on/off (group p)
    volume: readBits(body, base + 1, 7), // 230-7 volume (group p)
    kbZones: readBits(body, base + 8, 4), // 243-1 KB zones (group p)
    octaveShift: readBits(body, base + 12, 4), // 243-5 octave shift (group p)
    pianoType: pianoTypeLabel(pianoTypeRaw), // 244-3 piano type (group p)
    pianoTypeRaw,
    pianoModelId, // 245-5 piano model ID/name [32b] (group p)
    pianoModelIdBytes,
    // ── CANDIDATE fields ──────────────────────────────────────────────────
    pstick: readBits(body, base + 16, 1) === 1, // 244-1 pstick on/off (group p)
    susped: readBits(body, base + 17, 1) === 1, // 244-2 susped on/off (group p)
    modelSlot: readBits(body, base + 21, 5), // 244-6 piano model slot (group p)
    variation: readBits(body, base + 26, 2), // 245-3 piano model variation (group p)
    softRel: readBits(body, base + 60, 1) === 1, // 249-5 soft rel on/off (group p)
    stringRes: readBits(body, base + 61, 1) === 1, // 249-6 string res on/off (group p)
    pedalNoise: readBits(body, base + 62, 1) === 1, // 249-7 pedal noise on/off (group p)
    touch: readBits(body, base + 63, 2), // 249-8 touch (group p)
    unison: readBits(body, base + 65, 2), // 250-2 unison level (group p)
    dynComp: readBits(body, base + 67, 2), // 250-4 dyn comp (group p)
    timbre: readBits(body, base + 69, 3), // 250-7 timbre (group p)
  };
}

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

  const version = formatCbinVersion(bytes);

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

    // Confirmed: per-layer 72-bit core piano clusters (Stage group-p oracle).
    // Cluster base fixed by the modelId anchor at base+28 (body bit 489 / 745).
    coreLayerA: decodePianoCore(body, CORE_A_BIT),
    coreLayerB: decodePianoCore(body, CORE_B_BIT),

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
