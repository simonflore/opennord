/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection, no xorout) — the
 * Nord USB transport checksum. Distinct from the .ns4p file's CRC-32
 * (src/lib/ns4/checksum.ts). Check value: crc16ccitt("123456789") === 0x29B1.
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
