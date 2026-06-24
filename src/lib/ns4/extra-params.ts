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

// The corpus hunt produced no correctly-identified NEW params — both initial
// "finds" turned out to be already-decoded fields (kept here as a record so they
// aren't re-hunted). The supplementary map is intentionally EMPTY for now; real
// finds (ideally hardware-differential-confirmed) get appended here, and
// buildParamMap() composes them with the generated port automatically.
export const NS4_EXTRA_PARAMS: Param[] = [
  // REJECTED — byte 16 'program category': it's the CBIN *header* category byte
  // (file offset 0x10), already decoded by clavia/cbin.ts (programCategoryName +
  // categories table) and outside the body param map. A rediscovery, not new.
  //
  // REJECTED — byte 238 (bits 1904-1906) as 'piano octave shift': octave shift is
  // ALREADY mapped per-layer in offset-map.generated.ts (organ 113-5, piano 243-5
  // @1940/2036, synth 414-7 — all 7 layers). The real piano octave shift @1940 is
  // a signed 4-bit field centered on 0 ({0,±1,−2}); byte 238 is a DIFFERENT 3-bit
  // field centered on 2 ({0,1,2,3,4}, default 2) that matches octave shift in only
  // 65/357 files. It's a real, varying, still-UNIDENTIFIED piano field — left out
  // until it can be correctly named (needs hardware differential).
];
