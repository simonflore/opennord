/**
 * Nord Wave (`.nwp`) program model.
 *
 * Legacy (formatType 0) CBIN record at file 0x18: a **u8** record version (8;
 * the firmware converts 6 and 7 on load, FUN_3000090E), then 321 bytes of
 * MSB-first descriptor data from **file 0x19**, 2 pad bytes, and the LE
 * CRC-16/CCITT-FALSE trailer over the whole file (clavia/crc16.ts; 1018/1018
 * corpus files): 24 + 1 + 321 + 2 + 2 = 350 bytes. Layout from the Wave OS
 * 2.14 parameter containers (record write FUN_300056A4, read FUN_30005906),
 * generated into `layout.generated.ts`:
 *
 * | Data bits | File          | Block                                          |
 * |-----------|---------------|------------------------------------------------|
 * | 0–155     | 0x19–0x2C     | global (12 descriptors, 8 stored values)       |
 * | 156–1275  | 0x2C–0xB8     | slot A (63 descriptors, 56 values) = 140 bytes |
 * | 1276–2395 | 0xB8–0x144    | slot B (the same 63) = 140 bytes               |
 * | 2396–2567 | 0x144–0x159   | common (14 descriptors, 10 values)             |
 *
 * A morphable parameter is preceded by one signed 8-bit delta per morph source
 * (sources 0, 5 and 6 of the mask 0x61, in that order), one bit wider than the
 * value; 26 per slot and one in common. Deltas are read as two's complement
 * (medium). Parameters are known by descriptor index and control id (probably
 * the MIDI CC) only.
 *
 * The earlier corpus reader read from file 0x2C ("body") and found the slot
 * stride of +140 that this layout explains; its byte-aligned "selectors" were
 * fragments of real parameters (e.g. `oscSelect` = 2 · slot A parameter 0 +
 * the top bit of parameter 1). The alignment (record at 0x18, not slot A at
 * 0x2C) is medium until the corpus test in decode.test.ts runs: under it no
 * stored value exceeds its descriptor range.
 */
import type { Nw1FieldKey } from './layout.generated';

export type { Nw1FieldKey };

/** One block of the record: its stored values by descriptor index, and the morph deltas of its morphable ones. */
export interface Nw1Section {
  /** Stored values by descriptor index (reserved descriptors are absent: undefined). */
  readonly params: readonly (number | undefined)[];
  /** Morph deltas by descriptor index: one per source, in source order 0, 5, 6. */
  readonly morphs: Readonly<Record<number, readonly number[]>>;
}

/** A synth slot (A or B): 56 stored parameters, 26 of them morphable. */
export type Nw1Slot = Nw1Section;
/** The global block: 8 stored parameters. */
export type Nw1Global = Nw1Section;

export interface Nw1Program {
  readonly parsed: true;
  /** CBIN version string — NSM's copy of the record version at 0x14 (8 → "0.08"). */
  readonly version: string;
  /** u8 record version at file 0x18 (8; 6 and 7 are converted by the firmware). */
  readonly recordVersion: number;
  readonly global: Nw1Global;
  /** Slot A. */
  readonly slot1: Nw1Slot;
  /** Slot B. */
  readonly slot2: Nw1Slot;
  readonly common: Nw1Section;
  /** Every stored value, morph deltas included, by generated key. */
  readonly values: Partial<Record<Nw1FieldKey, number>>;
  /** Morph deltas grouped under the parameter they modulate: key → one delta per source. */
  readonly morphDeltas: Partial<Record<Nw1FieldKey, readonly number[]>>;
  /** Parameters outside their descriptor range (the firmware resets these to default on load). */
  readonly outOfRange: readonly Nw1FieldKey[];
  /** True when the file holds the whole record. */
  readonly complete: boolean;
  /** The last two bytes (LE): CRC-16/CCITT-FALSE over the rest of the file. */
  readonly checksum: number;
  /** Record data: file 0x19 up to the trailer (321 bytes + 2 pad bytes). */
  readonly _data: Uint8Array;
  readonly warnings: readonly string[];
  /** Original file bytes. */
  bytes: Uint8Array;
  /** Program name — not stored in the file, injected from the filename on import. */
  name?: string;
}
