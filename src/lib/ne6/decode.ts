/**
 * Nord Electro 6 (`.ne6p`) body decoder.
 *
 * The CBIN container (44-byte header) is handled by `clavia/cbin.ts`; this
 * module decodes the 211-byte body that follows it (bytes 0x2C onward).
 *
 * ## What's confirmed (corpus RE, 2026-06-22)
 *
 * | Body offset | Field | Source |
 * |-------------|-------|--------|
 * | 143-147 | Upper organ drawbars (9 nibbles + 4-bit trailer) | 16-file corpus diff |
 * | 158-162 | Lower organ drawbars (same encoding) | 16-file corpus diff |
 *
 * ## Cross-model-mapped candidates (Stage oracle alignment, 2026-06-22)
 *
 * | Body offset | Field | Stage oracle param |
 * |-------------|-------|--------------------|
 * | 5-6 | Section/layer enable bits | m:084-5/6, m:095-3 |
 * | 38-39 | Sample type/slot/variation header | p:244-3/6, p:245-3 |
 * | 40-43 | Sample model ID [32b] | p:245-5 |
 * | 124-125 | Organ pre-drawbar lead-in | o:113-1/5, o:114-1/2/5 |
 *
 * These are placed by order + entropy/variance signature against the Stage param
 * layout; the all-default corpus can't value-verify the packed sub-fields, so
 * they're surfaced as decoded bits (enables) or raw regions, not full enums.
 *
 * ## What's staged for future RE
 *
 * Body clusters B/D (bytes 20-28, 62-75) carry variation and are almost
 * certainly more piano/synth section parameters. They are passed through as raw
 * bytes until differential RE pins the field layout.
 *
 * ## Negative result — organ CORE cluster is NOT a tight bitstream abutting the
 * drawbars (validated 2026-06-22, 16-file corpus)
 *
 * The Stage organ section is a contiguous MSB-first bitstream
 * (volume[7b]/zones[4b]/octave[4b]/susped[1b]/model[3b]/preset[1b] → 9×drawbar[4b]
 * → vib/perc flags). Walking that layout *backward* from the byte-aligned drawbar
 * start (bit 1144) decodes garbage that fails range checks across the whole
 * corpus — `model` reads a constant 7 (out of its 0-4 range) and `volume` reads a
 * constant 0. So NE6 does NOT pack the organ core as a tight bitstream
 * immediately before the drawbar bytes; the drawbar blocks are byte-aligned and
 * framed by structural constants (byte 142 = `0e`, byte 148 = `80`; same for the
 * lower block at 157/163) that stay fixed even for the organ-edited presets — i.e.
 * they are NOT volume/zones/octave/model/preset (those would move when the organ
 * is re-registered). The only organ data that varies in this all-default corpus
 * is the drawbars themselves (confirmed), the `_trailing` nibble after drawbar 9
 * (varies 0x3 → 0xb on Duvet_Pad — this is where the Stage vib/perc flags sit, but
 * one varying sample can't name the individual bits), and the 124-125 lead-in
 * (candidate). No additional musician-facing CORE field value-validates against
 * this corpus, so none is promoted — a labeled/organ-section-disabled fixture is
 * required to break the all-default ambiguity. Don't re-chase the abutting
 * bitstream hypothesis without new data.
 *
 * ## Drawbar encoding
 *
 * 9 drawbar values (0-8) are packed as 9 consecutive 4-bit nibbles, high nibble
 * first within each byte.  This spans 5 bytes: bytes 0-3 carry 8 drawbars
 * (2 nibbles each), and the high nibble of byte 4 carries drawbar 9. The low
 * nibble of byte 4 is a separate field not yet decoded (the `_trailing` field).
 *
 * Drawbar order: 16', 8', 5⅓', 4', 2⅔', 2', 1⅗', 1⅓', 1'  (standard Hammond).
 */

import type {
  Ne6Drawbars,
  Ne6Organ,
  Ne6Program,
  Ne6Sample,
  Ne6SectionEnable,
} from './types';

const BODY_OFFSET = 0x2c; // 44 — the CBIN header length

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/**
 * Decode 9 nibble-packed drawbar values from 5 body bytes at `bodyOffset`.
 * Each nibble is 4 bits (value 0-8); the 10th nibble is an unidentified field.
 */
function readDrawbars(body: Uint8Array, bodyOffset: number): Ne6Drawbars {
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

function readOrgan(body: Uint8Array): Ne6Organ {
  // Confirmed by 16-fixture corpus diff (2026-06-22). All 14 non-organ presets
  // have identical 88888883 / 88888883 defaults; the 2 organ presets (Brass_Boy,
  // Drunken_Brass) have program-specific drawbar values.
  // Stage oracle: o:117-1..136-1 drawbar 1..9 (upper); same for lower (2nd register).
  const upper = readDrawbars(body, 143);
  const lower = readDrawbars(body, 158);

  // Pre-drawbar organ lead-in (body 124-125). CANDIDATE per Stage organ order:
  // o:113-1 KB zones [4b] | o:113-5 octave shift [4b] | o:114-1 susped [1b] |
  // o:114-2 organ model [3b] | o:114-5 preset [1b]. These bytes vary only for the
  // organ-edited presets; sub-fields not yet separable, so kept as raw region.
  const _leadIn = body.slice(124, 126);

  // Raw aux: the 67 body bytes in the organ region outside the drawbar blocks
  // (body 120-142 and 148-157 and 163-186 — everything in the organ area not
  // yet mapped). Sliced as one contiguous region for simplicity; will be split
  // into named fields as RE progresses.
  const _rawAux = body.slice(120, 187);

  return { upper, lower, _leadIn, _rawAux };
}

/**
 * Section/layer enable flags (body bytes 5-6). CANDIDATE per Stage master order:
 * m:084-5 organ section on/off, m:084-6 piano section on/off, m:095-3 organ
 * layer on/off. byte5 bit0 reads 0 exactly for the two organ-drawbar-edited
 * presets; byte6 bit7 (0x80) is set for all corpus presets but one. Both behave
 * like 1-bit on/off flags but lack a section-disabled fixture to confirm.
 */
function readSectionEnable(body: Uint8Array): Ne6SectionEnable {
  const byte5 = u8(body, 5);
  const byte6 = u8(body, 6);
  return {
    organEnableBit: byte5 & 0x1, // Stage m:084-5 / m:095-3 organ enable
    pianoEnableBit: (byte6 >>> 7) & 0x1, // Stage m:084-6 piano section on/off
    _raw: body.slice(5, 7),
  };
}

/**
 * Sample/piano section (body cluster C, bytes 38-50). CANDIDATE per Stage piano
 * order: a packed type/slot/variation header (p:244-3 piano type [3b] /
 * p:244-6 model slot [5b] / p:245-3 variation [2b]) at bytes 38-39, followed by
 * the 32-bit sample reference (p:245-5 piano model ID/name [32b]) at bytes 40-43.
 * The ID bytes are high-entropy and unique per preset; surfaced raw (no labeled
 * type/slot ground truth in the corpus to value-verify the packed sub-fields).
 */
function readSample(body: Uint8Array): Ne6Sample {
  return {
    _header: body.slice(38, 40), // Stage p:244-3 type / p:244-6 slot / p:245-3 variation
    modelId: body.slice(40, 44), // Stage p:245-5 piano model ID [32b]
    _raw: body.slice(38, 51),
  };
}

/** Decode a Nord Electro 6 program body (full file bytes including CBIN header). */
export function decodeNe6(bytes: Uint8Array): Ne6Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  return {
    parsed: true,
    version,
    organ: readOrgan(body),
    // Cross-model-mapped candidates (Stage oracle alignment, 2026-06-22)
    sectionEnable: readSectionEnable(body), // master section/layer enable bits
    sample: readSample(body),               // piano/sample section (cluster C)
    // Raw clusters still pending RE — named by their body byte range
    _clusterB: body.slice(20, 29),  // 9 bytes, up to 4 unique values
    _clusterD: body.slice(62, 76),  // 14 bytes
    _rawBody: body,
    bytes: bytes,
    warnings,
  };
}
