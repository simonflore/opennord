/**
 * Reader for **legacy (formatType 0) CBIN records** — the Lead 4 (`.nl4s` /
 * `.nl4p`), Lead A1 (`.nlas` / `.nlap`), Electro 4 (`.ne4p`) and Stage 2 / 2 EX
 * (`.ns2p`) program files. The Stage 2 record is the same descriptor-container
 * bitstream; NSM also writes it behind the NSM-era header, where the data
 * starts at file 0x2E and the file has no trailer (`legacyData`'s
 * `dataOffset` / `trailerBytes`).
 *
 * These are not registry block chains (block-chain.ts). The firmware writes a
 * u16 record version and then the record data; NSM stores the version at file
 * 0x14 (the CBIN version field) and the data at **file 0x1A**, followed by a
 * 2-byte trailer (the LE CRC-16 of crc16.ts on the Lead files; unverified on
 * the Electro 4). File 0x16–0x19 is still unidentified. The data is one
 * MSB-first bitstream of descriptor-table parameters, stored raw (descriptor
 * minimum 0); the Lead A1's inline morph deltas are two's complement (medium).
 *
 * Sources: Lead 4 OS 1.32 serialiser → and record
 * sizes (26 + 315 + 2 = 343 = `.nl4s`); Lead A1 OS 1.36
 * (26 + 95 + 2 = 123 = `.nlas`); Electro 4 OS 1.22 serialiser
 * (26 + 108 + 2 = 136 = `.ne4p`). Per-model layouts are generated
 * by the maintainers’ tools (`<model>/layout.generated.ts`).
 * Pure; model → clavia.
 */
import { readBits } from './bitstream';
import { fieldValue, type FwEncoding } from './block-chain';

/** File offset where legacy formatType-0 record data begins. */
export const LEGACY_DATA_OFFSET = 0x1a;

/** One descriptor parameter. `bit` is relative to the start of its record. */
export interface LegacyField<K extends string = string> {
  readonly key: K;
  /** The descriptor's label (a manual name where the CC matched, else "param N"). */
  readonly name: string;
  /** Descriptor index within its parameter set (what the Lead 4 morph lists refer to). */
  readonly id: number;
  readonly bit: number;
  readonly width: number;
  readonly min: number;
  readonly max: number;
  readonly def: number;
  readonly enc: FwEncoding;
  readonly confidence: 'high' | 'medium';
  /** Firmware citation. */
  readonly src: string;
  /** The descriptor's control id (a MIDI CC on the Lead models). */
  readonly cc?: number;
  /** For a Lead A1 inline morph delta: the key of the parameter it modulates. */
  readonly deltaOf?: K;
}

/** A Lead 4 sparse morph list: a count, then fixed {parameter index, source, signed delta} entries. */
export interface LegacyMorphList {
  /** Which parameter set the entries index (the key prefix, e.g. `slot` or `fx`). */
  readonly set: string;
  readonly countBit: number;
  readonly countWidth: number;
  readonly maxEntries: number;
  readonly entryBit: number;
  readonly paramBits: number;
  readonly sourceBits: number;
  readonly deltaBits: number;
}

export interface LegacyLayout<K extends string = string> {
  readonly model: string;
  /** Firmware descriptor tables the layout comes from. */
  readonly source: string;
  /** Firmware serialiser / record-size functions. */
  readonly container: string;
  /** The u16 record version the firmware writes, or null when not recovered. */
  readonly recordVersion: number | null;
  /** Bytes of record data. */
  readonly dataBytes: number;
  readonly fields: readonly LegacyField<K>[];
  readonly morphLists?: readonly LegacyMorphList[];
}

/** One used morph-list entry. */
export interface LegacyMorphEntry {
  /** Descriptor index within the list's parameter set. */
  readonly param: number;
  /** Morph source index. */
  readonly source: number;
  /** Signed delta. */
  readonly delta: number;
}

/**
 * The record data of a legacy file: file 0x1A up to the 2-byte trailer.
 * `dataOffset` and `trailerBytes` cover the other framing: a Stage 2 record
 * behind the NSM-era header starts at 0x2E and runs to the end of the file
 * (565-byte `.ns2p`, no trailer).
 */
export function legacyData(bytes: Uint8Array, dataOffset: number = LEGACY_DATA_OFFSET, trailerBytes = 2): Uint8Array {
  return bytes.slice(dataOffset, Math.max(dataOffset, bytes.length - trailerBytes));
}

/** The u16 LE record version at file 0x14. */
export function legacyRecordVersion(bytes: Uint8Array): number {
  return (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
}

export interface LegacyRecordRead<K extends string> {
  /** Decoded values by key. */
  values: Partial<Record<K, number>>;
  /** Keys whose value falls outside the descriptor range (the firmware resets these to default on load). */
  outOfRange: K[];
}

/** Read every field of `layout` from the record starting at data byte `byteOffset`. Never throws. */
export function readLegacyRecord<K extends string>(
  data: Uint8Array, layout: LegacyLayout<K>, byteOffset = 0,
): LegacyRecordRead<K> {
  const values: Partial<Record<K, number>> = {};
  const outOfRange: K[] = [];
  for (const f of layout.fields) {
    const v = fieldValue(readBits(data, byteOffset * 8 + f.bit, f.width), f);
    if (v < f.min || v > f.max) outOfRange.push(f.key);
    values[f.key] = v;
  }
  return { values, outOfRange };
}

/** The used entries of a sparse morph list (unused entries are zero and ignored). */
export function readMorphList(data: Uint8Array, list: LegacyMorphList, byteOffset = 0): LegacyMorphEntry[] {
  const base = byteOffset * 8;
  const count = Math.min(readBits(data, base + list.countBit, list.countWidth), list.maxEntries);
  const size = list.paramBits + list.sourceBits + list.deltaBits;
  const out: LegacyMorphEntry[] = [];
  for (let i = 0; i < count; i++) {
    const at = base + list.entryBit + i * size;
    out.push({
      param: readBits(data, at, list.paramBits),
      source: readBits(data, at + list.paramBits, list.sourceBits),
      delta: fieldValue(readBits(data, at + list.paramBits + list.sourceBits, list.deltaBits),
        { enc: 'twos', width: list.deltaBits, min: 0 }),
    });
  }
  return out;
}
