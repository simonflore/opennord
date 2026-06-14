/**
 * Bit-level reader for Nord Stage 4 program files.
 *
 * Ported from ns4decode (https://ns4decode.netlify.app/) by Randy, MIT-licensed:
 *
 *   MIT License — Copyright (c) 2024 Randy
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software ... (full text retained in THIRD_PARTY_LICENSES.md)
 *
 * The format addresses every parameter by a bit range. A `.ns4p` file is treated
 * as one big MSB-first bit string; a parameter's value is the integer formed by
 * the bits from `begBit` to `endBit` inclusive. Locations are written `BBB-b`:
 * byte BBB (1-based) and bit b (1-based, MSB-first within the byte).
 */

/** Render bytes as one MSB-first bit string (ns4decode `file_to_bitstring`). */
export function bytesToBitString(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(2).padStart(8, '0');
  return s;
}

/** "BBB-b" → absolute 0-based bit index (ns4decode `getBitloc`/`getLocFromStr`). */
export function locToBit(loc: string): number {
  const byte = parseInt(loc.slice(0, 3), 10);
  const bit = parseInt(loc.slice(4), 10);
  return (byte - 1) * 8 + (bit - 1);
}

/** Inverse of {@link locToBit} — absolute bit index → "BBB-b" (for display). */
export function bitToLoc(bit: number): string {
  const byte = 1 + Math.floor(bit / 8);
  const within = 1 + (bit - (byte - 1) * 8);
  return `${String(byte).padStart(3, '0')}-${within}`;
}

/** Read the unsigned integer in bits [begBit, endBit] (ns4decode `getParamValue`). */
export function readField(bits: string, begBit: number, endBit: number): number {
  if (begBit < 0 || endBit < begBit || endBit >= bits.length) return NaN;
  return parseInt(bits.slice(begBit, endBit + 1), 2);
}

/**
 * Read the unsigned integer in bits [begBit, endBit] directly from bytes —
 * the byte-level equivalent of {@link readField} (MSB-first), without building
 * the whole bit string. Used by the writer to read-modify-write a single field.
 */
export function readFieldBytes(bytes: Uint8Array, begBit: number, endBit: number): number {
  let v = 0;
  for (let absBit = begBit; absBit <= endBit; absBit++) {
    const byteIdx = absBit >>> 3;
    const bitInByte = 7 - (absBit & 7); // MSB-first within the byte
    v = (v << 1) | ((bytes[byteIdx] >>> bitInByte) & 1);
  }
  return v >>> 0;
}

/**
 * Write the unsigned integer `value` into MSB-first bits [begBit, endBit],
 * mutating `bytes` in place. The exact inverse of {@link readField} /
 * {@link readFieldBytes}. Throws on an invalid range or out-of-range value.
 */
export function writeField(bytes: Uint8Array, begBit: number, endBit: number, value: number): void {
  if (begBit < 0 || endBit < begBit) throw new RangeError(`bad bit range ${begBit}..${endBit}`);
  const width = endBit - begBit + 1;
  if (width > 32) throw new RangeError(`field width ${width} > 32 bits unsupported`);
  const max = width === 32 ? 0xffffffff : (1 << width) - 1;
  if (!Number.isInteger(value) || value < 0 || value > max) {
    throw new RangeError(`value ${value} out of range for ${width}-bit field (0..${max})`);
  }
  for (let i = 0; i < width; i++) {
    const bitVal = (value >>> (width - 1 - i)) & 1; // MSB of the value first
    const absBit = begBit + i;
    const byteIdx = absBit >>> 3;
    const mask = 1 << (7 - (absBit & 7)); // MSB-first within the byte
    if (bitVal) bytes[byteIdx] |= mask;
    else bytes[byteIdx] &= ~mask;
  }
}

/** A Nord program file opens with "CBIN" and tags its type "ns4p" at bytes 9-12. */
export function hasCbinMagic(bytes: Uint8Array): boolean {
  return matchAscii(bytes, 0, 'CBIN');
}

/** The 4-char file-type tag at master map 009-1..012-8 (bytes 9-12, 1-based). */
export function fileTypeTag(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes.slice(8, 12));
}

/**
 * The fixed CBIN header that precedes the bit-packed parameter body (bytes
 * 0x00–0x2B). Layout verified against real Stage 4 files — see docs/FORMAT.md.
 * The program *name* is NOT here (it lives in the filename); everything below is.
 */
export interface CbinHeader {
  /** 0x04 — header format type: 0=legacy, 1=NSM-era (always 1 on Stage 4). */
  formatType: number;
  /** 0x08 — file-type tag, e.g. `ns4p` (`ns4l` = bundle-extracted). */
  tag: string;
  /** 0x0C — bank index (keyboard slot). */
  bank: number;
  /** 0x0E — location within the bank. */
  location: number;
  /** 0x10 — program category id (resolve via {@link programCategoryName}). */
  category: number;
  /** 0x14 — program version ×100 (e.g. 313 = v3.13). */
  versionRaw: number;
}

/** Read the verified CBIN header fields. Assumes {@link hasCbinMagic} is true. */
export function readCbinHeader(bytes: Uint8Array): CbinHeader {
  const u16le = (o: number) => (bytes[o] ?? 0) | ((bytes[o + 1] ?? 0) << 8);
  return {
    formatType: bytes[0x04] ?? 0,
    tag: fileTypeTag(bytes),
    bank: bytes[0x0c] ?? 0,
    location: bytes[0x0e] ?? 0,
    category: bytes[0x10] ?? 0,
    versionRaw: u16le(0x14),
  };
}

function matchAscii(bytes: Uint8Array, offset: number, ascii: string): boolean {
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Build the 44-byte CBIN header from its fields — the inverse of
 * {@link readCbinHeader}. Used to reconstruct a full .ns4p when the device
 * returns the body only (the transfer protocol omits the header). Header bytes
 * not represented in {@link CbinHeader} are left zero; the file checksum
 * (bytes 24–27) is written separately via patchNs4Checksum after the body is
 * appended.
 */
export function buildCbinHeader(h: CbinHeader): Uint8Array {
  const out = new Uint8Array(44);
  out[0] = 0x43; out[1] = 0x42; out[2] = 0x49; out[3] = 0x4e; // 'CBIN'
  out[0x04] = h.formatType & 0xff;
  for (let i = 0; i < 4; i++) out[0x08 + i] = h.tag.charCodeAt(i) & 0xff;
  out[0x0c] = h.bank & 0xff;
  out[0x0e] = h.location & 0xff;
  out[0x10] = h.category & 0xff;
  out[0x14] = h.versionRaw & 0xff;
  out[0x15] = (h.versionRaw >>> 8) & 0xff;
  return out;
}
