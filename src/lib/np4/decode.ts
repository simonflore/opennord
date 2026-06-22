/**
 * Nord Piano 4 (`.np4p`) body decoder.
 *
 * Body offset: 0x2c (44 bytes — standard CBIN header).
 * Body length: 90 bytes (134 - 44).
 *
 * Field names + offsets come from aligning the np4 corpus against the Stage piano
 * (group p) oracle param map (cross-model mapping, 2026-06-22). The Stage oracle
 * is a REFERENCE we transcribe from, never a runtime import (lib/ns4 is off-limits).
 *
 * ## Confirmed body fields (Stage oracle alignment, 2026-06-22, 6 fixtures × 134 bytes)
 *
 * | Body offset | File offset | Field | Stage oracle param | Notes |
 * |-------------|-------------|-------|--------------------|-------|
 * | 19-23       | 63-67       | pianoModelId | 245-5 piano model ID/name [32b], group p | b19=0x4N family selector; b20-23 = 32b modelID. George=Tea shared bytes confirm model, not program |
 * | 25          | 69          | pianoFamily | 244-3 piano type [3b], group p (binarized) | bit7: 1=EP, 0=Grand; clean binary split |
 * | 72          | 116         | pianoFamilyCheck | 244-3 piano type [3b], group p (redundant) | 0x0c=EP, 0x90=Grand; perfectly correlated with b25 |
 *
 * ## Candidate fields (Stage oracle param / evidence)
 *
 * | Body offset | Field | Stage oracle param | Evidence |
 * |-------------|-------|--------------------|----------|
 * | 35          | pianoLevel | 230-7 volume [7b], group p | Range 71-95, monotone variation, 0-127 (bit7 clear) |
 * | 36 bits 7-6 | velocityCurve | 249-8 touch [2b], group p | 2-bit enum (0,1,3 observed); label map unverified |
 * | 59-60       | fxModWord | 267-1/275-5 FX mod on/off region, group p | FX sub-block head; 0x0202≠"off" (Tea Phaser is active) |
 * | 66-69       | fxModParams | 267-3 rate [7b] / 271-2 amount [7b], group p | Tea Phaser distinctly non-zero [0x3f, 0x8d, 0x70, 0xf2] |
 *
 * ## Constant regions (all identical across 6-program corpus)
 *
 * | Body offset | Value | Notes |
 * |-------------|-------|-------|
 * | 0-2         | 0x00 0x00 0x00 | zero pad |
 * | 3           | 0x64           | format marker (100 = version 1.00×100) |
 * | 4           | 0x0b           | constant |
 * | 5           | 0x01           | constant |
 * | 6           | 0x80           | constant |
 * | 7           | 0x40           | constant |
 * | 8-16        | 0x00…0x00 0x11 | header tail |
 * | 26-33       | 0x00×8         | zero pad |
 * | 34          | 0x17           | sub-block marker (23 decimal) |
 * | 48-57       | 0x00×10        | zero pad |
 * | 58          | 0x1f           | sub-block marker (31 decimal) |
 * | 73-89       | 0x00×17        | zero tail |
 */

import type { Np4PianoFamily, Np4VelocityCurve, Np4Program } from './types';

const BODY_OFFSET = 0x2c; // 44 — the CBIN header length

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/**
 * Decode piano family from body[25] bit7.
 * Stage oracle: 244-3 piano type [3b], group p (binarized in np4).
 * Confirmed: bit7=1 → EP, bit7=0 → Grand.
 */
function readPianoFamily(body: Uint8Array): Np4PianoFamily {
  return (u8(body, 25) & 0x80) !== 0 ? 'EP' : 'Grand';
}

/**
 * Decode velocity curve from body[36] bits 7-6.
 * Stage oracle: 249-8 touch [2b], group p. Candidate field.
 */
function readVelocityCurve(body: Uint8Array): Np4VelocityCurve {
  const bits = (u8(body, 36) >>> 6) & 0x3;
  switch (bits) {
    case 0: return 'Soft';
    case 1: return 'Medium';
    case 3: return 'Heavy';
    default: return 'Unknown';
  }
}

/** Decode Nord Piano 4 program body (full file bytes including CBIN header). */
export function decodeNp4(bytes: Uint8Array): Np4Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  // Confirmed: body[25] bit7 piano family flag.
  // Stage oracle: 244-3 piano type [3b], group p (binarized).
  const pianoFamily = readPianoFamily(body);

  // Confirmed: body[72] redundant family check.
  // Stage oracle: 244-3 piano type [3b], group p (second copy in FX sub-block).
  const pianoFamilyCheck = u8(body, 72);

  // Confirmed: body[19-23] = 5-byte model reference.
  // Stage oracle: 245-5 piano model ID/name [32b], group p.
  // body[19]=0x4N (high nibble 0x4 = piano prefix; low nibble = family selector),
  // body[20-23] = the Stage 32-bit modelID.
  const pianoModelId = body.slice(19, 24);
  const pianoModelFamily = u8(body, 19) & 0x0f;

  // Candidate: body[35] = output level.
  // Stage oracle: 230-7 volume [7b], group p (0-127, bit7 clear; observed 71-95).
  const pianoLevel = u8(body, 35);

  // Candidate: body[36] bits 7-6 = velocity curve / touch.
  // Stage oracle: 249-8 touch [2b], group p.
  const velocityCurve = readVelocityCurve(body);

  // Candidate: body[59-60] big-endian uint16 = FX-mod region head word.
  // Stage oracle: 267-1 FX mod 1 on/off + 275-5 FX mod 2 on/off region, group p.
  // (0x0202 is NOT an "off" sentinel — Tea Phaser is active and also reads 0x0202.)
  const fxModWord = (u8(body, 59) << 8) | u8(body, 60);

  // Candidate: body[66-69] = FX modulation parameter block.
  // Stage oracle: 267-3 FX mod 1 rate [7b] / 271-2 FX mod 1 amount [7b], group p.
  const fxModParams = body.slice(66, 70);

  // Family check cross-validation (both confirmed independently; mismatch is anomalous)
  const familyCheckEP = pianoFamilyCheck === 0x0c;
  const familyCheckGrand = pianoFamilyCheck === 0x90;
  const familyFromB25IsEP = pianoFamily === 'EP';
  if (familyFromB25IsEP !== familyCheckEP || (!familyCheckEP && !familyCheckGrand)) {
    warnings.push(
      `Piano family mismatch: body[25]=0x${u8(body, 25).toString(16)} → ${pianoFamily}, ` +
      `body[72]=0x${pianoFamilyCheck.toString(16)} (expected 0x0c=EP or 0x90=Grand)`
    );
  }

  return {
    parsed: true,
    version,
    // Confirmed fields
    pianoFamily,
    pianoModelId,
    pianoModelFamily,
    pianoFamilyCheck,
    // Candidate fields
    pianoLevel,
    velocityCurve,
    fxModWord,
    fxModParams,
    // Raw clusters — meaningful section names by body byte range
    _soundSection: body.slice(17, 26),  // 9 bytes: model ID + family flag
    _pianoParams: body.slice(35, 48),   // 13 bytes: level + velocity + voicing
    _fxSection: body.slice(59, 73),     // 14 bytes: FX + output + family check
    _rawBody: body,
    bytes,
    warnings,
  };
}
