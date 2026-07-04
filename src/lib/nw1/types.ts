/**
 * Nord Wave (`.nwp`) program model.
 *
 * ## Architecture (corpus RE, 2026-06-22, 1018 fixtures × 350 bytes)
 *
 * The 306-byte body is **two parallel synth slots** at a fixed stride of +140,
 * NOT the old A/B/C clusters. Evidence:
 *   - per-byte unique-count signatures match 57/76 between [0..75] and [140..215]
 *   - on average 63.7/76 bytes are byte-identical slot1==slot2 per file
 *   - 199/1018 files have the two slots exactly identical; 445/1018 match ≥70/76
 *   - enum positions line up: body[0]↔body[140] (osc select),
 *     body[45]↔body[185] (enum 0-7), body[39]↔body[179] (even-only stepped)
 *
 * | Region        | body range | size | status    |
 * |---------------|-----------|------|-----------|
 * | Slot 1 voice  | 0-115     | 116b | candidate |
 * | (zero pad)    | 116-139   | 24b  | constant  |
 * | Slot 2 voice  | 140-255   | 116b | confirmed (mirror of slot 1) |
 * | (zero pad)    | 256-279   | 24b  | constant  |
 * | Global / tail | 280-289   | 10b  | candidate |
 * | (zero pad)    | 290-302   | 13b  | constant  |
 * | byte[303]     | 303       | 1b   | unknown (near-const 0) |
 * | checksum      | 304-305   | 2b   | confirmed (LE CRC-16/CCITT-FALSE over file[0:-2], 1018/1018) |
 *
 * CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (raw 6/7/8).
 *
 * Source: 1018-file corpus statistical analysis (2026-06-22).
 */

/**
 * One Nord Wave synth slot (116 bytes, bit-packed VA/wavetable voice).
 *
 * Individual ADSR/cutoff/LFO fields straddle byte boundaries and cannot be
 * pinned from corpus stats alone; only the small enum/stepped selectors below
 * are byte-aligned. The remaining packed voice bytes are exposed as `_raw`.
 */
export interface Nw1Slot {
  /** body[+0]: oscillator/waveform category select. uint8 enum 0-8 (mode 4). */
  readonly oscSelect: number;
  /** body[+39]: stepped selector, even values only {0,2,4,6,8,10} (6 positions ×2). */
  readonly steppedParam: number;
  /** body[+45]: enum 0-7 (mode 7), likely osc-config / filter-type. */
  readonly enumParam: number;
  /** Full 116-byte bit-packed voice block (osc/filter/env/LFO). */
  readonly _raw: Uint8Array;
}

/**
 * Shared (non-per-slot) global block: body[280-289] (10 bytes, bit-packed).
 * Master level / split / FX (reverb/delay/chorus) / arp.
 */
export interface Nw1Global {
  /** body[280] low nibble: mode / octave-shift enum (0-15). */
  readonly mode: number;
  /** body[289]: packed 2-bit flag pair {0,64,128,192} (e.g. arp on/off + FX on/off). */
  readonly flags: number;
  /** Full 10-byte tail block. */
  readonly _raw: Uint8Array;
}

export interface Nw1Program {
  readonly parsed: true;
  readonly version: string;
  /** Slot 1 voice: body[0-115]. */
  readonly slot1: Nw1Slot;
  /** Slot 2 voice: body[140-255] (confirmed parallel mirror of slot 1). */
  readonly slot2: Nw1Slot;
  /** Global / FX / master tail: body[280-289]. */
  readonly global: Nw1Global;
  /**
   * body[304-305]: LE CRC-16/CCITT-FALSE over the whole file except the final
   * 2 bytes (clavia/crc16.ts). Confirmed 1018/1018 corpus files 2026-07-04.
   */
  readonly checksum: number;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
