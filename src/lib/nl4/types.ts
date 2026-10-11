/**
 * Nord Lead 4 program model.
 *
 * Both file variants are legacy (formatType 0) CBIN records: the u16 record
 * version sits at file 0x14 and the record data starts at **file 0x1A**, then a
 * 2-byte LE CRC-16 trailer (clavia/legacy-record.ts). Layout from the Lead 4
 * OS 1.32 parameter descriptors (serialiser →),
 * generated into `layout.generated.ts`; values are stored raw (minimum 0):
 *
 * `nl4s` (Program/"Sound", 343 bytes) — record version 8, 315 data bytes:
 *   bits 0-387     slot set: 78 descriptors, ending in a 44-bit
 *                  reserved field
 *   bits 388-2047  morph list: 7-bit count + 87 × {param 7b, source 4b, delta 8b}
 *   bits 2048-2130 FX/delay set: 15 descriptors
 *   bits 2131-2519 FX morph list: 5-bit count + 24 × {param 4b, source 4b, delta 8b}
 *
 * `nl4p` (Performance, 1295 bytes) — record version 9: 7 bytes of
 *   performance-common settings, then 4 × 315-byte program records
 *   at data offset 7 + 315k (file 0x21 + 315k).
 *
 * Field names come from matching each descriptor's MIDI CC to
 * `parameters.reference.ts`; descriptors without a CC are "param N".
 *
 * The earlier corpus reader read the body from file 0x2C, i.e. 18 bytes late
 * (old body[k] = data[k + 18]): its "head selector" (body[30]) was the top bits
 * of the morph count, "enable" (body[239]) the top bit of Delay/Reverb Amount,
 * "enum A" (body[245]) the high bits of the 14-bit Delay Tempo and "B"
 * (body[248]) the FX morph count. Those readings are dropped.
 */
import type { LegacyMorphEntry } from '../clavia/legacy-record';
import type { Nl4FieldKey, Nl4PerfFieldKey } from './layout.generated';

export type { Nl4FieldKey, Nl4PerfFieldKey };

/**
 * One used morph-list entry: descriptor index within its set, morph source
 * 0-8 (the 9 sources hard-coded in; names unresolved), signed
 * 8-bit delta.
 */
export interface Nl4MorphEntry extends LegacyMorphEntry {
  /** The field that index names, when it is a stored parameter. */
  readonly key?: Nl4FieldKey;
}

/** One 315-byte program record: the whole `.nl4s` data, or one `.nl4p` slot. */
export interface Nl4Record {
  /** Slot-set and FX-set parameters by generated key. */
  readonly values: Partial<Record<Nl4FieldKey, number>>;
  /** Slot-set morph assignments (count from bits 388-394). */
  readonly morphs: readonly Nl4MorphEntry[];
  /** FX-set morph assignments (count from bits 2131-2135). */
  readonly fxMorphs: readonly Nl4MorphEntry[];
  /** Parameters above their descriptor max (the firmware resets these to default on load). */
  readonly outOfRange: readonly Nl4FieldKey[];
  /** The 315 raw record bytes. */
  readonly _raw: Uint8Array;
}

export interface Nl4Program {
  readonly parsed: true;
  readonly fileType: 'nl4s' | 'nl4p';
  /** CBIN version string — for these files the u16 at 0x14 is the record version (8 / 9 → "0.08" / "0.09"). */
  readonly version: string;
  /** u16 record version at file 0x14: Program 8, Performance 9. */
  readonly recordVersion: number;
  /**
   * File trailer checksum — LE CRC-16/CCITT-FALSE over file[0:-2]
   * (clavia/crc16.ts). Confirmed 1275/1275 nl4s, 494/494 nl4p.
   */
  readonly checksum: number;
  /** nl4s: the program record. */
  readonly program?: Nl4Record;
  /** nl4p: performance-common parameters (slot focus, slot-enable mask, tempo, hold …). */
  readonly performance?: Partial<Record<Nl4PerfFieldKey, number>>;
  /** nl4p: the four slot records A-D. */
  readonly slots?: readonly [Nl4Record, Nl4Record, Nl4Record, Nl4Record];
  /** Record data (file 0x1A up to the CRC trailer). */
  readonly _data: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
