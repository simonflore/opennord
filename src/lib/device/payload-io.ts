/**
 * Reading the Nord FileTransfer wire format. The protocol is big-endian, so every
 * reply payload is parsed through one shared u32 reader rather than a copy per module.
 */

/** Big-endian u32 at `byteOffset` in a reply `payload`. */
export function readU32BE(payload: Uint8Array, byteOffset: number): number {
  return new DataView(payload.buffer, payload.byteOffset + byteOffset, 4).getUint32(0);
}
