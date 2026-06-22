/**
 * Nord Lead 4 body decoder.
 *
 * Body offset: 0x2c (44). Two file formats share this decoder:
 *
 * nl4s (Sound, body 299 bytes):
 *   Cluster A: body[0-24]   (25b)
 *   Cluster B: body[30-102] (73b)  — gap: body[25-29]=0 (5b)
 *   Cluster C: body[238-264] (27b) — large zero gap body[103-237] (135b)
 *
 * nl4p (Program, body 1251 bytes) — 4-slot structure:
 *   Slot 0: body[0-76]   (77b) — main block body[0-31] + body[37-76]
 *   Slot 1: body[245-398] (154b)
 *   Slot 2: body[560-705] (146b)
 *   Slot 3: body[875-1014] (140b)
 *   Each slot followed by ~160-170 bytes of zero padding.
 *
 * Source: corpus RE 2026-06-22.
 */

import type { Nl4Program } from './types';

const BODY_OFFSET = 0x2c;
const NL4S_BODY_LEN = 299;

export function decodeNl4(bytes: Uint8Array): Nl4Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }
  const body = bytes.slice(BODY_OFFSET);
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);
  const tagBytes = bytes.slice(8, 12);
  const tag = String.fromCharCode(...Array.from(tagBytes).filter(b => b > 0));

  if (tag === 'nl4s' || body.length <= NL4S_BODY_LEN) {
    return {
      parsed: true,
      fileType: 'nl4s',
      version,
      _clusterA: body.slice(0, 25),
      _clusterB: body.slice(30, 103),
      _clusterC: body.slice(238, 265),
      _rawBody: body,
      bytes,
      warnings,
    };
  }

  // nl4p — multi-slot program
  return {
    parsed: true,
    fileType: 'nl4p',
    version,
    _slot0: body.slice(0, 77),
    _slot1: body.slice(245, 399),
    _slot2: body.slice(560, 706),
    _slot3: body.slice(875, 1015),
    _rawBody: body,
    bytes,
    warnings,
  };
}
