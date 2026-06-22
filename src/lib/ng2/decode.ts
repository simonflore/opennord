/**
 * Nord Grand 2 (`.ng2p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 185 bytes (229 - 44).
 *
 * Confirmed body clusters (corpus RE, 2026-06-22):
 * | Body offset | File offset | Bytes | Notes                  |
 * |-------------|-------------|-------|------------------------|
 * | 5-8         | 49-52       | 4     | global header          |
 * | 22-30       | 66-74       | 9     | layer A, primary       |
 * | 36-44       | 80-88       | 9     | layer B mirror         |
 * | 50-65       | 94-109      | 16    | layer A, extended      |
 * | 72-87       | 116-131     | 16    | layer B mirror         |
 * | 100-113     | 144-157     | 14    | layer A, effects       |
 * | 121-134     | 165-178     | 14    | layer B mirror         |
 * | 142-157     | 186-201     | 16    | layer A, final         |
 * | 164-179     | 208-223     | 16    | layer B mirror         |
 */

import type { Ng2Program } from './types';

const BODY_OFFSET = 0x2c;

export function decodeNg2(bytes: Uint8Array): Ng2Program {
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
    _clusterA:  body.slice(5,   9),
    _clusterB1: body.slice(22,  31),
    _clusterB2: body.slice(36,  45),
    _clusterC1: body.slice(50,  66),
    _clusterC2: body.slice(72,  88),
    _clusterD1: body.slice(100, 114),
    _clusterD2: body.slice(121, 135),
    _clusterE1: body.slice(142, 158),
    _clusterE2: body.slice(164, 180),
    _rawBody: body,
    bytes,
    warnings,
  };
}
