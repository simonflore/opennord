/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection, no xorout).
 * Check value: crc16ccitt(new TextEncoder().encode("123456789")) === 0x29B1.
 *
 * Clavia uses this same CRC in two places:
 *  - the Nord USB transport frame checksum (src/lib/device/protocol.ts), and
 *  - the 2-byte little-endian trailer of the legacy (CBIN format type 0)
 *    files — .nwp, .nl4s/.nl4p, .nlas/.nlap, legacy .ns2p/.ns3f (see
 *    verifyTrailerChecksum; the CRC covers the header too; unconfirmed on the
 *    Electro, C2/C2D and Piano 2/3 files, docs/CHECKSUM.md),
 *    and of v5 Nord Piano libraries (.npno, docs/NSP-FORMAT.md).
 *
 * Distinct from the checksum of NSM-era (format type 1) files, a CRC-32 stored
 * in the CBIN header (src/lib/clavia/checksum.ts, which also picks between the two).
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
 * 494/494 .nl4p, 50/51 .nlas, 1/1 .nlap. The .nlas "miss" is no oddball but an
 * ordinary NSM-era file (format type 1): a 44-byte header, then the record
 * (u16 version 7 at 0x2C and 95 bytes of data) to EOF — 141 bytes — with the
 * CRC-32 of checksum.ts at 0x18 and no trailer. NSM writes every file it saves
 * that way (the instrument's record verbatim behind the NSM-era header) and only
 * reads the legacy header + CRC-16 trailer form. Use checksum.ts
 * `verifyFileChecksum` for a file of either header type; on an NSM-era file
 * this returns false without implying corruption.
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
