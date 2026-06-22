/**
 * Nord Lead 4 program model.
 *
 * Two file variants share this type, discriminated by `fileType`:
 *
 * `nl4s` (Sound, 343 bytes) — single voice / sound slot. Body = file[44:] (299 bytes).
 *   Three populated, bit-packed clusters separated by all-zero reserved gaps:
 *   - Header / global   body[0-24]    (cluster A)
 *   - Main synth voice  body[30-102]  (cluster B) — 2 osc, filter, 2 env, 2 LFO
 *   - FX / arp / morph  body[238-264] (cluster C)
 *   - Checksum          body[297-298] (CBIN whole-file LE u16 trailer, confirmed)
 *   The clusters are bit-packed, not byte-per-parameter; only a few byte-aligned
 *   selectors at section boundaries are recoverable from corpus statistics.
 *
 * `nl4p` (Program, 1295 bytes) — multi-slot structure (~315-byte repeating period):
 *   - 4 slot groups at body[0], [304], [619], [934]
 *   - Each group has a main varying block + large zero padding (~160-170 bytes)
 *
 * Source: corpus RE 2026-06-22 (101 nl4s + 26 nl4p fixtures).
 */

/**
 * nl4s synth voice block (cluster B, body[30-102]). Bit-packed; only the head
 * selector at body[30] is byte-aligned and statistically separable. The packed
 * region holds 2 oscillators, the filter, the amp + mod ADSR envelopes and the
 * two LFOs — per-field offsets need differential RE, so the body is passed
 * through raw until then.
 */
export interface Nl4Voice {
  /**
   * Head selector — 2-bit enum (0-3, body[30]). Top-level osc / voice-mode
   * selector at the start of the voice block. Exact mapping unverified.
   */
  readonly mode: number;
  /** Bit-packed voice body body[31-102] (osc/filter/env/LFO; offsets unmapped). */
  readonly _packed: Uint8Array;
}

/**
 * nl4s FX / arp / morph block (cluster C, body[238-264]). Bit-packed; the
 * boolean enable + two small enums are byte-aligned and separable, the rest
 * (effect amounts, arp rate, morph/assign) is sub-byte and passed through raw.
 */
export interface Nl4FxArp {
  /** Section enable — 0/1 boolean (body[239]); arp/section on-off (likely arp). */
  readonly enabled: boolean;
  /** Enum A — 0-7 (body[245]); LFO/arp mode or sync division. Unverified label. */
  readonly modeA: number;
  /** Enum B — 0-8 (body[248]); FX/filter type or destination. Unverified label. */
  readonly modeB: number;
  /** Bit-packed cluster-C body body[238-264] (effect amounts/arp/morph). */
  readonly _packed: Uint8Array;
}

export interface Nl4Program {
  readonly parsed: true;
  readonly fileType: 'nl4s' | 'nl4p';
  readonly version: string;
  /** nl4s: CBIN whole-file checksum (LE u16 trailer, body[297-298]). Confirmed. */
  readonly checksum?: number;
  /** nl4s: header / global param block body[0-24] (bit-packed, raw). */
  readonly _clusterA?: Uint8Array;
  /** nl4s: main synth voice (cluster B, body[30-102]). */
  readonly voice?: Nl4Voice;
  /** nl4s: FX / arp / morph (cluster C, body[238-264]). */
  readonly fxArp?: Nl4FxArp;
  /** nl4p: slot 0 params body[0-76] */
  readonly _slot0?: Uint8Array;
  /** nl4p: slot 1 params body[245-398] */
  readonly _slot1?: Uint8Array;
  /** nl4p: slot 2 params body[560-705] */
  readonly _slot2?: Uint8Array;
  /** nl4p: slot 3 params body[875-1014] */
  readonly _slot3?: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
