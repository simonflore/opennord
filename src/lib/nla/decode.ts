/**
 * Nord Lead A1 Sound (`.nlas`) body decoder.
 *
 * The CBIN container (44-byte header) is handled by `clavia/cbin.ts`; this
 * module decodes the 79-byte body that follows it (bytes 0x2C onward).
 *
 * ## What's confirmed (corpus RE, 2026-06-22, 51 fixtures)
 *
 * The body is a MIDI-style **7-bit-packed parameter bitstream**, not byte-aligned
 * fields. The stream begins at bit 4 of body[0]; the high nibble of body[0] is a
 * constant-0 header marker (verified 0 in all 51 files). 320/632 body bits vary.
 *
 * | Body offset | Field | Source / status |
 * |-------------|-------|-----------------|
 * | 0 (hi nibble) | Bitstream header (const 0) | confirmed (all 51) |
 * | 77-78 | LE CRC-16/CCITT-FALSE over file[0:-2] (clavia/crc16.ts) | confirmed 50/51 |
 * | 32, 48-50, 53, 61, 71, 74-75 | Section padding (const 0) | confirmed |
 *
 * ## What's staged for future RE
 *
 * The varying bits group into three dense runs that, by the standard Nord Lead
 * front-panel order (osc → filter → envelopes → LFO/arp → FX/voice), map to:
 *   - body[1-31]  → oscillator + filter + envelopes (`_oscFilterSection`)
 *   - body[33-47] → LFO / arpeggiator (`_lfoArpSection`)
 *   - body[51-76] → effects + voice/global (`_fxVoiceSection`)
 *
 * Exact per-knob attribution is NOT derivable here: the corpus has no
 * single-knob-delta pairs and field widths are mixed (7-bit knobs interleaved
 * with 1-3 bit enums), so the sections are passed through raw until differential
 * RE (export → move ONE knob → re-export → diff) pins the bit layout.
 *
 * All fixtures are version raw=7 → '0.07'.
 */

import { CBIN_BODY_OFFSET as BODY_OFFSET, formatCbinVersion } from '../clavia/cbin';
import type { NlaProgram } from './types';

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/** Decode a Nord Lead A1 program body (full file bytes including CBIN header). */
export function decodeNla(bytes: Uint8Array): NlaProgram {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  const version = formatCbinVersion(bytes);

  // Confirmed structural fields.
  const headerNibble = (u8(body, 0) >>> 4) & 0xf; // const 0 — bitstream marker
  // CRC-16/CCITT-FALSE over the whole file except the final 2 bytes, stored
  // little-endian (clavia/crc16.ts; confirmed 50/51 corpus 2026-07-04 — the
  // one miss is an odd-length file with a zeroed trailer).
  const checksum = u8(body, 77) | (u8(body, 78) << 8);

  // Leading params of the 7-bit bitstream (which starts at bit 4). Per the Stage
  // synth engine order the first fields are layer on/off then volume.
  // Confirmed: layerOn@bit4 = {0,1}; volume@bits5-11 varies 0-76 across 51 fixtures.
  // Stage oracle: y layer on/off [1b] + y volume [7b] (group y).
  const layerOn = ((u8(body, 0) >>> 3) & 1) === 1; // bit 4 (MSB-first, 0-indexed)
  const volume = ((u8(body, 0) & 0x07) << 4) | ((u8(body, 1) >>> 4) & 0x0f); // bits 5-11

  return {
    parsed: true,
    version,
    headerNibble,
    layerOn,
    volume,
    checksum,
    // Candidate sections, named by Nord front-panel order; raw pending RE.
    _oscFilterSection: body.slice(1, 32),
    _lfoArpSection: body.slice(33, 48),
    _fxVoiceSection: body.slice(51, 77),
    _rawBody: body,
    bytes,
    warnings,
  };
}
