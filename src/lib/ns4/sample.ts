/**
 * Reading the *header* of a Nord Sample (`.nsmp4`) file.
 *
 * ⚠️ LEGAL / SCOPE (docs/LEGAL.md): a `.nsmp4` is factory/library **audio
 * content** — a CBIN header followed by ~1.5 MB of compressed audio. OpenNord
 * **never decodes, stores, embeds, or redistributes that audio.** This module
 * reads only the small metadata header (name, version, checksum validity) so
 * OpenNord can *recognize* and *inventory* the samples a user already owns and
 * tell them which sample a shared program needs — without ever touching the
 * audio payload. The `bytes` are not retained here.
 *
 * Structure (verified against one real file, "Indian Harmonium 1 PS 4.1"):
 *   0x00  CBIN magic
 *   0x04  header format type (1)
 *   0x08  type tag "nsmp"
 *   0x14  version (u16 LE ÷100), e.g. 410 → v4.10
 *   0x18  CRC-32 over bytes[0x2C:] — same checksum family as programs
 *   0x2C  "NSMP" chunk container → "hdr" chunk (human name) → audio payload
 */

import { hasCbinMagic, fileTypeTag } from './bits';
import { verifyNs4Checksum } from './checksum';

const HEADER_SIZE = 0x2c;

export interface NsmpHeader {
  kind: 'sample';
  /** True if the CBIN magic and `nsmp` tag are present. */
  recognized: boolean;
  /** Human sample name, e.g. "Indian Harmonium 1" (from the header chunk). */
  name?: string;
  /** Library version as shown, e.g. "4.10". */
  version?: string;
  /** Raw 16-bit version integer, e.g. 410. */
  versionRaw?: number;
  /** Whether the stored CRC-32 matches the body — a quick integrity check. */
  checksumValid: boolean;
  /** Approximate size of the (un-read) compressed audio payload, in bytes. */
  audioPayloadBytes: number;
  warnings: string[];
}

/** Pull the first NUL-terminated printable-ASCII run of length ≥ minLen. */
function firstAsciiRun(bytes: Uint8Array, from: number, to: number, minLen = 3): string | undefined {
  let run = '';
  for (let i = from; i < Math.min(to, bytes.length); i++) {
    const c = bytes[i];
    if (c >= 0x20 && c < 0x7f) {
      run += String.fromCharCode(c);
    } else {
      if (run.length >= minLen) return run.trim();
      run = '';
    }
  }
  return run.length >= minLen ? run.trim() : undefined;
}

/**
 * Read the header metadata of a Nord Sample file. Does not read or return audio.
 * Safe on any buffer — returns `recognized: false` for non-sample input.
 */
export function readNsmpHeader(bytes: Uint8Array): NsmpHeader {
  const warnings: string[] = [];
  const recognized = hasCbinMagic(bytes) && fileTypeTag(bytes) === 'nsmp';

  if (!recognized) {
    warnings.push('Not a Nord Sample (.nsmp4) file — missing CBIN/nsmp signature.');
    return { kind: 'sample', recognized: false, checksumValid: false, audioPayloadBytes: 0, warnings };
  }

  const versionRaw = bytes[0x14] | (bytes[0x15] << 8);
  const major = Math.trunc(versionRaw / 100);
  const version = `${major}.${String(versionRaw - major * 100).padStart(2, '0')}`;

  const checksumValid = verifyNs4Checksum(bytes);
  if (!checksumValid) warnings.push('Sample checksum does not match — file may be truncated or modified.');

  // The human name sits in the "hdr" chunk just past the 0x2C container header.
  // Heuristic: first printable run after the chunk directory; robust enough for
  // recognition without fully parsing the (single-sample-derived) chunk tree.
  const name = firstAsciiRun(bytes, 0x44, Math.min(0x100, bytes.length));

  return {
    kind: 'sample',
    recognized: true,
    name,
    version,
    versionRaw,
    checksumValid,
    audioPayloadBytes: Math.max(0, bytes.length - 0x100),
    warnings,
  };
}

export { HEADER_SIZE as NSMP_HEADER_SIZE };
