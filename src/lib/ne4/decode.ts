/**
 * Nord Electro 4 (`.ne4p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 92 bytes (136 - 44).
 *
 * Sparse structure — only 33/92 bytes vary (corpus RE, 2026-06-22, 16 fixtures):
 * | Field      | body offset | notes                              |
 * |-----------|-------------|------------------------------------|
 * | _byte0     | 0           | type/mode                          |
 * | _clusterA  | 16-21       | organ section params (6b)          |
 * | _clusterB  | 37-45       | second param block (9b)            |
 * | _clusterC  | 51-63       | 13b = 26 nibbles; drawbars suspected |
 * | _tail      | 68,79,90-91 | sparse (4b total, from 3 locations)|
 *
 * All files are version raw=103 → '1.03'.
 */

import type { Ne4Program } from './types';

const BODY_OFFSET = 0x2c;

export function decodeNe4(bytes: Uint8Array): Ne4Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }
  const body = bytes.slice(BODY_OFFSET);
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);
  // Collect sparse tail bytes into a single buffer: body[68], body[79], body[90], body[91]
  const tail = new Uint8Array(4);
  tail[0] = body[68] ?? 0;
  tail[1] = body[79] ?? 0;
  tail[2] = body[90] ?? 0;
  tail[3] = body[91] ?? 0;
  return {
    parsed: true,
    version,
    _byte0: body[0] ?? 0,
    _clusterA: body.slice(16, 22),
    _clusterB: body.slice(37, 46),
    _clusterC: body.slice(51, 64),
    _tail: tail,
    _rawBody: body,
    bytes,
    warnings,
  };
}
