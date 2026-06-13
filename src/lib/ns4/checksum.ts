/**
 * CRC-32/ISO-HDLC checksum for Nord Stage 4 `.ns4p` files.
 *
 * Algorithm confirmed by differential analysis across three real programs:
 *   zlib.crc32(bytes[44:]) & 0xFFFFFFFF
 * stored as little-endian uint32 at bytes[24:28].
 *
 * The 44-byte CBIN header (bytes 0–43) is NOT covered; only the parameter
 * section (bytes 44 onwards) is checksummed.
 *
 * Source: reverse-engineered — see docs/FORMAT.md and scripts/crack-checksum.py.
 */

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

/** Compute CRC-32/ISO-HDLC (same as Python's zlib.crc32) over a byte slice. */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Compute the checksum for a raw `.ns4p` file.
 * Covers bytes[44:] — the pure parameter section, not the CBIN header.
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
  const stored =
    bytes[CHECKSUM_OFFSET] |
    (bytes[CHECKSUM_OFFSET + 1] << 8) |
    (bytes[CHECKSUM_OFFSET + 2] << 16) |
    (bytes[CHECKSUM_OFFSET + 3] << 24);
  const expected = computeNs4Checksum(bytes);
  return (stored >>> 0) === expected;
}

/**
 * Write the correct checksum into a mutable copy of `bytes`.
 * Always call this before saving or transmitting a generated/edited `.ns4p`.
 */
export function patchNs4Checksum(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes);
  const cs = computeNs4Checksum(bytes);
  out[CHECKSUM_OFFSET] = cs & 0xff;
  out[CHECKSUM_OFFSET + 1] = (cs >>> 8) & 0xff;
  out[CHECKSUM_OFFSET + 2] = (cs >>> 16) & 0xff;
  out[CHECKSUM_OFFSET + 3] = (cs >>> 24) & 0xff;
  return out;
}
