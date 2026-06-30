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

import { hasCbinMagic, fileTypeTag } from '../clavia/cbin';
import { verifyNs4Checksum } from '../clavia/checksum';

const META_OFFSET = 0x42; // CNSP stream offset 0x16 (file 0x2C + 0x16)
const META_SIZE = 0x67; // 103 bytes
const KEYMAP_OFFSET = 0xb7; // 128-byte per-note map (file 0x2C + 0x8B); RE'd 2026-06-30
const KEYMAP_LEN = 128;

/** One sampled note: the MIDI key range it covers, pitched from `rootNote`. */
export interface NspZone {
  /** Root note the sample is pitched for (the keymap byte value). */
  rootNote: number;
  /** Lowest MIDI note that plays this sample. */
  lowNote: number;
  /** Highest MIDI note that plays this sample. */
  highNote: number;
}

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
  /** Number of distinct sampled notes (multisample zones), from the key map. */
  sampleCount?: number;
  /** Per-sample key ranges (multisample layout), low→high. Empty if unreadable. */
  zones?: NspZone[];
  warnings: string[];
}

/**
 * Decode the per-note key map (`CNSPFileInputStream` layout, @file 0xB7, 128 bytes):
 * **each byte is the root note** of the sample assigned to that MIDI key; `0xFF`
 * (and `0x00`) mark unused keys. Consecutive keys sharing a root form one sample's
 * range. RE'd 2026-06-30 against real pianos (Clavinet/CP80/Wurlitzer/RainPiano) —
 * see `docs/NSP-FORMAT.md`. Returns `[]` if the region isn't a plausible key map.
 */
function readKeyMap(bytes: Uint8Array): NspZone[] {
  if (KEYMAP_OFFSET + KEYMAP_LEN > bytes.length) return [];
  // root → [lowNote, highNote]; 0 and 0xFF are "unused".
  const span = new Map<number, [number, number]>();
  for (let note = 0; note < KEYMAP_LEN; note++) {
    const r = bytes[KEYMAP_OFFSET + note];
    if (r === 0 || r === 0xff || r > 127) continue;
    const e = span.get(r);
    if (!e) span.set(r, [note, note]);
    else { if (note < e[0]) e[0] = note; if (note > e[1]) e[1] = note; }
  }
  if (span.size < 2) return []; // not a key map (a real multisample has ≥2 zones)
  const zones = [...span.entries()].map(([rootNote, [lowNote, highNote]]) => ({ rootNote, lowNote, highNote }));
  zones.sort((a, b) => a.lowNote - b.lowNote);
  return zones;
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
  const zones = readKeyMap(bytes);
  return {
    recognized: true, version, versionRaw, codec: major, checksumValid, name,
    sampleCount: zones.length || undefined, zones: zones.length ? zones : undefined, warnings,
  };
}
