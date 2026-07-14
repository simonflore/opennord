/**
 * Nord Electro 5 (`.ne5p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 103 bytes (147 - 44).
 *
 * Parameter layout (cross-model Stage-oracle alignment + corpus RE, 2026-06-22,
 * 13 fixtures). Confirmed fields are aligned against the Stage organ/piano
 * parameter groups (traceability cited per field, per CLAUDE.md):
 *
 * | Field               | body range | status    | Stage oracle param                       |
 * |---------------------|------------|-----------|------------------------------------------|
 * | programTypeFlags    | 0          | candidate | —                                        |
 * | constant_0x00       | 1-5        | constant  |                                          |
 * | sectionEnableNibble | 6          | candidate | —                                        |
 * | sampleModelId       | 7-12       | confirmed | piano model ID/name (group p, 245-5, 32b)|
 * | sampleModelFlag     | 13 bit7    | confirmed | (companion to model id)                  |
 * | constant_0x00       | 14-16      | constant  |                                          |
 * | sampleSectionActive | 17 bit7    | confirmed | piano on/off (m 084-6 / p 230-3)         |
 * | constant_0x00       | 18         | constant  |                                          |
 * | flagByte19          | 19         | candidate | —                                        |
 * | constant_0x00       | 20         | constant  |                                          |
 * | preset1Upper        | 21-25      | confirmed | organ drawbar 1..9 (group o, 117..136-1) |
 * | nibbleField26       | 26         | candidate |                                          |
 * | constant_0x00       | 27         | constant  |                                          |
 * | preset1Lower        | 28-32      | confirmed | organ drawbar 1..9 (group o, lower)      |
 * | ...                 | 33-38      | candidate/constant                          |
 * | preset2Upper        | 39-43      | confirmed | organ drawbar 1..9 (group o, 2nd preset) |
 * | constant_0x00       | 44         | constant  |                                          |
 * | preset2Lower        | 45-49      | confirmed | organ drawbar 1..9 (group o, 2nd lower)  |
 * | ...                 | 50-54      | candidate/constant                          |
 * | pedal               | 55-59      | candidate | organ drawbar 1..9 (group o, pedal/bass) |
 * | ...                 | 60-82      | candidate/constant                          |
 * | sampleDescriptor    | 83-94      | candidate | piano slot/variation (group p 244-6/245-3)|
 * | constant_0x00       | 98-100     | constant  |                                          |
 * | _checksum           | 101-102    | candidate | checksum (group m, id 025-1)             |
 *
 * Source: 13-file corpus statistical analysis + Stage oracle alignment (2026-06-22).
 */

import { CBIN_BODY_OFFSET as BODY_OFFSET, formatCbinVersion } from '../clavia/cbin';
import { readDrawbars } from '../clavia/drawbars';
import type { Ne5Organ, Ne5Program } from './types';

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

function readOrgan(body: Uint8Array): Ne5Organ {
  // Stage oracle: organ drawbar 1..9 (group o, ids 117-1..136-1), nibble-relocated
  // as in NS3 (drawbars@preset1 0xBE). body[21] is the primary/active organ slot.
  const preset1Upper = readDrawbars(body, 21);
  // Stage oracle: organ drawbar 1..9 (group o, lower manual). Mirrors preset-1
  // upper 7 bytes later.
  const preset1Lower = readDrawbars(body, 28);
  // Stage oracle: organ drawbar 1..9 (group o), second organ preset (analogous to
  // NS3 preset2@0xD9).
  const preset2Upper = readDrawbars(body, 39);
  // Stage oracle: organ drawbar 1..9 (group o), second preset lower manual.
  const preset2Lower = readDrawbars(body, 45);
  // Stage oracle: organ drawbar 1..9 (group o), pedal/bass manual — CANDIDATE.
  const pedal = readDrawbars(body, 55);
  return { preset1Upper, preset1Lower, preset2Upper, preset2Lower, pedal };
}

/** Decode a Nord Electro 5 program body (full file bytes including CBIN header). */
export function decodeNe5(bytes: Uint8Array): Ne5Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes`);
  }

  const body = bytes.slice(BODY_OFFSET);

  const version = formatCbinVersion(bytes);

  const sampleModelId = body.slice(7, 13); // 6 bytes — Stage oracle: piano model ID

  return {
    parsed: true,
    version,
    organ: readOrgan(body),
    // --- Confirmed fields (Stage-oracle aligned) ---
    // body[17] bit7: piano/sample section active — Stage oracle m 084-6 / p 230-3
    sampleSectionActive: (u8(body, 17) & 0x80) !== 0,
    // body[7-12]: factory sample/model reference id — Stage oracle p 245-5 (32b)
    sampleModelId,
    // body[13] bit7: trailing flag adjacent to the model id (separate from the id)
    sampleModelFlag: (u8(body, 13) & 0x80) !== 0,
    // body[17] full byte: bit7 is confirmed (sampleSectionActive); lower bits raw
    sectionFlags17: u8(body, 17),
    // --- Candidate scalar fields ---
    programTypeFlags: u8(body, 0),
    sectionEnableNibble: u8(body, 6),
    flagByte19: u8(body, 19),
    // --- Candidate byte-array fields (Stage-oracle aligned) ---
    // body[83-94]: sample-bank descriptor record — Stage oracle p 244-6 / 245-3
    sampleDescriptor: body.slice(83, 95),
    // body[101-102]: trailing checksum — Stage oracle m 025-1 (CRC-16, unverified)
    _checksum: body.slice(101, 103),
    // --- Raw passthrough for ongoing RE ---
    _sampleRefHash: sampleModelId, // alias of sampleModelId, addressed by range
    _organSection: body.slice(17, 34), // 17 bytes, pre-/preset-1 drawbar region
    _extraNibbleGroup: body.slice(71, 75), // 4 bytes, 4th nibble group candidate
    _rawBody: body,
    bytes,
    warnings,
  };
}
