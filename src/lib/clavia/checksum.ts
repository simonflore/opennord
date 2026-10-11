/**
 * File checksums of Clavia CBIN files.
 *
 * **NSM-era files** (header format type 1 at byte 0x04 — every tag: `ns4p`,
 * `ns3f`, `ns2p`, `nlas`, `npno`, …): CRC-32/ISO-HDLC (zlib's `crc32`) over
 * bytes[0x2C:EOF] — everything after the 44-byte CBIN header, the header itself
 * not covered — stored as a little-endian u32 at bytes[0x18:0x1C]. No trailer.
 * The `Ns4` in the function names is historical: the algorithm is the same for
 * every NSM-era file, including a legacy record behind an NSM-era header.
 *
 * **Legacy files** (format type 0): the CRC-16 trailer of crc16.ts instead.
 * {@link sealFileChecksum} / {@link verifyFileChecksum} pick the right one.
 *
 * Source: reverse-engineered by differential analysis, then checked on real
 * files of both header types and scripts/crack-checksum.py.
 */
import { sealTrailerChecksum, verifyTrailerChecksum } from './crc16';

const HEADER_SIZE = 44;
const CHECKSUM_OFFSET = 24;

/** CRC-32/ISO-HDLC lookup table (poly=0x04C11DB7, refin=true, refout=true). */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

/** Compute CRC-32/ISO-HDLC (same as Python's zlib.crc32 — and the per-entry CRC a ZIP
 *  archive records, PKWARE APPNOTE 4.4.7) over a byte slice. To run one CRC over a large
 *  buffer in slices, pass the result for the bytes before `data` as `prev` (zlib's `crc32(data, value)`). */
export function crc32(data: Uint8Array, prev = 0): number {
  let crc = (prev ^ 0xffffffff) >>> 0;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Compute the checksum of an NSM-era file (`.ns4p`, `.ns3f`, …).
 * Covers bytes[44:] — everything after the CBIN header.
 */
export function computeNs4Checksum(bytes: Uint8Array): number {
  return crc32(bytes.subarray(HEADER_SIZE));
}

/**
 * Return true if the stored checksum at bytes[24:28] matches the computed value.
 * Use this to validate an incoming file before trusting its data.
 */
export function verifyNs4Checksum(bytes: Uint8Array): boolean {
  if (bytes.length < HEADER_SIZE) return false;
  return storedNs4Checksum(bytes) === computeNs4Checksum(bytes);
}

/** The checksum a CBIN file stores at bytes[24:28] (LE); it covers `bytes.subarray(44)`. */
export function storedNs4Checksum(bytes: Uint8Array): number {
  return (
    bytes[CHECKSUM_OFFSET] |
    (bytes[CHECKSUM_OFFSET + 1] << 8) |
    (bytes[CHECKSUM_OFFSET + 2] << 16) |
    (bytes[CHECKSUM_OFFSET + 3] << 24)
  ) >>> 0;
}

/** Write the CRC-32 of an NSM-era file into its own bytes[24:28]; returns `bytes`. */
function writeNs4Checksum(bytes: Uint8Array): Uint8Array {
  const cs = computeNs4Checksum(bytes);
  for (let i = 0; i < 4; i++) bytes[CHECKSUM_OFFSET + i] = (cs >>> (8 * i)) & 0xff;
  return bytes;
}

/**
 * Write the correct checksum into a mutable copy of `bytes` (an NSM-era file).
 * Always call this before saving or transmitting a generated/edited `.ns4p`.
 */
export function patchNs4Checksum(bytes: Uint8Array): Uint8Array {
  return writeNs4Checksum(new Uint8Array(bytes));
}

/** True for a legacy (format type 0) file, which closes with the CRC-16 trailer instead of the header CRC-32. */
function isLegacyHeader(bytes: Uint8Array): boolean {
  return bytes[0x04] === 0;
}

/**
 * Reseal an edited CBIN file in place with the checksum its header type uses:
 * the CRC-32 at 0x18 for an NSM-era file, the CRC-16 trailer for a legacy one
 * (whose CRC covers the header too, so any header edit needs this). Returns `bytes`.
 */
export function sealFileChecksum(bytes: Uint8Array): Uint8Array {
  if (isLegacyHeader(bytes)) return sealTrailerChecksum(bytes);
  if (bytes.length < HEADER_SIZE) throw new Error('an NSM-era file needs its 44-byte header');
  return writeNs4Checksum(bytes);
}

/** Whether a CBIN file's checksum holds, for either header type (see {@link sealFileChecksum}). */
export function verifyFileChecksum(bytes: Uint8Array): boolean {
  return isLegacyHeader(bytes) ? verifyTrailerChecksum(bytes) : verifyNs4Checksum(bytes);
}
