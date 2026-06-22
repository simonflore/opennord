/**
 * Nord Piano 4 (`.np4p`) body decoder.
 *
 * Body offset: 0x2c (44 bytes — standard CBIN header).
 * Body length: 90 bytes (134 - 44).
 *
 * ## Confirmed body fields (corpus RE, 2026-06-22, 6 fixtures × 134 bytes)
 *
 * | Body offset | File offset | Field | Notes |
 * |-------------|-------------|-------|-------|
 * | 19-23       | 63-67       | pianoSoundModelId | George=Tea shared bytes confirm model, not program |
 * | 25          | 69          | pianoFamily | 0x80=EP, 0x00=Grand; clean binary split |
 * | 72          | 116         | pianoFamilyCheck | 0x0c=EP, 0x90=Grand; perfectly correlated with b25 |
 *
 * ## Candidate fields (body offset / source)
 *
 * | Body offset | Field | Evidence |
 * |-------------|-------|----------|
 * | 35          | pianoLevel | Range 71-95, monotone variation, 0-127 scale |
 * | 36 bits 7-6 | velocityCurve | 2-bit enum (0=Soft, 1=Med, 3=Heavy); values clean |
 * | 59-60       | effectsWord | 0x0202 = off (3 programs); non-zero = active (3 programs) |
 * | 66-69       | effectParams | Tea Phaser has distinctly non-zero [0x3f, 0x8d, 0x70, 0xf2] |
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

/** Decode piano family from body[25]. Confirmed: 0x80=EP, 0x00=Grand. */
function readPianoFamily(body: Uint8Array): Np4PianoFamily {
  return u8(body, 25) === 0x80 ? 'EP' : 'Grand';
}

/** Decode velocity curve from body[36] bits 7-6. Candidate field. */
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

  // Confirmed: body[25] piano family flag
  const pianoFamily = readPianoFamily(body);

  // Confirmed: body[72] redundant family check
  const pianoFamilyCheck = u8(body, 72);

  // Confirmed: bytes 19-23 = 5-byte opaque sound model ID
  const pianoSoundModelId = body.slice(19, 24);

  // Candidate: body[35] = output level (0-127 scale; observed 71-95)
  const pianoLevel = u8(body, 35);

  // Candidate: body[36] bits 7-6 = velocity curve
  const velocityCurve = readVelocityCurve(body);

  // Candidate: body[59-60] big-endian uint16 effects on/off word
  const effectsWord = (u8(body, 59) << 8) | u8(body, 60);

  // Candidate: body[66-69] = effect parameter block (phaser rate/depth/mix)
  const effectParams = body.slice(66, 70);

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
    pianoSoundModelId,
    pianoFamilyCheck,
    // Candidate fields
    pianoLevel,
    velocityCurve,
    effectsWord,
    effectParams,
    // Raw clusters — renamed from generic _clusterX to meaningful section names
    _soundSection: body.slice(17, 26),    // 9 bytes: sound ID + family flag
    _pianoParams: body.slice(35, 48),     // 13 bytes: level + velocity + voicing
    _effectsSection: body.slice(59, 73),  // 14 bytes: effects + output + family check
    _rawBody: body,
    bytes,
    warnings,
  };
}
