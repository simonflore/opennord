/**
 * MSB-first bit reader and writer over a byte buffer — the container-layer
 * primitives shared by the bit-packed model bodies (NG2, NP5, …). Pure; model → clavia.
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

/**
 * Write `width` bits of `value` MSB-first at absolute bit `startBit` of `body`
 * (the inverse of {@link readBits}), leaving every other bit untouched. `value`
 * is taken as unsigned; bits above `width` are ignored.
 */
export function writeBits(body: Uint8Array, startBit: number, width: number, value: number): void {
  for (let i = 0; i < width; i++) {
    const bit = startBit + i;
    const on = Math.floor(value / 2 ** (width - 1 - i)) % 2 === 1;
    const mask = 1 << (7 - (bit & 7));
    body[bit >> 3] = on ? body[bit >> 3] | mask : body[bit >> 3] & ~mask;
  }
}
