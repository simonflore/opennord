/**
 * Nord Lead A1 Sound (`.nlas`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 79 bytes (123 - 44).
 *
 * Three parameter clusters (corpus RE, 2026-06-22, 51 fixtures):
 * | Cluster | body range | size |
 * |---------|-----------|------|
 * | A       | 0-31      | 32b  |
 * | B       | 33-47     | 15b  |
 * | C       | 51-78     | 28b  |
 *
 * body[32]=const(1b), body[48-50]=0(3b).
 * All files are version raw=7 → '0.07'.
 */

import type { NlaProgram } from './types';

const BODY_OFFSET = 0x2c;

export function decodeNla(bytes: Uint8Array): NlaProgram {
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
    _clusterA: body.slice(0, 32),
    _clusterB: body.slice(33, 48),
    _clusterC: body.slice(51, 79),
    _rawBody: body,
    bytes,
    warnings,
  };
}
