/**
 * Nord Lead 4 body decoder.
 *
 * Body offset: 0x2c (44). Two file formats share this decoder:
 *
 * nl4s (Sound, body 299 bytes):
 *   Cluster A (header/global): body[0-24]   (25b)
 *   Cluster B (synth voice):   body[30-102] (73b)  — gap: body[25-29]=0 (5b)
 *   Cluster C (FX/arp/morph):  body[238-264] (27b) — large zero gap body[103-237]
 *   Checksum:                  body[297-298] (CBIN whole-file LE u16, confirmed)
 *
 *   All three clusters are BIT-PACKED, not byte-per-parameter; nearly every
 *   varying byte carries 20-65 distinct values across the 101-file corpus. Only
 *   a handful of byte-aligned selectors at section boundaries are statistically
 *   separable and are surfaced as named fields:
 *     body[30]  — voice head selector  (2-bit enum 0-3)
 *     body[239] — cluster-C enable     (0/1 boolean)
 *     body[245] — cluster-C enum A     (0-7)
 *     body[248] — cluster-C enum B     (0-8)
 *   The oscillators, filter, envelopes, LFOs, arp and effects are all present
 *   but sub-byte; their offsets need differential RE (see types.ts).
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

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

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
      // CBIN whole-file checksum: LE u16 in the final 2 body bytes (confirmed).
      checksum: u8(body, 297) | (u8(body, 298) << 8),
      // Header / global block (bit-packed, raw until differential RE).
      _clusterA: body.slice(0, 25),
      // Main synth voice (cluster B). Head selector body[30] is the only
      // byte-aligned field; body[31-102] is the bit-packed voice payload.
      voice: {
        mode: u8(body, 30) & 0x03,
        _packed: body.slice(31, 103),
      },
      // FX / arp / morph (cluster C). Enable + two enums are byte-aligned; the
      // whole 238-264 region is kept as the packed payload.
      fxArp: {
        enabled: u8(body, 239) !== 0,
        modeA: u8(body, 245),
        modeB: u8(body, 248),
        _packed: body.slice(238, 265),
      },
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
