/**
 * Nord Lead 4 program model.
 *
 * Two file variants share this type, discriminated by `fileType`:
 *
 * `nl4s` (Sound, 343 bytes) — single voice / sound slot. Body = file[44:] (299 bytes).
 *   Bit-packed parameter regions separated by all-zero reserved gaps:
 *   - Header / global   body[0-24]    (cluster A) — gap body[25-29]=0
 *   - Voice/FX params   body[30-246]  — 2 osc, filter, 2 env, 2 LFO, FX, arp
 *   - Morph/assign      body[248-288] — gap body[247]=0, pad body[289-296]=0
 *   - Checksum          body[297-298] (LE CRC-16/CCITT-FALSE trailer, confirmed)
 *   The regions are bit-packed, not byte-per-parameter; only a few byte-aligned
 *   selectors are recoverable from corpus statistics.
 *
 * `nl4p` (Program, 1295 bytes) — multi-slot structure (315-byte stride):
 *   - 4 slot groups: body[0-295], [304-610], [619-925], [934-1240]
 *   - Constant-zero gaps between slots; LE CRC-16/CCITT-FALSE trailer at body[1249-1250]
 *
 * Source: corpus RE 2026-06-22 (101 nl4s + 26 nl4p); re-censused 2026-07-04
 * over 1275 nl4s + 494 nl4p (factory sound banks 1-3, performance banks A/B and
 * 9 artist banks). The larger corpus falsified the earlier "cluster B 30-102 /
 * cluster C 238-264 with zero gap 103-237" split — the JD73-heavy corpus simply
 * never varied those bytes.
 */

/**
 * nl4s voice/FX param run (body[30-246]). Bit-packed; only the head selector
 * at body[30] is byte-aligned and statistically separable. The packed region
 * holds 2 oscillators, the filter, the amp + mod ADSR envelopes, the two LFOs
 * and the FX/arp params — per-field offsets need differential RE, so the body
 * is passed through raw until then.
 */
export interface Nl4Voice {
  /**
   * Head selector — values 0-10 observed across 1275 files (body[30]); at
   * least a 4-bit selector at the start of the voice block. Exact mapping
   * unverified. (The earlier 101-file corpus mis-read this as a 2-bit enum.)
   */
  readonly mode: number;
  /** Bit-packed params body[31-246] (osc/filter/env/LFO/FX; offsets unmapped). */
  readonly _packed: Uint8Array;
}

/**
 * nl4s byte-aligned islands in the packed run + the morph/assign block
 * (body[248-288]). The boolean enable and enum A are byte-aligned and
 * separable; the rest is sub-byte and passed through raw.
 */
export interface Nl4FxArp {
  /** Enable flag — 0/1 boolean (body[239]); confirmed binary at 1275 files. */
  readonly enabled: boolean;
  /** Enum A — 0-7, all 8 values observed (body[245]). Unverified label. */
  readonly modeA: number;
  /**
   * Stepped value B — 0-20 observed (body[248]); a knob or wide enum, not the
   * 0-8 enum the smaller corpus suggested. Unverified label.
   */
  readonly modeB: number;
  /** Bit-packed morph/assign block body[248-288]. */
  readonly _packed: Uint8Array;
}

export interface Nl4Program {
  readonly parsed: true;
  readonly fileType: 'nl4s' | 'nl4p';
  readonly version: string;
  /**
   * File trailer checksum — LE CRC-16/CCITT-FALSE over file[0:-2] (clavia/crc16.ts;
   * nl4s body[297-298], nl4p
   * body[1249-1250]). Confirmed.
   */
  readonly checksum?: number;
  /** nl4s: header / global param block body[0-24] (bit-packed, raw). */
  readonly _clusterA?: Uint8Array;
  /** nl4s: voice/FX param run (body[30-246]). */
  readonly voice?: Nl4Voice;
  /** nl4s: byte-aligned islands + morph/assign block (body[248-288]). */
  readonly fxArp?: Nl4FxArp;
  /** nl4p: slot 0 params body[0-295] */
  readonly _slot0?: Uint8Array;
  /** nl4p: slot 1 params body[304-610] */
  readonly _slot1?: Uint8Array;
  /** nl4p: slot 2 params body[619-925] */
  readonly _slot2?: Uint8Array;
  /** nl4p: slot 3 params body[934-1240] */
  readonly _slot3?: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
