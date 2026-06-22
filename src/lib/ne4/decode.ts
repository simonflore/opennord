/**
 * Nord Electro 4 (`.ne4p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 92 bytes (136 - 44).
 *
 * ## Confirmed fields (corpus RE, 2026-06-22, 16 fixtures)
 *
 * | Body offset | Field                        | Source                  |
 * |-------------|------------------------------|-------------------------|
 * | 16-20       | Upper organ drawbars (9 nibs)| 16-file corpus diff     |
 *
 * ## Sparse structure — 33/92 bytes vary
 *
 * | Region     | body offset | status              |
 * |------------|-------------|---------------------|
 * | _byte0     | 0           | candidate (type/mode)|
 * | clusterA   | 16-21       | confirmed (drawbars) + 3 candidate nibs |
 * | _organSection | 37-45    | candidate (sample/synth params) |
 * | zero pad   | 46-50       | constant            |
 * | _sampleSection | 51-63   | candidate (sample ID, zone params) |
 * | zero pad   | 64-67       | constant            |
 * | _tail0     | 68          | candidate (level/mode, bit-3 flag in lo nib) |
 * | zero pad   | 69-78       | constant            |
 * | _tail1     | 79          | candidate (same nibble pattern, hi=0-13) |
 * | zero pad   | 80-89       | constant            |
 * | _tail23    | 90-91       | unknown (program-specific, not checksum) |
 *
 * ## Drawbar encoding (identical to NE6)
 *
 * 9 drawbar values (0-8) are packed as 9 consecutive 4-bit nibbles, high nibble
 * first within each byte. Spans 5 bytes: bytes 0-3 carry 8 drawbars (2 nibbles
 * each), and the high nibble of byte 4 carries drawbar 9. The low nibble of
 * byte 4 is a separate field (_trailing).
 *
 * Drawbar order: 16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1' (standard Hammond).
 *
 * All files are version raw=103 → '1.03'.
 */

import type { Ne4Drawbars, Ne4Organ, Ne4Program } from './types';

const BODY_OFFSET = 0x2c;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/**
 * Decode 9 nibble-packed drawbar values from 5 body bytes at `bodyOffset`.
 * Each nibble is 4 bits (value 0-8); the 10th nibble is an unidentified field.
 * Same encoding as NE6 readDrawbars (body[143-147] in NE6, body[16-20] in NE4).
 */
function readDrawbars(body: Uint8Array, bodyOffset: number): Ne4Drawbars {
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

/**
 * Decode the NE4 organ section from body[16-21].
 *
 * ClusterA layout (6 bytes = 12 nibbles):
 *   nibs[0-8]  → upper drawbars 1-9 (body[16-20], high-nibble-first) [confirmed]
 *   nib[9]     → body[20]lo = extra1 (organ section level candidate: 0/10/11)
 *   nib[10]    → body[21]hi = extra2 (rotary/vibrato candidate: 0/3/9/11/13)
 *   nib[11]    → body[21]lo = extra3 (section flags candidate: 4 or 6 only)
 */
function readOrgan(body: Uint8Array): Ne4Organ {
  // Confirmed by 16-fixture corpus diff (2026-06-22).
  // All 16 corpus files satisfy 0-8 nibble range for drawbars at body[16-20].
  // Example: 'Infectd Sq1' = 888000000, 'Freddie Smith' = 888800000.
  const upper = readDrawbars(body, 16);

  // 3 candidate nibbles immediately following the 9th drawbar nibble
  const extra1 = u8(body, 20) & 0xf;         // body[20]lo
  const byte21 = u8(body, 21);
  const extra2 = (byte21 >>> 4) & 0xf;        // body[21]hi
  const extra3 = byte21 & 0xf;                // body[21]lo

  return {
    upper,
    _extraNibs: [extra1, extra2, extra3],
  };
}

/** Decode a Nord Electro 4 program body (full file bytes including CBIN header). */
export function decodeNe4(bytes: Uint8Array): Ne4Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }
  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  const organ = readOrgan(body);

  // Sparse tail bytes collected individually
  const _tail0 = u8(body, 68);
  const _tail1 = u8(body, 79);
  const _tail23 = body.slice(90, 92);

  // Backward-compatibility aliases: keep existing cluster shapes so that tests
  // checking cluster lengths continue to pass without modification.
  const _clusterA = body.slice(16, 22);  // 6 bytes — same as before
  const _clusterB = body.slice(37, 46);  // 9 bytes — now also exposed as _organSection
  const _clusterC = body.slice(51, 64);  // 13 bytes — now also exposed as _sampleSection

  // Legacy 4-byte tail array: [body[68], body[79], body[90], body[91]]
  const _tail = new Uint8Array(4);
  _tail[0] = _tail0;
  _tail[1] = _tail1;
  _tail[2] = body[90] ?? 0;
  _tail[3] = body[91] ?? 0;

  return {
    parsed: true,
    version,
    _byte0: u8(body, 0),
    organ,
    _organSection: body.slice(37, 46),
    _sampleSection: body.slice(51, 64),
    _tail0,
    _tail1,
    _tail23,
    // Backward-compat aliases
    _clusterA,
    _clusterB,
    _clusterC,
    _tail,
    _rawBody: body,
    bytes,
    warnings,
  };
}
