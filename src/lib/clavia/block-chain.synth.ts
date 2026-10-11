/**
 * Synthetic program builder for the firmware-layout readers — the inverse of
 * block-chain.ts, for tests and dev tooling only (OpenNord does not write these
 * formats). Builds a body the way the firmware serialiser lays it out: u32 BE
 * version, then each block's length byte and its MSB-first fields, reserved
 * bits zero. Pure.
 */
import { buildCbinHeader } from './cbin';
import type { FwField, FwLayout } from './block-chain';

/** Write `width` bits of `value` MSB-first at absolute bit `startBit` of `body`. */
export function writeBits(body: Uint8Array, startBit: number, width: number, value: number): void {
  for (let i = 0; i < width; i++) {
    const bit = startBit + i;
    const on = Math.floor(value / 2 ** (width - 1 - i)) % 2 === 1;
    const mask = 1 << (7 - (bit & 7));
    body[bit >> 3] = on ? body[bit >> 3] | mask : body[bit >> 3] & ~mask;
  }
}

/** The raw bits a field stores for `value` (inverse of `fieldValue`). */
export function fieldRaw(value: number, f: Pick<FwField, 'enc' | 'width' | 'min'>): number {
  switch (f.enc) {
    case 'offset': return value - f.min;
    case 'twos': return value < 0 ? value + 2 ** f.width : value;
    default: return value >>> 0;
  }
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
