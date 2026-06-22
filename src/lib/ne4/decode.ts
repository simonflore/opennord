/**
 * Nord Electro 4 (`.ne4p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 92 bytes (136 - 44).
 *
 * ## Confirmed fields (corpus RE + Stage-oracle alignment, 2026-06-22, 16 fixtures)
 *
 * | Body offset | Field                            | Stage oracle                | Source              |
 * |-------------|----------------------------------|-----------------------------|---------------------|
 * | 4-8         | Organ drawbars — default slot 1  | 117-1..136-1 (group o)      | 16-file corpus diff |
 * | 16-20       | Organ drawbars — active/edited   | 117-1..136-1 (group o)      | 16-file corpus diff |
 * | 25-29       | Organ drawbars — default slot 2  | 117-1..136-1 (group o)      | 16-file corpus diff |
 *
 * The NE4 stores multiple organ drawbar slots (Electro's two organ presets plus
 * the live/edited registration). body[4-8] and body[25-29] are byte-identical
 * factory-default blocks (8,8,0,0,0,0,0,8,8) constant across all 16 files;
 * body[16-20] tracks patch identity and is the block the user edits.
 *
 * ## Candidate fields (Stage-oracle position match, bit map unverified)
 *
 * | Body offset | Field                       | Stage oracle                          |
 * |-------------|-----------------------------|---------------------------------------|
 * | 0           | section enable / mode flags | 084-5/6/7 section on/off (group m)     |
 * | 20lo,21     | vib/chorus + percussion     | 141-1..141-5 (group o)                 |
 * | 37-41       | sample reference ID [~40b]  | piano model ID [32b] (group p)         |
 * | 43-44       | sample voice params         | piano touch/timbre/level (group p)     |
 *
 * ## Sparse structure — 33/92 bytes vary
 *
 * | Region          | body offset | status              |
 * |-----------------|-------------|---------------------|
 * | sectionFlags    | 0           | candidate (master section enable) |
 * | drawbars def1   | 4-8         | confirmed           |
 * | drawbars active | 16-20       | confirmed           |
 * | vib/perc        | 20lo-21     | candidate           |
 * | drawbars def2   | 25-29       | confirmed           |
 * | sample.refId    | 37-41       | candidate (sample ID) |
 * | sample.voice    | 43-44       | candidate (voice params) |
 * | _organSection   | 37-45       | raw superset of refId |
 * | _sampleSection  | 51-63       | candidate (zone params) |
 * | _tail0          | 68          | candidate           |
 * | _tail1          | 79          | candidate           |
 * | _tail23         | 90-91       | unknown (program-specific) |
 *
 * ## Drawbar encoding (identical to NE6)
 *
 * 9 drawbar values (0-8) are packed as 9 consecutive 4-bit nibbles, high nibble
 * first within each byte. Spans 5 bytes: bytes 0-3 carry 8 drawbars (2 nibbles
 * each), and the high nibble of byte 4 carries drawbar 9. The low nibble of
 * byte 4 is a separate field (_trailing).
 *
 * Drawbar order: 16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1' (standard Hammond).
 *
 * All files are version raw=103 → '1.03'.
 */

import type { Ne4Drawbars, Ne4Organ, Ne4Program, Ne4Sample } from './types';

const BODY_OFFSET = 0x2c;

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/**
 * Decode 9 nibble-packed drawbar values from 5 body bytes at `bodyOffset`.
 * Each nibble is 4 bits (value 0-8); the 10th nibble is an unidentified field.
 * Same encoding as NE6 readDrawbars (body[143-147] in NE6).
 * Stage oracle: 117-1..136-1 drawbar 1..9 (group o).
 */
function readDrawbars(body: Uint8Array, bodyOffset: number): Ne4Drawbars {
  const bars: number[] = [];
  // Bytes 0-3: 8 drawbars, 2 per byte (high nibble first)
  for (let i = 0; i < 4; i++) {
    const byte = u8(body, bodyOffset + i);
    bars.push((byte >>> 4) & 0xf);
    bars.push(byte & 0xf);
  }
  // Byte 4: drawbar 9 in the high nibble, unknown in the low nibble
  const last = u8(body, bodyOffset + 4);
  bars.push((last >>> 4) & 0xf);
  return { bars, _trailing: last & 0xf };
}

/**
 * Decode the NE4 organ section.
 *
 * Three drawbar slots (Stage oracle 117-1..136-1, group o):
 *   active         → body[16-20] (confirmed, patch-tracking, user-edited)
 *   presetDefault1 → body[4-8]   (confirmed, factory-default twin)
 *   presetDefault2 → body[25-29] (confirmed, factory-default twin)
 *
 * Vib/perc flags candidate (Stage oracle 141-1..141-5, group o): the 3 sub-byte
 * nibbles immediately after the active drawbar block, exposed raw.
 */
function readOrgan(body: Uint8Array): Ne4Organ {
  // All 3 slots satisfy the 0-8 nibble range across the 16-fixture corpus.
  const active = readDrawbars(body, 16);          // body[16-20] — edited registration
  const presetDefault1 = readDrawbars(body, 4);   // body[4-8]   — factory default 1
  const presetDefault2 = readDrawbars(body, 25);  // body[25-29] — factory default 2

  // Vib/chorus + percussion flags candidate — body[20]lo + body[21].
  // Stage oracle: 141-1..141-5 (group o). Exposed as raw nibbles (bit map unverified).
  const flag0 = u8(body, 20) & 0xf;        // body[20]lo
  const byte21 = u8(body, 21);
  const flag1 = (byte21 >>> 4) & 0xf;      // body[21]hi
  const flag2 = byte21 & 0xf;              // body[21]lo
  const vibPercFlags: [number, number, number] = [flag0, flag1, flag2];

  return {
    active,
    presetDefault1,
    presetDefault2,
    _vibPercFlags: vibPercFlags,
    // Backward-compat aliases
    upper: active,
    _extraNibs: vibPercFlags,
  };
}

/**
 * Decode the NE4 Piano/Sample section reference + voice params.
 * Stage oracle: piano model ID [32b] (group p) for refId; piano touch/timbre/
 * level family (group p) for voiceParams. Both candidate (exact split unverified).
 */
function readSample(body: Uint8Array): Ne4Sample {
  return {
    refId: body.slice(37, 42),       // body[37-41] — ~40-bit factory sample-set ID
    voiceParams: body.slice(43, 45), // body[43-44] — per-sound level/timbre/zone
  };
}

/** Decode a Nord Electro 4 program body (full file bytes including CBIN header). */
export function decodeNe4(bytes: Uint8Array): Ne4Program {
  const warnings: string[] = [];
  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }
  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  const organ = readOrgan(body);
  const sample = readSample(body);

  // Section enable / program-mode flags — body[0].
  // Stage oracle: 084-5/6/7 section on/off (group m). Candidate.
  const sectionFlags = u8(body, 0);

  // Sparse tail bytes collected individually
  const _tail0 = u8(body, 68);
  const _tail1 = u8(body, 79);
  const _tail23 = body.slice(90, 92);

  // Backward-compatibility aliases: keep existing cluster shapes so that tests
  // checking cluster lengths continue to pass without modification.
  const _clusterA = body.slice(16, 22);  // 6 bytes — same as before
  const _clusterB = body.slice(37, 46);  // 9 bytes — now also exposed as _organSection
  const _clusterC = body.slice(51, 64);  // 13 bytes — now also exposed as _sampleSection

  // Legacy 4-byte tail array: [body[68], body[79], body[90], body[91]]
  const _tail = new Uint8Array(4);
  _tail[0] = _tail0;
  _tail[1] = _tail1;
  _tail[2] = body[90] ?? 0;
  _tail[3] = body[91] ?? 0;

  return {
    parsed: true,
    version,
    sectionFlags,
    organ,
    sample,
    _organSection: body.slice(37, 46),
    _sampleSection: body.slice(51, 64),
    _tail0,
    _tail1,
    _tail23,
    // Backward-compat aliases
    _byte0: sectionFlags,
    _clusterA,
    _clusterB,
    _clusterC,
    _tail,
    _rawBody: body,
    bytes,
    warnings,
  };
}
