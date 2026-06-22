/**
 * Nord Piano 4 (`.np4p`) body decoder.
 *
 * Body offset: 0x2c (44 bytes — standard CBIN header).
 * Body length: 90 bytes (134 - 44).
 *
 * Confirmed body clusters (corpus RE, 2026-06-22):
 * | Body offset | File offset | Bytes | Unique values |
 * |-------------|-------------|-------|---------------|
 * | 17-25       | 61-69       | 9     | ≤4            |
 * | 35-47       | 79-91       | 13    | ≤5            |
 * | 59-72       | 103-116     | 14    | ≤13           |
 */

import type { Np4Program } from './types';

const BODY_OFFSET = 0x2c;

export function decodeNp4(bytes: Uint8Array): Np4Program {
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
    _clusterA: body.slice(17, 26),
    _clusterB: body.slice(35, 48),
    _clusterC: body.slice(59, 73),
    _rawBody: body,
    bytes,
    warnings,
  };
}
