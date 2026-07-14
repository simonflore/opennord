/** The fixed CBIN header that precedes every model's body (clavia/cbin.ts). */
export const CBIN_HEADER_LEN = 44;

/**
 * Return the header-stripped body of a CBIN file. Both capture paths funnel
 * through here so the header + checksum are excluded by construction and never
 * pollute a diff (and program names, which live in the header, never leave).
 */
export function stripCbinHeader(file: Uint8Array): Uint8Array {
  return file.length > CBIN_HEADER_LEN ? file.subarray(CBIN_HEADER_LEN) : new Uint8Array(0);
}
