/**
 * Nord Lead A1 Sound (`.nlas`) program model.
 *
 * Legacy (formatType 0) CBIN record: u16 record version at file 0x14 (= 7),
 * record data from **file 0x1A** (95 bytes), then the LE CRC-16/CCITT-FALSE
 * trailer (clavia/crc16.ts): 26 + 95 + 2 = 123 bytes. Layout from the Lead A1
 * OS 1.36 parameter descriptors (slot set of 47 at c02a5fc0, FX set of 18 at
 * c02a6a78), generated into `layout.generated.ts`: MSB-first, values stored raw.
 * Morphs are inline: each morphable parameter is preceded by one delta per
 * morph source in its mask (2 sources), each one bit wider than the parameter
 * and two's complement (medium).
 *
 * Parameters are known by descriptor index and CC only ("param 14 (CC 33)" →
 * key `slot.param14`): the A1 CC chart differs from the Lead 4's, so Lead 4
 * names don't carry over. The whole A1 alignment is medium until a corpus
 * check confirms the reserved bits sit where the layout puts them.
 *
 * The earlier corpus reader read from file 0x2C (data byte 18): its "header
 * nibble" was parameters 12 (1 bit) + 13 (3 bits), and its "layerOn + volume"
 * was parameter 14 (CC 33, 7 bits, max 102) at data bits 148-154 plus the top
 * bit of parameter 15. Those readings are dropped.
 */
import type { NlaFieldKey, NlaPerfFieldKey } from './layout.generated';

export type { NlaFieldKey, NlaPerfFieldKey };

export interface NlaProgram {
  readonly parsed: true;
  /** CBIN version string — the u16 record version at 0x14 (7 → "0.07"). */
  readonly version: string;
  /** u16 record version at file 0x14 (Program 7). */
  readonly recordVersion: number;
  /** Slot and FX parameters, inline morph deltas included, by generated key. */
  readonly values: Partial<Record<NlaFieldKey, number>>;
  /** Inline morph deltas grouped under the parameter they modulate: key → one delta per source. */
  readonly morphDeltas: Partial<Record<NlaFieldKey, readonly number[]>>;
  /**
   * `.nlap` only: performance-common parameters (c02a58c0). For a performance,
   * `values` / `morphDeltas` are slot A, read at data byte 19 (after the 7
   * common bytes and 12 bytes not yet named; slots B-D are not read yet).
   */
  readonly performance?: Partial<Record<NlaPerfFieldKey, number>>;
  /** Parameters outside their descriptor range (the firmware resets these to default on load). */
  readonly outOfRange: readonly NlaFieldKey[];
  /**
   * File trailer checksum (last two bytes, little-endian): CRC-16/CCITT-FALSE
   * over the whole file except those bytes. Confirmed on every legacy-header
   * corpus file 2026-07-04. An NSM-era file (141 bytes) has no trailer — its
   * CRC-32 sits in the header (clavia/checksum.ts) — so this is meaningless there.
   */
  readonly checksum: number;
  /** Record data (file 0x1A up to the CRC trailer; 0x2E to EOF behind an NSM-era header). */
  readonly _data: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
