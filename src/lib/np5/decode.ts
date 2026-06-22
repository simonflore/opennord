/**
 * Nord Piano 5 (`.np5p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 237 bytes (281 - 44).
 *
 * Confirmed body clusters (corpus RE, 2026-06-22):
 * | Body offset | File offset | Bytes | Notes             |
 * |-------------|-------------|-------|-------------------|
 * | 5-7         | 49-51       | 3     | compact header    |
 * | 18-32       | 62-76       | 15    | primary params    |
 * | 58-66       | 102-110     | 9     |                   |
 * | 90-98       | 134-142     | 9     | mirrors C         |
 * | 122-135     | 166-179     | 14    |                   |
 * | 180-193     | 224-237     | 14    | mirrors E         |
 */

import type { Np5Program } from './types';

const BODY_OFFSET = 0x2c;

export function decodeNp5(bytes: Uint8Array): Np5Program {
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
    _clusterA: body.slice(5, 8),
    _clusterB: body.slice(18, 33),
    _clusterC: body.slice(58, 67),
    _clusterD: body.slice(90, 99),
    _clusterE: body.slice(122, 136),
    _clusterF: body.slice(180, 194),
    _rawBody: body,
    bytes,
    warnings,
  };
}
