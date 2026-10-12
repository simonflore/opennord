/**
 * Older program records, converted the way the instrument converts them.
 *
 * Each Nord firmware reads its current record version natively and runs a chain
 * of small converters over an older record when it loads it (one step per
 * version: move a field, remap a value, rescale a curve). OpenNord's readers
 * apply the same steps, reimplemented from the instrument’s behaviour (no firmware
 * code; tables only as the exceptions docs/LEGAL.md records), so an older file
 * shows the settings the instrument would play. The writers never write a
 * converted record (clavia/layout-write.ts refuses any version but the native one).
 *
 * A converter edits the record data in place — the bytes after the record
 * version, as the layout's field bits count them — and returns musician-facing
 * notes for anything it could not reproduce exactly. {@link recordEditor} reads
 * and writes fields by key (with the layout's encodings) and raw bits (for
 * positions an older version used and the current layout no longer names).
 * Pure; model → clavia.
 */
import { readBits, writeBits } from './bitstream';
import { fieldValue, type FwEncoding } from './block-chain';

/** Converts record `data` (in place) from `fromVersion` to the layout's version; returns notes for the reader. */
export type RecordConverter = (data: Uint8Array, fromVersion: number) => string[];

interface EditableField<K extends string> {
  readonly key: K;
  readonly bit: number;
  readonly width: number;
  readonly min: number;
  readonly enc: FwEncoding;
}

/** Field and bit access to one record's data (bits relative to the data start). */
export interface RecordEditor<K extends string> {
  /** A field's value, decoded with its encoding. */
  get(key: K): number;
  /** Store `value` in a field: encoded, then cut to the field width as the firmware's bit writer does. */
  set(key: K, value: number): void;
  /** `width` raw bits at data bit `at`, unsigned. */
  bits(at: number, width: number): number;
  /** `width` raw bits at data bit `at`, two's complement. */
  signedBits(at: number, width: number): number;
  /** Write the low `width` bits of `value` (two's complement for a negative) at data bit `at`. */
  setBits(at: number, width: number, value: number): void;
}

/** The low `width` bits of an integer, negatives in two's complement. */
function wrapBits(value: number, width: number): number {
  const m = 2 ** width;
  return ((value % m) + m) % m;
}

/** An editor over record `data` for a layout's fields. */
export function recordEditor<K extends string>(
  data: Uint8Array, layout: { readonly fields: readonly EditableField<K>[] },
): RecordEditor<K> {
  const byKey = new Map<string, EditableField<K>>(layout.fields.map((f) => [f.key, f]));
  const field = (key: K) => {
    const f = byKey.get(key);
    if (!f) throw new Error(`record converter: no field ${key}`);
    return f;
  };
  const bits = (at: number, width: number) => readBits(data, at, width);
  return {
    get: (key) => { const f = field(key); return fieldValue(bits(f.bit, f.width), f); },
    set: (key, value) => {
      const f = field(key);
      writeBits(data, f.bit, f.width, wrapBits(f.enc === 'offset' ? value - f.min : value, f.width));
    },
    bits,
    signedBits: (at, width) => fieldValue(bits(at, width), { enc: 'twos', width, min: 0 }),
    setBits: (at, width, value) => writeBits(data, at, width, wrapBits(value, width)),
  };
}
