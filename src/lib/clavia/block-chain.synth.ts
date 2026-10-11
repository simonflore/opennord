/**
 * Synthetic program builder for the firmware-layout readers — builds whole new
 * files from a layout, for tests and dev tooling only. (Editing a real file goes
 * through layout-write.ts, which changes only the fields asked for and keeps
 * every other bit.) Builds a body the way the firmware serialiser lays it out:
 * u32 BE version, then each block's length byte and its MSB-first fields,
 * reserved bits zero; or a legacy record's bitstream at file 0x1A. Pure.
 */
import { buildCbinHeader } from './cbin';
import { sealTrailerChecksum } from './crc16';
import { writeBits } from './bitstream';
import { fieldRaw, type FwLayout } from './block-chain';
import { LEGACY_DATA_OFFSET, LEGACY_RECORD_OFFSET, NSM_RECORD_OFFSET, type LegacyLayout } from './legacy-record';

// The encode primitives live in production code; re-exported for the tests that import them from here.
export { writeBits, fieldRaw };

/** Absolute body bit of a layout field: its block's first payload bit plus its own bit. */
export function fieldBit<K extends string>(layout: FwLayout<K>, key: K): number {
  const f = layout.fields.find((x) => x.key === key);
  if (!f) throw new Error(`no field ${key} in the ${layout.model} layout`);
  return (layout.blocks[f.block].offset + 1) * 8 + f.bit;
}

/** A body for `layout` with every field at its firmware default, overridden by `values`. */
export function synthFwBody<K extends string>(
  layout: FwLayout<K>, values: Partial<Record<K, number>> = {}, formatVersion = layout.versionRange?.[0] ?? 100,
): Uint8Array {
  const body = new Uint8Array(layout.bodyBytes);
  writeBits(body, 0, 32, formatVersion);
  for (const b of layout.blocks) body[b.offset] = b.length;
  for (const f of layout.fields) {
    const v = values[f.key] ?? f.def;
    writeBits(body, (layout.blocks[f.block].offset + 1) * 8 + f.bit, f.width, fieldRaw(v, f));
  }
  return body;
}

/** A whole file: the NSM-era CBIN header for `tag` followed by `body`. */
export function synthFwFile(tag: string, body: Uint8Array, versionRaw = 100): Uint8Array {
  const header = buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw });
  const out = new Uint8Array(header.length + body.length);
  out.set(header);
  out.set(body, header.length);
  return out;
}

/** Write `layout`'s fields at their descriptor defaults, overridden by `values`, into a legacy record at data byte `byteOffset`. */
export function writeLegacyRecord<K extends string>(
  data: Uint8Array, layout: LegacyLayout<K>, values: Partial<Record<K, number>> = {}, byteOffset = 0,
): void {
  for (const f of layout.fields) {
    // A repeated container (`copyOf`) is the same container written twice: it repeats the first copy's value.
    const v = values[f.key] ?? (f.copyOf !== undefined ? values[f.copyOf] : undefined) ?? f.def;
    writeBits(data, byteOffset * 8 + f.bit, f.width, fieldRaw(v, f));
  }
}

/** A legacy formatType-0 file: CBIN magic, `tag`, the u16 record version at 0x14, `data` from 0x1A, a sealed CRC-16 trailer. */
export function synthLegacyFile(tag: string, recordVersion: number, data: Uint8Array): Uint8Array {
  const header = buildCbinHeader({ formatType: 0, tag, bank: 0, location: 0, category: 0, versionRaw: recordVersion });
  const out = new Uint8Array(LEGACY_DATA_OFFSET + data.length + 2);
  out.set(header.subarray(0, LEGACY_DATA_OFFSET));
  out.set(data, LEGACY_DATA_OFFSET);
  return sealTrailerChecksum(out);
}

/**
 * A whole program file for a legacy `layout`, laid out as the firmware stores it:
 * the CBIN header (legacy formatType 0 by default, NSM-era with `nsmHeader`), the
 * record version (big-endian, `layout.versionBytes` wide) at the record offset,
 * every field at its descriptor default overridden by `values`, the padding, and
 * for a legacy header a sealed CRC-16 trailer.
 */
export function synthLegacyLayoutFile<K extends string>(
  tag: string, layout: LegacyLayout<K>, values: Partial<Record<K, number>> = {},
  opts: { version?: number; nsmHeader?: boolean } = {},
): Uint8Array {
  const version = opts.version ?? layout.recordVersion ?? 0;
  const header = buildCbinHeader({ formatType: opts.nsmHeader ? 1 : 0, tag, bank: 0, location: 0, category: 0, versionRaw: version });
  const start = opts.nsmHeader ? NSM_RECORD_OFFSET : LEGACY_RECORD_OFFSET;
  const vb = layout.versionBytes ?? 2;
  const out = new Uint8Array(start + vb + layout.dataBytes + (layout.padBytes ?? 0) + (opts.nsmHeader ? 0 : 2));
  out.set(header.subarray(0, start));
  writeBits(out, start * 8, vb * 8, version);
  const data = new Uint8Array(layout.dataBytes);
  writeLegacyRecord(data, layout, values);
  out.set(data, start + vb);
  return opts.nsmHeader ? out : sealTrailerChecksum(out);
}
