/**
 * The CBIN ("Clavia Binary") container envelope — shared by every Nord file
 * (programs, Lives, presets, settings, samples, piano libraries). This is the
 * model-agnostic layer: magic, the 4-char file-type tag, the fixed header and
 * where the instrument's own record sits behind it. Layout verified against
 * real Stage 2/3/4 files.
 *
 * One framing rule holds for every model (Nord Sound Manager 9.22 applies it to
 * all of them and never parses a body):
 *
 *   0x00 'CBIN' · 0x04 u32 formatType (0 legacy, 1 NSM-era; NSM refuses ≥ 2)
 *   0x08 tag (4 chars; a 3-letter tag is NUL-padded) · 0x0C u16 bank
 *   0x0E u16 slot · 0x10 u32 category · 0x14 u32 version (as the device reports it)
 *   NSM-era: 0x18 u32 CRC-32, 0x1C–0x2B zero, the record from 0x2C to the end.
 *   Legacy:  the record from 0x18, then a 2-byte CRC-16 trailer.
 *
 * So the record is `size − 44` bytes behind an NSM-era header and `size − 26`
 * behind a legacy one. NSM writes NSM-era headers only and passes the
 * instrument's record through verbatim (device transfer sends the record alone).
 *
 * Lives in `clavia/` (not `ns4/`) because the container is family-wide; the
 * Stage-4 *body* codec (bit-field read/write) stays in `ns4/bits.ts`. The
 * dependency direction is always model → clavia, never the reverse.
 */

/** The fixed CBIN header is 44 bytes (0x00–0x2B); the model-specific body starts here. */
export const CBIN_BODY_OFFSET = 0x2c;

/** 0x04 formatType of a legacy (pre-NSM) header. */
export const CBIN_FORMAT_LEGACY = 0;
/** 0x04 formatType of an NSM-era header; NSM refuses any newer value. */
export const CBIN_FORMAT_NSM = 1;
/** Where the record starts behind a legacy header (it has no CRC-32 or reserved words). */
export const CBIN_LEGACY_RECORD_OFFSET = 0x18;
/** The CRC-16 trailer that closes a legacy file. */
export const CBIN_LEGACY_TRAILER_BYTES = 2;

/** Where the instrument's record sits in a CBIN file (the framing rule above). */
export interface CbinFraming {
  /** 0x04, read as the u32 it is. */
  readonly formatType: number;
  /** formatType 0 or 1 — what NSM accepts. A newer one is not read. */
  readonly supported: boolean;
  /** File offset of the record: 0x2C (NSM-era) or 0x18 (legacy). */
  readonly recordOffset: number;
  /** Bytes after the record: 2 on a legacy file (its CRC-16), 0 on an NSM-era one. */
  readonly trailerBytes: number;
  /** Record length: size − 44 (NSM-era) or size − 26 (legacy); 0 when the file is shorter. */
  readonly recordBytes: number;
}

const u16le = (b: Uint8Array, o: number) => (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8);
const u32le = (b: Uint8Array, o: number) => (u16le(b, o) | (u16le(b, o + 2) << 16)) >>> 0;

/** The framing of a CBIN file: where its record starts and how long it is. Never throws. */
export function cbinFraming(bytes: Uint8Array): CbinFraming {
  const formatType = u32le(bytes, 0x04);
  const nsm = formatType === CBIN_FORMAT_NSM;
  const recordOffset = nsm ? CBIN_BODY_OFFSET : CBIN_LEGACY_RECORD_OFFSET;
  const trailerBytes = nsm ? 0 : CBIN_LEGACY_TRAILER_BYTES;
  return {
    formatType, supported: formatType <= CBIN_FORMAT_NSM, recordOffset, trailerBytes,
    recordBytes: Math.max(0, bytes.length - recordOffset - trailerBytes),
  };
}

/** The instrument's record — what the device stores and NSM sends verbatim (a copy). */
export function cbinRecord(bytes: Uint8Array): Uint8Array {
  const f = cbinFraming(bytes);
  return bytes.slice(f.recordOffset, f.recordOffset + f.recordBytes);
}

/** A Nord program file opens with "CBIN" and tags its type "ns4p" at bytes 9-12. */
export function hasCbinMagic(bytes: Uint8Array): boolean {
  return matchAscii(bytes, 0, 'CBIN');
}

/** CBIN program version as a display string, e.g. 313 → "3.13" (the low u16 of the u32 LE at 0x14, ÷100). */
export function formatCbinVersion(bytes: Uint8Array): string {
  return (((bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8)) / 100).toFixed(2);
}

/**
 * The 4-char file-type tag at master map 009-1..012-8 (bytes 9-12, 1-based).
 * Three-letter tags (the Grand's `ngp`/`ngl`/`ngs`, per its firmware's fourcc
 * strings) are padded; trailing NUL/space padding is dropped so they compare as
 * `ngp`.
 */
export function fileTypeTag(bytes: Uint8Array): string {
  let end = Math.min(12, bytes.length);
  while (end > 8 && (bytes[end - 1] === 0 || bytes[end - 1] === 0x20)) end--;
  return String.fromCharCode(...bytes.slice(8, end));
}

/**
 * The fixed CBIN header fields (0x00–0x17, common to both header formats).
 * The program *name* is NOT here (it lives in the filename); everything below is.
 */
export interface CbinHeader {
  /** 0x04 — header format type: 0 = legacy, 1 = NSM-era (always 1 on Stage 4). */
  formatType: number;
  /** 0x08 — file-type tag, e.g. `ns4p` (`ns4l` = Live). */
  tag: string;
  /** 0x0C — u16 bank index (keyboard slot). */
  bank: number;
  /** 0x0E — u16 location within the bank. */
  location: number;
  /** 0x10 — u32 program category id (resolve via {@link programCategoryName}). */
  category: number;
  /** 0x14 — u32 version as the device reports it, ×100 on most models (313 = v3.13). */
  versionRaw: number;
}

/** Read the CBIN header fields. Assumes {@link hasCbinMagic} is true. */
export function readCbinHeader(bytes: Uint8Array): CbinHeader {
  return {
    formatType: u32le(bytes, 0x04),
    tag: fileTypeTag(bytes),
    bank: u16le(bytes, 0x0c),
    location: u16le(bytes, 0x0e),
    category: u32le(bytes, 0x10),
    versionRaw: u32le(bytes, 0x14),
  };
}

function matchAscii(bytes: Uint8Array, offset: number, ascii: string): boolean {
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Build the 44-byte NSM-era CBIN header from its fields — the inverse of
 * {@link readCbinHeader}. Used to reconstruct a full file when the device
 * returns the record only (the transfer protocol omits the header). The
 * reserved words are left zero; the file checksum (0x18–0x1B) is written
 * separately via patchNs4Checksum after the record is appended. A legacy
 * header is the first 0x18 bytes of this with `formatType` 0.
 */
export function buildCbinHeader(h: CbinHeader): Uint8Array {
  const out = new Uint8Array(44);
  const dv = new DataView(out.buffer);
  out[0] = 0x43; out[1] = 0x42; out[2] = 0x49; out[3] = 0x4e; // 'CBIN'
  dv.setUint32(0x04, h.formatType >>> 0, true);
  for (let i = 0; i < 4; i++) out[0x08 + i] = h.tag.charCodeAt(i) & 0xff;
  dv.setUint16(0x0c, h.bank & 0xffff, true);
  dv.setUint16(0x0e, h.location & 0xffff, true);
  dv.setUint32(0x10, h.category >>> 0, true);
  dv.setUint32(0x14, h.versionRaw >>> 0, true);
  return out;
}
