/**
 * Nord Stage 4 — supplementary parameter map (`NS4_EXTRA_PARAMS`).
 *
 * The generated `NS4_OFFSET_MAP` (offset-map.generated.ts, ported from
 * ns4decode) covers ~700 of the 824 body bytes — "many params but not all."
 * This file fills in fields that are CONFIRMED by a corpus hunt over the 357
 * local `.ns4p` programs (fixtures/stage-4), cross-checked against the official
 * Nord Stage 4 User Manual v1.2X (Edition K).
 *
 * INCLUSION BAR: a field appears here only when BOTH (a) its corpus value
 * distribution matches the hypothesised encoding AND (b) it correlates with
 * program names/features across the corpus, OR the manual + position make it
 * unambiguous. Everything weaker (n<10 toggles, high-entropy regions, fields
 * inside an always-inactive section) was left OUT and is documented as
 * candidate/structural in the hunt report — those need hardware differential
 * (export → move ONE knob → re-export → diff) to resolve.
 *
 * Same `Param` shape as NS4_OFFSET_MAP. Bit indices are absolute, 0-based,
 * MSB-first from file start (the 44-byte CBIN header is included), exactly like
 * bits.ts / offset-map.generated.ts. Do NOT add these to the generated file.
 *
 * ## Remaining undecoded tail (corpus retry, 2026-06-24 — verdict: BLOCKED)
 * The other varying-unmapped bytes were retried against the 357-program corpus and
 * stay out — they need a hardware differential (export → move ONE control → diff):
 *   - bytes 55-82: an OPTIONAL packed 4-byte-record region (129/357 all-zero; some
 *     patches repeat a record 3×, e.g. d7 c9 3a 6e) — modulation/routing structure,
 *     not scalar fields. Decodable as records only with hardware.
 *   - byte 106: NOT organ-gated (varies in organ-off patches too) → not a clean
 *     rotary param; reads as the tail of a wider mod field.
 *   - bytes 418/469/520 (synth Extern): Extern is active in 0/357 programs, so the
 *     field can't be exercised/named from this corpus at all.
 *   - byte 401 (bit 3204): a 1-bit flag set in only 4 files — too sparse to confirm.
 *   - bytes 300/355: saturated tails of the existing FX-delay value field.
 */

import type { Param } from './maps';

export const NS4_EXTRA_PARAMS: Param[] = [
  // --- byte 16 → program category (6-bit field, bits 130-135) ---
  // Bracketed by master 'location in bank'@114-119 and 'file version'@160-167.
  // Top 2 bits (128,129) are always 0 across all 357 programs → a 6-bit field.
  // Values 1-52, 19 distinct. CONFIRMED as the per-program sound CATEGORY by an
  // unambiguous corpus name-keyword correlation:
  //   Pad→46, Lead→6, Synth→45, Piano/Pno→9, Organ→7, String→(17/46/49).
  // Also clusters by factory bank: cover/user banks A-D are dominated by one
  // value (17), while sound-design banks F/G/H spread across 6/9/23/30/45/46.
  // The manual documents per-program Category (presets "browsed by Category",
  // Cat soft button) — Nord Stage 4 User Manual v1.2X p.40.
  { id: '017-3', name: 'program category', group: 'm', layers: [{ begBit: 130, endBit: 135 }] },

  // --- byte 238 → piano octave shift (3-bit field, bits 1904-1906) ---
  // Bracketed by piano 'volume change with ctrlped'@1892-1899 and piano
  // 'KB zones'@1936-1939. Bits 1907-1911 are constant 0 → a 3-bit field.
  // Exactly 5 distinct values centred on a default of 2:
  //   {0:73, 1:8, 2:248(default), 3:26, 4:2}.
  // A 5-value, default-centred (i.e. signed, -2..+2) piano-section field sitting
  // immediately before piano KB ZONE — the manual pairs OCTAVE SHIFT with KB
  // ZONE in every section (Nord Stage 4 User Manual v1.2X p.26 "OCTAVE SHIFT AND
  // KB ZONE"). Single occurrence (the per-param piano layer stride of 31 bits
  // would collide with 'KB zones'@1936), consistent with a piano section field.
  { id: '239-1', name: 'piano octave shift', group: 'p', layers: [{ begBit: 1904, endBit: 1906 }] },
];
