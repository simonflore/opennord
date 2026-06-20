/**
 * The CBIN ("Clavia Binary") container envelope — shared by every Nord file
 * (Stage 2/3/4 programs & presets, samples, piano libraries). This is the
 * model-agnostic layer: magic, the 4-char file-type tag, and the fixed header
 * that precedes any model-specific body. Layout verified against real Stage 4
 * files and cross-checked against the documented Stage 2/3 layout — see
 * docs/FORMAT.md.
 *
 * Lives in `clavia/` (not `ns4/`) because the container is family-wide; the
 * Stage-4 *body* codec (bit-field read/write) stays in `ns4/bits.ts`. The
 * dependency direction is always model → clavia, never the reverse.
 */

/** A Nord program file opens with "CBIN" and tags its type "ns4p" at bytes 9-12. */
export function hasCbinMagic(bytes: Uint8Array): boolean {
  return matchAscii(bytes, 0, 'CBIN');
}

/** The 4-char file-type tag at master map 009-1..012-8 (bytes 9-12, 1-based). */
export function fileTypeTag(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes.slice(8, 12));
}

/**
 * The fixed CBIN header that precedes the bit-packed parameter body (bytes
 * 0x00–0x2B). Layout verified against real Stage 4 files — see docs/FORMAT.md.
 * The program *name* is NOT here (it lives in the filename); everything below is.
 */
export interface CbinHeader {
  /** 0x04 — header format type: 0=legacy, 1=NSM-era (always 1 on Stage 4). */
  formatType: number;
  /** 0x08 — file-type tag, e.g. `ns4p` (`ns4l` = bundle-extracted). */
  tag: string;
  /** 0x0C — bank index (keyboard slot). */
  bank: number;
  /** 0x0E — location within the bank. */
  location: number;
  /** 0x10 — program category id (resolve via {@link programCategoryName}). */
  category: number;
  /** 0x14 — program version ×100 (e.g. 313 = v3.13). */
  versionRaw: number;
}

/** Read the verified CBIN header fields. Assumes {@link hasCbinMagic} is true. */
export function readCbinHeader(bytes: Uint8Array): CbinHeader {
  const u16le = (o: number) => (bytes[o] ?? 0) | ((bytes[o + 1] ?? 0) << 8);
  return {
    formatType: bytes[0x04] ?? 0,
    tag: fileTypeTag(bytes),
    bank: bytes[0x0c] ?? 0,
    location: bytes[0x0e] ?? 0,
    category: bytes[0x10] ?? 0,
    versionRaw: u16le(0x14),
  };
}

function matchAscii(bytes: Uint8Array, offset: number, ascii: string): boolean {
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Build the 44-byte CBIN header from its fields — the inverse of
 * {@link readCbinHeader}. Used to reconstruct a full .ns4p when the device
 * returns the body only (the transfer protocol omits the header). Header bytes
 * not represented in {@link CbinHeader} are left zero; the file checksum
 * (bytes 24–27) is written separately via patchNs4Checksum after the body is
 * appended.
 */
export function buildCbinHeader(h: CbinHeader): Uint8Array {
  const out = new Uint8Array(44);
  out[0] = 0x43; out[1] = 0x42; out[2] = 0x49; out[3] = 0x4e; // 'CBIN'
  out[0x04] = h.formatType & 0xff;
  for (let i = 0; i < 4; i++) out[0x08 + i] = h.tag.charCodeAt(i) & 0xff;
  out[0x0c] = h.bank & 0xff;
  out[0x0e] = h.location & 0xff;
  out[0x10] = h.category & 0xff;
  out[0x14] = h.versionRaw & 0xff;
  out[0x15] = (h.versionRaw >>> 8) & 0xff;
  return out;
}
