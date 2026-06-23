/**
 * Nord Grand 2 (`.ng2p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 185 bytes (229 − 44).
 *
 * Field names + bit offsets come from aligning the ng2 corpus against the Stage
 * piano (group p) oracle param map (cross-model mapping, 2026-06-22). The Stage
 * oracle is a REFERENCE we transcribe from, never a runtime import (lib/ns4 is
 * off-limits).
 *
 * ## Confirmed body structure (Stage oracle alignment, 2026-06-22, 20 fixtures)
 *
 * The body uses a TLV-style section layout: constant separator regions (whose
 * last byte is a section-type tag) precede every data cluster. Tag values equal
 * the payload size (0x05 = 1 byte, 0x0d = 9 bytes, 0x14 = 14 bytes,
 * 0x15 = 16 bytes). The two 0x0d clusters — body[22..30] (Layer A) and
 * body[36..44] (Layer B) — are the per-layer piano sections, each a 72-bit
 * MSB-first packed record. See {@link decodePianoLayer} and `types.ts` for the
 * bit map and Stage oracle param citations.
 *
 * | Body range | Label                  | Status               |
 * |------------|------------------------|----------------------|
 * | 5–8        | global header cluster  | candidate (raw)      |
 * | 8 bit7     | layerB_activeFlag      | candidate            |
 * | 16 bits7:5 | globalParam1 (0–7)     | candidate            |
 * | 22–30      | layer A piano (9 B)    | DECODED (oracle p)   |
 * | 36–44      | layer B piano (9 B)    | DECODED (oracle p)   |
 * | 50–65      | layer A extended (16B) | candidate (raw)      |
 * | 72–87      | layer B extended (16B) | candidate (raw)      |
 * | 94 bits7:5 | globalParam2 (0–7)     | candidate            |
 * | 100–113    | layer A effects (14 B) | candidate (raw)      |
 * | 121–134    | layer B effects (14 B) | candidate (raw)      |
 * | 142–157    | layer A final (16 B)   | candidate (raw)      |
 * | 164–179    | layer B final (16 B)   | candidate (raw)      |
 */

import type { Ng2PianoLayer, Ng2PianoType, Ng2Program } from './types';

const BODY_OFFSET = 0x2c; // 44 — CBIN header length

/** Body bit offset of the Layer A piano cluster (= body byte 22). */
const LAYER_A_BIT = 176;
/** Body bit offset of the Layer B piano cluster (= body byte 36). */
const LAYER_B_BIT = 288;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/** Read `len` bits MSB-first starting at body bit `startBit`. */
function readBits(body: Uint8Array, startBit: number, len: number): number {
  let v = 0;
  for (let i = 0; i < len; i++) {
    const bit = startBit + i;
    const byte = u8(body, bit >> 3);
    const b = (byte >> (7 - (bit & 7))) & 1;
    v = (v << 1) | b;
  }
  return v >>> 0;
}

/** Map the 3-bit Stage piano-type value to a label (244-3 piano type, group p). */
function pianoTypeLabel(raw: number): Ng2PianoType {
  switch (raw) {
    case 0: return 'Grand';
    case 1: return 'Upright';
    case 2: return 'Electric';
    case 3: return 'Clav';
    case 4: return 'Digital';
    case 5: return 'Misc';
    default: return 'Unknown';
  }
}

/**
 * Decode one 72-bit piano-layer cluster at body bit offset `base`
 * (LAYER_A_BIT for body[22..30], LAYER_B_BIT for body[36..44]).
 *
 * Bit map (relative to `base`, MSB-first) — Stage group-p oracle params cited:
 *   0      pianoOn        230-3 layer on/off       CONFIRMED
 *   1-7    volume         230-7 volume             CONFIRMED
 *   8-11   kbZones        243-1 KB zones           CONFIRMED
 *   12-15  octaveShift    243-5 octave shift       CONFIRMED
 *   16     pstick         244-1 pstick on/off      CONFIRMED
 *   17     susPedal       244-2 susped on/off      CONFIRMED
 *   18-20  pianoType      244-3 piano type         CONFIRMED
 *   21-25  pianoModelSlot 244-6 piano model slot   CONFIRMED
 *   26-27  pianoVariation 245-3 model variation    CONFIRMED
 *   28-59  pianoModelId   245-5 model ID/name 32b  CONFIRMED
 *   60     softRelease    249-5 soft rel on/off    CONFIRMED
 *   61     stringRes      249-6 string res on/off  CONFIRMED
 *   62     pedalNoise     249-7 pedal noise        CONFIRMED
 *   63-64  touch          249-8 touch              CONFIRMED
 *   65-66  unisonLevel    250-2 unison level       CONFIRMED
 *   67-68  dynComp        250-4 dyn comp           CONFIRMED
 *   69-71  timbre         250-7 timbre             CONFIRMED
 */
function decodePianoLayer(body: Uint8Array, base: number, clusterByteStart: number): Ng2PianoLayer {
  const pianoTypeRaw = readBits(body, base + 18, 3);
  const pianoModelId = readBits(body, base + 28, 32) >>> 0;
  const pianoModelIdBytes = new Uint8Array([
    (pianoModelId >>> 24) & 0xff,
    (pianoModelId >>> 16) & 0xff,
    (pianoModelId >>> 8) & 0xff,
    pianoModelId & 0xff,
  ]);

  return {
    // ── CONFIRMED fields ──────────────────────────────────────────────────
    pianoOn: readBits(body, base + 0, 1) === 1, // 230-3 layer on/off (group p)
    volume: readBits(body, base + 1, 7), // 230-7 volume (group p)
    kbZones: readBits(body, base + 8, 4), // 243-1 KB zones (group p)
    octaveShift: readBits(body, base + 12, 4), // 243-5 octave shift (group p)
    pianoType: pianoTypeLabel(pianoTypeRaw), // 244-3 piano type (group p)
    pianoTypeRaw,
    pianoModelId, // 245-5 piano model ID/name [32b] (group p)
    pianoModelIdBytes,
    pstick: readBits(body, base + 16, 1) === 1, // 244-1 pstick on/off (group p)
    susPedal: readBits(body, base + 17, 1) === 1, // 244-2 susped on/off (group p)
    pianoModelSlot: readBits(body, base + 21, 5), // 244-6 piano model slot (group p)
    pianoVariation: readBits(body, base + 26, 2), // 245-3 piano model variation (group p)
    softRelease: readBits(body, base + 60, 1) === 1, // 249-5 soft rel on/off (group p)
    stringRes: readBits(body, base + 61, 1) === 1, // 249-6 string res on/off (group p)
    pedalNoise: readBits(body, base + 62, 1) === 1, // 249-7 pedal noise on/off (group p)
    touch: readBits(body, base + 63, 2), // 249-8 touch (group p)
    unisonLevel: readBits(body, base + 65, 2), // 250-2 unison level (group p)
    dynComp: readBits(body, base + 67, 2), // 250-4 dyn comp (group p)
    timbre: readBits(body, base + 69, 3), // 250-7 timbre (group p)
    _raw: body.slice(clusterByteStart, clusterByteStart + 9),
  };
}

/** Decode a Nord Grand 2 program body (full file bytes including CBIN header). */
export function decodeNg2(bytes: Uint8Array): Ng2Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  // ── Decoded piano layers (Stage group-p oracle alignment) ─────────────────
  const layerA = decodePianoLayer(body, LAYER_A_BIT, 22); // body[22..30]
  const layerB = decodePianoLayer(body, LAYER_B_BIT, 36); // body[36..44]

  // ── Candidate global fields ──────────────────────────────────────────────

  // body[8] bit7: Layer B active / alternate mode flag.
  // Set in 4/20 corpus programs (Duet, Stacked, Subway, Tspoon).
  const layerBActiveFlag = (u8(body, 8) & 0x80) !== 0;

  // body[16] bits[7:5]: 3-bit global parameter (lower 5 bits always 0 in corpus).
  const globalParam1 = (u8(body, 16) >>> 5) & 0x7;

  // body[94] bits[7:5]: 3-bit global parameter, same encoding as globalParam1.
  const globalParam2 = (u8(body, 94) >>> 5) & 0x7;

  return {
    parsed: true,
    version,
    layerA,
    layerB,
    layerBActiveFlag,
    globalParam1,
    globalParam2,
    // ── Named raw clusters for future RE ────────────────────────────────────
    // body[5-8]: global header cluster (ClusterA, 4 bytes)
    _globalHeaderCluster: body.slice(5, 9),
    // body[50-65]: layer A extended (ClusterC1, 16 bytes)
    _layerAExtendedCluster: body.slice(50, 66),
    // body[72-87]: layer B extended (ClusterC2, 16 bytes)
    _layerBExtendedCluster: body.slice(72, 88),
    // body[100-113]: layer A effects (ClusterD1, 14 bytes)
    _layerAEffectsCluster: body.slice(100, 114),
    // body[121-134]: layer B effects (ClusterD2, 14 bytes)
    _layerBEffectsCluster: body.slice(121, 135),
    // body[142-157]: layer A final (ClusterE1, 16 bytes)
    _layerAFinalCluster: body.slice(142, 158),
    // body[164-179]: layer B final (ClusterE2, 16 bytes)
    _layerBFinalCluster: body.slice(164, 180),
    _rawBody: body,
    bytes,
    warnings,
  };
}
