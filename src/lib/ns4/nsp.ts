/**
 * Reading the **Nord Piano** (`.npno` / `CNSP`) container header — a sibling of
 * the `.nsmp` sample format under the same `CBIN` envelope (`docs/NSP-FORMAT.md`).
 *
 * This reads only the small metadata header (name, version, checksum) so OpenNord
 * can recognize and inventory piano libraries. The audio body (the per-zone
 * sample strokes — almost certainly the same `NW1` codec as `.nsmp`) is **not**
 * decoded here, and factory libraries are Clavia IP — never extract or share them
 * (`docs/LEGAL.md`).
 *
 * Layout (from `CNSPFileInputStream::PopulateMetaData` + real files):
 *   0x00  CBIN magic / `npno` type tag / version (0x14)
 *   0x2C  `CNSP` container + 22-byte header
 *   0x42  103-byte metadata block (name, variant, size)
 */

import { hasCbinMagic, fileTypeTag } from './bits';
import { verifyNs4Checksum } from './checksum';

const META_OFFSET = 0x42; // CNSP stream offset 0x16 (file 0x2C + 0x16)
const META_SIZE = 0x67; // 103 bytes

export interface NspFile {
  /** True if the CBIN magic and `npno` tag are present. */
  recognized: boolean;
  /** Library version as shown, e.g. "6.10". */
  version?: string;
  versionRaw?: number;
  /** Codec generation = floor(versionRaw / 100) (e.g. 6 for Nord Piano V6). */
  codec?: number;
  checksumValid: boolean;
  /** Human name from the metadata block, e.g. "Astoria Grand". */
  name?: string;
  warnings: string[];
}

/** First NUL-terminated printable-ASCII run of length ≥ minLen in [from, to). */
function firstAsciiRun(bytes: Uint8Array, from: number, to: number, minLen = 3): string | undefined {
  let run = '';
  for (let i = from; i < Math.min(to, bytes.length); i++) {
    const c = bytes[i];
    if (c >= 0x20 && c < 0x7f) run += String.fromCharCode(c);
    else { if (run.length >= minLen) return run.trim(); run = ''; }
  }
  return run.length >= minLen ? run.trim() : undefined;
}

/** Read a Nord Piano (`.npno`) file's header metadata. Does not read audio. */
export function readNsp(bytes: Uint8Array): NspFile {
  const recognized = hasCbinMagic(bytes) && fileTypeTag(bytes) === 'npno';
  if (!recognized) {
    return { recognized: false, checksumValid: false, warnings: ['Not a Nord Piano (.npno) file — missing CBIN/npno signature.'] };
  }
  const versionRaw = bytes[0x14] | (bytes[0x15] << 8);
  const major = Math.trunc(versionRaw / 100);
  const version = `${major}.${String(versionRaw - major * 100).padStart(2, '0')}`;
  const checksumValid = verifyNs4Checksum(bytes);
  const warnings: string[] = [];
  if (!checksumValid) warnings.push('Piano checksum mismatch — file may be truncated or modified.');
  const name = firstAsciiRun(bytes, META_OFFSET, META_OFFSET + META_SIZE);
  return { recognized: true, version, versionRaw, codec: major, checksumValid, name, warnings };
}
