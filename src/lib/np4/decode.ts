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
 * ## Confirmed body fields (Ondre bundle meta.xml ground truth 2026-07-04,
 * ## re-validated over the 212-file factory-restore corpus)
 *
 * | Body offset | File offset | Field | Notes |
 * |-------------|-------------|-------|-------|
 * | 19 lo-nibble | 63         | pianoSlot | The piano's partition slot: matches the paired .npno's CBIN slot byte (@0x0e), 6/6 bundle pairs. High nibble 0x4 = piano-section prefix |
 * | 20-24 bit1  | 64-68       | pianoModelId | FAMILY-WIDE 32-bit piano model id, MSB-packed with a 2-bit continuation: BE(body[20:24])·4 + (body[24]>>6). Resolves through the Stage 4 PIANO_NAMES table to the correct piano name across the corpus (George Model E & Tea Phaser → 1691162699 = "EP5 BrightTines XL") |
 *
 * ## Sample section (body[35-47])
 *
 * Every bundle program declares exactly one .nsmp3 sample dep, and the
 * George-vs-Tea diff (same piano, different sample) covers body[35-47]
 * contiguously — this 13-byte region is the SAMPLE-SYNTH section, holding a
 * device-generated sample reference (hash family) plus sample params. It is
 * high-entropy across the corpus and NOT a set of clean scalar fields.
 *
 * ## Falsified by the 212-file re-census (2026-07-04) — were 6-file artifacts
 *
 * | Body offset | Discarded claim | Why |
 * |-------------|-----------------|-----|
 * | 25 bit7     | pianoFamily EP/Grand | Does not track the modelId→name family (bit7=0 → 106 Grand/26 EP; bit7=1 → 34 Grand/19 EP) |
 * | 72          | pianoFamilyCheck 0x0c/0x90 | 16 distinct values, most common 0x00 (96 files) — not a binary check |
 * | 35          | pianoLevel 71-95 | 59 distinct values, full-byte range with bit7 set — sample-section data, not a level |
 * | 36 bits 7-6 | velocityCurve | Inside the sample section; unverified |
 *
 * ## Candidate fields
 *
 * | Body offset | Field | Stage oracle param | Evidence |
 * |-------------|-------|--------------------|----------|
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

import { CBIN_BODY_OFFSET as BODY_OFFSET, formatCbinVersion } from '../clavia/cbin';
import type { Np4Program } from './types';

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;
const int32be = (b: Uint8Array, o: number): number =>
  u8(b, o) * 0x1000000 + u8(b, o + 1) * 0x10000 + u8(b, o + 2) * 0x100 + u8(b, o + 3);

/** Decode Nord Piano 4 program body (full file bytes including CBIN header). */
export function decodeNp4(bytes: Uint8Array): Np4Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  const version = formatCbinVersion(bytes);

  // Confirmed: family-wide 32-bit piano model id, MSB-packed with a 2-bit
  // continuation into body[24]. Multiplication (not <<2) — values exceed 2^31.
  // Ground truth: the 6 Ondre-bundle programs resolve through the Stage 4
  // PIANO_NAMES table to exactly the .npno their meta.xml declares, and the id
  // matches the correct piano name across the 212-file corpus.
  const pianoModelId = int32be(body, 20) * 4 + (u8(body, 24) >> 6);
  // Confirmed: body[19] low nibble = the piano's partition slot (matches the
  // paired .npno CBIN slot byte @0x0e, 6/6). High nibble 0x4 = section prefix.
  const pianoSlot = u8(body, 19) & 0x0f;

  // Candidate: body[59-60] big-endian uint16 = FX-mod region head word.
  // Stage oracle: 267-1 FX mod 1 on/off + 275-5 FX mod 2 on/off region, group p.
  // (0x0202 is NOT an "off" sentinel — Tea Phaser is active and also reads 0x0202.)
  const fxModWord = (u8(body, 59) << 8) | u8(body, 60);

  // Candidate: body[66-69] = FX modulation parameter block.
  // Stage oracle: 267-3 FX mod 1 rate [7b] / 271-2 FX mod 1 amount [7b], group p.
  const fxModParams = body.slice(66, 70);

  // RE-CENSUS 2026-07-04 (212 files, factory-restore corpus) FALSIFIED the
  // small-corpus (6-file) family/level claims — they were artifacts:
  //   - body[25] bit7 "piano family EP/Grand": does NOT track the modelId→name
  //     family (bit7=0 → 106 Grand / 26 EP; bit7=1 → 34 Grand / 19 EP). Removed.
  //   - body[72] "redundant family check 0x0c/0x90": 16 distinct values across
  //     the corpus, most common 0x00 (96 files). Not a binary check. Removed.
  //   - body[35] "piano level 71-95": 59 distinct values spanning the full byte
  //     with bit7 set — it is high-entropy SAMPLE-section data, not a level.
  //   - body[36] "velocity curve": also inside the sample section; unverified.
  // Surviving confirmed fields: pianoModelId (name) + pianoSlot, both bundle-
  // validated. The sample section (body[35-47]) is kept raw pending real RE.

  return {
    parsed: true,
    version,
    // Confirmed (bundle-validated across the 212-file corpus)
    pianoModelId,
    pianoSlot,
    // Candidate FX region
    fxModWord,
    fxModParams,
    // Raw clusters — meaningful section names by body byte range
    _soundSection: body.slice(17, 26),   // 9 bytes: slot + model id
    _sampleSection: body.slice(35, 48),  // 13 bytes: sample ref (device-gen hash) + sample params
    _fxSection: body.slice(59, 73),      // 14 bytes: FX region
    _rawBody: body,
    bytes,
    warnings,
  };
}
