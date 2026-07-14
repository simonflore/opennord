/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection, no xorout).
 * Check value: crc16ccitt(new TextEncoder().encode("123456789")) === 0x29B1.
 *
 * Clavia uses this same CRC in two places:
 *  - the Nord USB transport frame checksum (src/lib/device/protocol.ts), and
 *  - the 2-byte little-endian trailer of the legacy program/preset file
 *    formats (.nwp, .nl4s/.nl4p, .nlas/.nlap — see verifyTrailerChecksum).
 *
 * Distinct from the Stage 4 `.ns4p` header checksum, which is a CRC-32 stored
 * in the CBIN header (src/lib/clavia/checksum.ts).
 */
export function crc16ccitt(data: Uint8Array): number {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
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
  const stored = bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
  return crc16ccitt(bytes.subarray(0, bytes.length - 2)) === stored;
}
