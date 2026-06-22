/**
 * Nord Electro 5 (`.ne5p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 103 bytes (147 - 44).
 *
 * Parameter layout (corpus RE, 2026-06-22, 13 fixtures):
 * | Field             | body range | status    | notes                                     |
 * |-------------------|------------|-----------|-------------------------------------------|
 * | programTypeFlags  | 0          | candidate | type/mode — 9 unique values               |
 * | constant_0x00     | 1-5        | constant  |                                           |
 * | sectionEnableNib  | 6          | candidate | 4 unique nibble values                    |
 * | _sampleRefHash    | 7-12       | unknown   | 6-byte hash/sample ref                    |
 * | flagByte13        | 13         | candidate | 0x80 or 0x00                              |
 * | constant_0x00     | 14-16      | constant  |                                           |
 * | sectionFlags17    | 17         | candidate | 6 unique values                           |
 * | constant_0x00     | 18         | constant  |                                           |
 * | flagByte19        | 19         | candidate | 0x40 or 0x00                              |
 * | constant_0x00     | 20         | constant  |                                           |
 * | upperDrawbarsA    | 21-25      | candidate | 9 nibbles (NE6 style), alt layer          |
 * | nibbleField26     | 26         | candidate | 3 unique nibble values                    |
 * | constant_0x00     | 27         | constant  |                                           |
 * | lowerDrawbarsA    | 28-32      | candidate | 9 nibbles (NE6 style), alt layer          |
 * | nibbleField33     | 33         | candidate | 0x20 or 0x00                              |
 * | constant_0x00     | 34         | constant  |                                           |
 * | nibbleFlag35      | 35         | candidate | nibble field                              |
 * | constant_0x00     | 36-38      | constant  |                                           |
 * | upperDrawbarsB    | 39-43      | confirmed | 9 nibbles (NE6 style) — primary upper     |
 * | constant_0x00     | 44         | constant  |                                           |
 * | lowerDrawbarsB    | 45-49      | confirmed | 9 nibbles (NE6 style) — primary lower     |
 * | constant_0x00     | 50         | constant  |                                           |
 * | nibbleField51     | 51         | candidate |                                           |
 * | constant_0x00     | 52-54      | constant  |                                           |
 * | pedalDrawbarsB    | 55-59      | candidate | 9 nibbles (NE6 style) — pedal bass        |
 * | constant_0x00     | 60         | constant  |                                           |
 * | nibbleFlag61      | 61         | candidate | 0x80 or 0x00                              |
 * | constant_0x00     | 62-70      | constant  |                                           |
 * | extraNibbleGroup  | 71-74      | candidate | 4-byte nibble group (4th drawbar set?)    |
 * | constant_0x08     | 75         | constant  | sentinel                                  |
 * | constant_0x00     | 76         | constant  |                                           |
 * | nibbleFlag77      | 77         | candidate | 0x80 or 0x00                              |
 * | constant_0x00     | 78-80      | constant  |                                           |
 * | constant_0x08     | 81         | constant  | sentinel                                  |
 * | constant_0x00     | 82         | constant  |                                           |
 * | _clusterC         | 83-97      | unknown   | sample reference block (15 bytes)         |
 * | constant_0x00     | 98-100     | constant  |                                           |
 * | _checksum         | 101-102    | candidate | likely CRC-16 (2 bytes)                   |
 *
 * Source: 13-file corpus statistical analysis (2026-06-22).
 */

import type { Ne5Drawbars, Ne5Organ, Ne5Program } from './types';

const BODY_OFFSET = 0x2c;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/**
 * Decode 9 nibble-packed drawbar values from 5 body bytes at `bodyOffset`.
 * Encoding is identical to NE6: 9×4-bit nibbles, high-nibble-first within each byte.
 * Bytes 0-3: 8 drawbars (2 per byte); byte 4 hi nibble: drawbar 9; byte 4 lo nibble: _trailing.
 */
function readDrawbars(body: Uint8Array, bodyOffset: number): Ne5Drawbars {
  const bars: number[] = [];
  for (let i = 0; i < 4; i++) {
    const byte = u8(body, bodyOffset + i);
    bars.push((byte >>> 4) & 0xf);
    bars.push(byte & 0xf);
  }
  const last = u8(body, bodyOffset + 4);
  bars.push((last >>> 4) & 0xf);
  return { bars, _trailing: last & 0xf };
}

function readOrgan(body: Uint8Array): Ne5Organ {
  // body[39-43]: upper manual drawbars — CONFIRMED by corpus (11/13 share same default)
  const upper = readDrawbars(body, 39);
  // body[45-49]: lower manual drawbars — CONFIRMED by corpus
  const lower = readDrawbars(body, 45);
  // body[55-59]: pedal drawbars — CANDIDATE (all valid 0-8 nibbles across all fixtures)
  const pedal = readDrawbars(body, 55);
  // body[21-25]: alternate upper drawbars — CANDIDATE (VCS3 Organ = custom values)
  const upperAlt = readDrawbars(body, 21);
  // body[28-32]: alternate lower drawbars — CANDIDATE (mirrors upperAlt structure)
  const lowerAlt = readDrawbars(body, 28);
  return { upper, lower, pedal, upperAlt, lowerAlt };
}

/** Decode a Nord Electro 5 program body (full file bytes including CBIN header). */
export function decodeNe5(bytes: Uint8Array): Ne5Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }

  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  return {
    parsed: true,
    version,
    organ: readOrgan(body),
    // Named scalar candidates
    programTypeFlags: u8(body, 0),
    sectionEnableNibble: u8(body, 6),
    flagByte13: u8(body, 13),
    sectionFlags17: u8(body, 17),
    flagByte19: u8(body, 19),
    // Named byte-array candidates / unknowns
    _sampleRefHash: body.slice(7, 13),     // 6 bytes, possible sample bank ref
    _organSection: body.slice(17, 34),     // 17 bytes, pre-drawbar sparse region
    _extraNibbleGroup: body.slice(71, 75), // 4 bytes, 4th nibble group candidate
    _clusterC: body.slice(83, 98),         // 15 bytes, sample reference block
    _checksum: body.slice(101, 103),       // 2 bytes, likely CRC-16
    _rawBody: body,
    bytes,
    warnings,
  };
}
