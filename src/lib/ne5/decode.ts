/**
 * Nord Electro 5 (`.ne5p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 103 bytes (147 - 44).
 *
 * Parameter layout (corpus RE, 2026-06-22, 13 fixtures):
 * | Field      | body range | notes                              |
 * |-----------|------------|------------------------------------|
 * | _byte0     | 0          | type/mode                          |
 * | _clusterA  | 6-13       | voice/category params (8b)         |
 * | _clusterB  | 17-33      | pre-drawbar params (17b, sparse)   |
 * | _drawbars  | 35-81      | 47b nibble-packed; upper/lower/pedal drawbars |
 * | _clusterC  | 83-102     | post-drawbar params (20b)          |
 *
 * Constant: body[1-5]=0, body[14-16]=0, body[52-54]=0,
 *           body[62-70]=0, body[75-76]=0x08 (both nibbles = 8).
 * All files version raw=4 → '0.04'.
 */

import type { Ne5Program } from './types';

const BODY_OFFSET = 0x2c;

export function decodeNe5(bytes: Uint8Array): Ne5Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }
  const body = bytes.slice(BODY_OFFSET);
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);
  return {
    parsed: true,
    version,
    _byte0: body[0] ?? 0,
    _clusterA: body.slice(6, 14),
    _clusterB: body.slice(17, 34),
    _drawbars: body.slice(35, 82),
    _clusterC: body.slice(83, 103),
    _rawBody: body,
    bytes,
    warnings,
  };
}
