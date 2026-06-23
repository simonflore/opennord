/**
 * Fixed-width ASCII fields — a CBIN / FileTransfer protocol primitive.
 *
 * Names in CBIN headers and on the vendor-USB wire are stored as fixed-length,
 * NUL-padded ASCII. This is container/protocol knowledge shared line-wide, not a
 * per-model concern, so it lives in the `clavia/` layer (model → clavia).
 */

/** Read a fixed-length ASCII field, stopping at NUL and trimming trailing spaces. */
export function readAsciiFixed(bytes: Uint8Array, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    const b = bytes[offset + i] ?? 0;
    if (b === 0) break;
    s += String.fromCharCode(b);
  }
  return s.trimEnd();
}
