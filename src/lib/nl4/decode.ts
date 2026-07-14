/**
 * Nord Lead 4 body decoder.
 *
 * Body offset: 0x2c (44). Two file formats share this decoder:
 *
 * nl4s (Sound, body 299 bytes):
 *   Cluster A (header/global): body[0-24]    (25b)  — gap: body[25-29]=0
 *   Voice/FX params:           body[30-246]  (217b) — one contiguous packed run
 *   Morph/assign block:        body[248-288] (41b)  — gap: body[247]=0
 *   Zero pad:                  body[289-296]
 *   Checksum:                  body[297-298] (LE CRC-16/CCITT-FALSE over file[0:-2], clavia/crc16.ts; confirmed 1275/1275)
 *
 *   The params are BIT-PACKED, not byte-per-parameter. Byte-aligned fields that
 *   are statistically separable across the corpus:
 *     body[30]  — voice head selector  (values 0-10 observed; ≥4-bit selector)
 *     body[239] — enable flag          (0/1 boolean)
 *     body[245] — enum A               (0-7, all 8 values observed)
 *     body[248] — stepped value B      (0-20 observed; knob or wide enum)
 *   The oscillators, filter, envelopes, LFOs, arp and effects are all present
 *   but sub-byte; their offsets need differential RE (see types.ts).
 *
 *   NOTE (2026-07-04 re-census, 1275 nl4s incl. factory banks 1-3): the earlier
 *   101-file JD73-heavy corpus showed body[103-237] as constant-zero and led to
 *   a false "cluster B 30-102 / cluster C 238-264" split; the factory corpus
 *   varies the whole 30-246 run. body[30] was likewise mis-read as a 2-bit enum
 *   (0-3) and body[248] as 0-8 — both widened by the larger corpus.
 *
 * nl4p (Program, body 1251 bytes) — 4-slot structure, 315-byte stride:
 *   Slot 0: body[0-295]     Slot 1: body[304-610]
 *   Slot 2: body[619-925]   Slot 3: body[934-1240]
 *   (per-slot varying extents from the 494-file census; inter-slot gaps are
 *   constant-zero)
 *   Checksum: body[1249-1250] (LE CRC-16/CCITT-FALSE over file[0:-2], same as nl4s; confirmed 494/494)
 *
 * Source: corpus RE 2026-06-22; re-censused 2026-07-04 over 1275 nl4s +
 * 494 nl4p (factory sound banks + 9 artist banks from Nord's published zips).
 *
 * The complete list of parameters that must live in the packed regions (name,
 * CC, value range/enum, transcribed from the manual) is in
 * `parameters.reference.ts` — the oracle for naming fields as differential RE
 * places them.
 */

import { CBIN_BODY_OFFSET as BODY_OFFSET, formatCbinVersion } from '../clavia/cbin';
import type { Nl4Program } from './types';

const NL4S_BODY_LEN = 299;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

export function decodeNl4(bytes: Uint8Array): Nl4Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }
  const body = bytes.slice(BODY_OFFSET);
  const version = formatCbinVersion(bytes);
  const tagBytes = bytes.slice(8, 12);
  const tag = String.fromCharCode(...Array.from(tagBytes).filter(b => b > 0));

  if (tag === 'nl4s' || body.length <= NL4S_BODY_LEN) {
    return {
      parsed: true,
      fileType: 'nl4s',
      version,
      // LE CRC-16/CCITT-FALSE over file[0:-2], stored in the final 2 body bytes
      // (clavia/crc16.ts; confirmed 1275/1275 corpus 2026-07-04).
      checksum: u8(body, 297) | (u8(body, 298) << 8),
      // Header / global block (bit-packed, raw until differential RE).
      _clusterA: body.slice(0, 25),
      // Voice/FX params: one contiguous packed run body[30-246]. Head selector
      // body[30] is byte-aligned (0-10 observed across 1275 files).
      voice: {
        mode: u8(body, 30),
        _packed: body.slice(31, 247),
      },
      // Byte-aligned islands inside the packed run + the morph/assign block
      // body[248-288] (body[247] is constant-zero).
      fxArp: {
        enabled: u8(body, 239) !== 0,
        modeA: u8(body, 245),
        modeB: u8(body, 248),
        _packed: body.slice(248, 289),
      },
      _rawBody: body,
      bytes,
      warnings,
    };
  }

  // nl4p — multi-slot program (315-byte stride; extents from the 494-file census)
  return {
    parsed: true,
    fileType: 'nl4p',
    version,
    // LE CRC-16/CCITT-FALSE trailer, same convention as nl4s (confirmed 494/494).
    checksum: u8(body, 1249) | (u8(body, 1250) << 8),
    _slot0: body.slice(0, 296),
    _slot1: body.slice(304, 611),
    _slot2: body.slice(619, 926),
    _slot3: body.slice(934, 1241),
    _rawBody: body,
    bytes,
    warnings,
  };
}
