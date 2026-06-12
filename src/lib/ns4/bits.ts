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
