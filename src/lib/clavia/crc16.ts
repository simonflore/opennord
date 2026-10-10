/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection, no xorout).
 * Check value: crc16ccitt(new TextEncoder().encode("123456789")) === 0x29B1.
 *
 * Clavia uses this same CRC in two places:
 *  - the Nord USB transport frame checksum (src/lib/device/protocol.ts), and
 *  - the 2-byte little-endian trailer of the legacy program/preset file
 *    formats (.nwp, .nl4s/.nl4p, .nlas/.nlap — see verifyTrailerChecksum),
 *    and of v5 Nord Piano libraries (.npno, docs/NSP-FORMAT.md).
 *
 * Distinct from the Stage 4 `.ns4p` header checksum, which is a CRC-32 stored
 * in the CBIN header (src/lib/clavia/checksum.ts).
 */

/** The CRC of each byte value: the bit-by-bit loop folded into a table (one lookup per byte). */
const CRC16_TABLE = (() => {
  const t = new Uint16Array(256);
  for (let n = 0; n < 256; n++) {
    let crc = n << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    t[n] = crc;
  }
  return t;
})();

/**
 * CRC-16/CCITT-FALSE of `data`. To run one CRC over a large buffer in slices, pass the
 * result for the bytes before `data` as `crc`.
 */
export function crc16ccitt(data: Uint8Array, crc = 0xffff): number {
  for (let i = 0; i < data.length; i++) {
    crc = ((crc << 8) & 0xff00) ^ CRC16_TABLE[((crc >>> 8) ^ data[i]) & 0xff];
  }
  return crc & 0xffff;
}

/** The CRC a legacy Clavia file stores in its last two bytes (little-endian). */
export function storedTrailerChecksum(bytes: Uint8Array): number {
  return bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
}

/**
 * Verify the 2-byte LE CRC-16/CCITT-FALSE trailer that closes the legacy
 * Clavia file formats: the CRC is computed over the whole file except the
 * final two bytes and stored little-endian in those bytes.
 *
 * Confirmed by corpus brute-force 2026-07-04: 1018/1018 .nwp, 1275/1275 .nl4s,
 * 494/494 .nl4p, 50/51 .nlas (the one miss is a 141-byte oddball with a zeroed
 * trailer), 1/1 .nlap. A zeroed trailer is treated as "absent" and returns
 * false without implying corruption — callers decide how to surface it.
 */
export function verifyTrailerChecksum(bytes: Uint8Array): boolean {
  if (bytes.length < 3) return false;
  return crc16ccitt(bytes.subarray(0, bytes.length - 2)) === storedTrailerChecksum(bytes);
}

/**
 * Seal a legacy file in place: write the CRC-16 of everything but its last two bytes into
 * those two bytes (LE), so {@link verifyTrailerChecksum} holds. Returns `bytes`.
 */
export function sealTrailerChecksum(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 3) throw new Error('a CRC-16 trailer needs at least one byte before it');
  const crc = crc16ccitt(bytes.subarray(0, bytes.length - 2));
  bytes[bytes.length - 2] = crc & 0xff;
  bytes[bytes.length - 1] = crc >>> 8;
  return bytes;
}
