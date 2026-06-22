/**
 * Differential-RE inference engine (RE-only). Pure: no I/O, no DOM. Turns multiple
 * captures of ONE control into a FieldDescriptor. The diffed body is checksum-free
 * (CRC-32 lives in the stripped header), so varying bits are essentially the field.
 * Bit convention: global bit index = byte*8 + bitInByte, LSB = bit 0.
 */

/** Global bit indices that differ across any pair of bodies. */
export function changedBits(bodies: Uint8Array[]): number[] {
  if (bodies.length < 2) return [];
  const len = Math.min(...bodies.map((b) => b.length));
  const out: number[] = [];
  for (let byte = 0; byte < len; byte++) {
    let or = 0, and = 0xff;
    for (const b of bodies) { or |= b[byte]; and &= b[byte]; }
    const varying = or & ~and; // set in some samples, clear in others
    if (varying) for (let bit = 0; bit < 8; bit++) if (varying & (1 << bit)) out.push(byte * 8 + bit);
  }
  return out;
}

/** Contiguous runs of (sorted) bit indices. */
export function bitRuns(bits: number[]): Array<{ startBit: number; endBit: number }> {
  if (bits.length === 0) return [];
  const s = [...bits].sort((a, b) => a - b);
  const runs: Array<{ startBit: number; endBit: number }> = [];
  let start = s[0], prev = s[0];
  for (let i = 1; i < s.length; i++) {
    if (s[i] === prev + 1) { prev = s[i]; continue; }
    runs.push({ startBit: start, endBit: prev }); start = s[i]; prev = s[i];
  }
  runs.push({ startBit: start, endBit: prev });
  return runs;
}
