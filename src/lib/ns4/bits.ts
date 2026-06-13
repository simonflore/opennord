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

function matchAscii(bytes: Uint8Array, offset: number, ascii: string): boolean {
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}
