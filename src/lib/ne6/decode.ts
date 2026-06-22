/**
 * Nord Electro 6 (`.ne6p`) body decoder.
 *
 * The CBIN container (44-byte header) is handled by `clavia/cbin.ts`; this
 * module decodes the 211-byte body that follows it (bytes 0x2C onward).
 *
 * ## What's confirmed (corpus RE, 2026-06-22)
 *
 * | Body offset | Field | Source |
 * |-------------|-------|--------|
 * | 143-147 | Upper organ drawbars (9 nibbles + 4-bit trailer) | 16-file corpus diff |
 * | 158-162 | Lower organ drawbars (same encoding) | 16-file corpus diff |
 *
 * ## What's staged for future RE
 *
 * Body clusters A/B/C/D (bytes 5-8, 20-28, 38-50, 62-75) carry rich variation
 * and are almost certainly the piano/synth section parameters. They are passed
 * through as raw bytes until differential RE pins the field layout.
 *
 * ## Drawbar encoding
 *
 * 9 drawbar values (0-8) are packed as 9 consecutive 4-bit nibbles, high nibble
 * first within each byte.  This spans 5 bytes: bytes 0-3 carry 8 drawbars
 * (2 nibbles each), and the high nibble of byte 4 carries drawbar 9. The low
 * nibble of byte 4 is a separate field not yet decoded (the `_trailing` field).
 *
 * Drawbar order: 16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'  (standard Hammond).
 */

import type { Ne6Drawbars, Ne6Organ, Ne6Program } from './types';

const BODY_OFFSET = 0x2c; // 44 — the CBIN header length

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/**
 * Decode 9 nibble-packed drawbar values from 5 body bytes at `bodyOffset`.
 * Each nibble is 4 bits (value 0-8); the 10th nibble is an unidentified field.
 */
function readDrawbars(body: Uint8Array, bodyOffset: number): Ne6Drawbars {
  const bars: number[] = [];
  // Bytes 0-3: 8 drawbars, 2 per byte (high nibble first)
  for (let i = 0; i < 4; i++) {
    const byte = u8(body, bodyOffset + i);
    bars.push((byte >>> 4) & 0xf);
    bars.push(byte & 0xf);
  }
  // Byte 4: drawbar 9 in the high nibble, unknown in the low nibble
  const last = u8(body, bodyOffset + 4);
  bars.push((last >>> 4) & 0xf);
  return { bars, _trailing: last & 0xf };
}

function readOrgan(body: Uint8Array): Ne6Organ {
  // Confirmed by 16-fixture corpus diff (2026-06-22). All 14 non-organ presets
  // have identical 88888883 / 88888883 defaults; the 2 organ presets (Brass_Boy,
  // Drunken_Brass) have program-specific drawbar values.
  const upper = readDrawbars(body, 143);
  const lower = readDrawbars(body, 158);

  // Raw aux: the 67 body bytes in the organ region outside the drawbar blocks
  // (body 120-142 and 148-157 and 163-186 — everything in the organ area not
  // yet mapped). Sliced as one contiguous region for simplicity; will be split
  // into named fields as RE progresses.
  const _rawAux = body.slice(120, 187);

  return { upper, lower, _rawAux };
}

/** Decode a Nord Electro 6 program body (full file bytes including CBIN header). */
export function decodeNe6(bytes: Uint8Array): Ne6Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  return {
    parsed: true,
    version,
    organ: readOrgan(body),
    // Raw clusters for future RE — named by their body byte range
    _clusterA: body.slice(5, 9),    // 4 bytes, up to 5 unique values across corpus
    _clusterB: body.slice(20, 29),  // 9 bytes, up to 4 unique values
    _clusterC: body.slice(38, 51),  // 13 bytes, richest variation (synth engine candidate)
    _clusterD: body.slice(62, 76),  // 14 bytes
    _rawBody: body,
    bytes: bytes,
    warnings,
  };
}
