/**
 * Nord Wave (`.nwp`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 306 bytes (350 - 44).
 *
 * Four parameter clusters, separated by zero-padding (corpus RE, 2026-06-22):
 * | Cluster | body range | file range | size |
 * |---------|-----------|------------|------|
 * | A       | 0-75      | 44-119     | 76b  |
 * | B       | 77-115    | 121-159    | 39b  |
 * | C       | 140-255   | 184-299    | 116b |
 * | tail    | 280-305   | 324-349    | 26b  |
 *
 * Constant gaps: body[76]=const(1b), body[116-139]=0(24b),
 *               body[256-279]=0(24b), body[290-302]=0(13b).
 * Version varies across files (raw 6/7/8).
 */

import type { Nw1Program } from './types';

const BODY_OFFSET = 0x2c;

export function decodeNw1(bytes: Uint8Array): Nw1Program {
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
    _clusterA: body.slice(0, 76),
    _clusterB: body.slice(77, 116),
    _clusterC: body.slice(140, 256),
    _clusterTail: body.slice(280, 306),
    _rawBody: body,
    bytes,
    warnings,
  };
}
