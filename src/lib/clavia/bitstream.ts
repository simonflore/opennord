/**
 * MSB-first bit reader over a byte buffer — the container-layer primitive shared
 * by the bit-packed model bodies (NG2, NP5, …). Pure; model → clavia.
 */

/** Read `len` bits MSB-first starting at absolute bit index `startBit` of `body`. */
export function readBits(body: Uint8Array, startBit: number, len: number): number {
  let v = 0;
  for (let i = 0; i < len; i++) {
    const bit = startBit + i;
    const byte = body[bit >> 3] ?? 0;
    const b = (byte >> (7 - (bit & 7))) & 1;
    v = (v << 1) | b;
  }
  return v >>> 0;
}
