/**
 * Reading the **Nord Piano** (`.npno` / `CNSP`) container header — a sibling of
 * the `.nsmp` sample format under the same `CBIN` envelope.
 *
 * This reads only the small metadata header (name, version, checksum, key map) so
 * OpenNord can recognize and inventory piano libraries. The audio (stroke directory +
 * block codec) is decoded by `nsp-audio.ts`, locally only — factory libraries are Clavia
 * IP, never extract or share them (`docs/LEGAL.md`).
 *
 * Layout (from real files). The `CNSP` tag sits
 * at 0x2C in v6 files and 0x18 in v5 (shorter CBIN header); the rest is relative to it:
 *   0x00     CBIN magic / `npno` type tag / version (0x14)
 *   CNSP     `CNSP` container + 22-byte header
 *   +0x16    103-byte metadata block (name, variant, size)
 *   +0x8C    128-byte per-note key map (+0x8B is a separate byte: 2 in v6, 0 in v5)
 */

import { hasCbinMagic, fileTypeTag } from '../clavia/cbin';
import { verifyNs4Checksum } from '../clavia/checksum';
import { findCnsp } from './nsp-audio';

const META_OFFSET = 0x16; // from the CNSP tag
const META_SIZE = 0x67; // 103 bytes
const KEYMAP_OFFSET = 0x8c; // 128-byte per-note map, from the CNSP tag (RE'd 2026-06-30, re-aligned 2026-10-10)
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
  /** The recorded instrument, after the name's `#` (e.g. "CP80" in "Electric Grand 1#CP80"). */
  variant?: string;
  /** Number of distinct sampled notes (multisample zones), from the key map. */
  sampleCount?: number;
  /** Per-sample key ranges (multisample layout), low→high. Empty if unreadable. */
  zones?: NspZone[];
  warnings: string[];
}

/**
 * Decode the per-note key map (`CNSPFileInputStream` layout, CNSP+0x8C, 128 bytes):
 * **each byte is the root note** of the sample assigned to that MIDI key; `0xFF`
 * (and `0x00`) mark unused keys. Consecutive keys sharing a root form one sample's
 * range. RE'd 2026-06-30 against real pianos (Clavinet/CP80/Wurlitzer/RainPiano) —
 *. Returns `[]` if the region isn't a plausible key map.
 */
function readKeyMap(bytes: Uint8Array, cnsp: number): NspZone[] {
  const at = cnsp + KEYMAP_OFFSET;
  if (at + KEYMAP_LEN > bytes.length) return [];
  // root → [lowNote, highNote]; 0 and 0xFF are "unused".
  const span = new Map<number, [number, number]>();
  for (let note = 0; note < KEYMAP_LEN; note++) {
    const r = bytes[at + note];
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

/** Who a piano file says it is — name, variant, version — read without the checksum pass. */
export type NspIdentity = Pick<NspFile, 'name' | 'variant' | 'version' | 'versionRaw'>;

/**
 * Read only the identity fields of a `.npno` header: cheap (a few hundred bytes, no
 * checksum over the whole file), so it suits matching many large pianos.
 * `undefined` when the file isn't a Nord Piano.
 *
 * The name field (CNSP+0x1C) is `name#variant`, space-padded: "Electric Grand 1#CP80",
 * "Clavinet D6#" (real v5 + v6 factory files, 2026-10-10). The size (Sml/Med/Lrg/XL)
 * is not in it.
 */
export function readNspIdentity(bytes: Uint8Array): NspIdentity | undefined {
  if (!hasCbinMagic(bytes) || fileTypeTag(bytes) !== 'npno') return undefined;
  const versionRaw = bytes[0x14] | (bytes[0x15] << 8);
  const major = Math.trunc(versionRaw / 100);
  const version = `${major}.${String(versionRaw - major * 100).padStart(2, '0')}`;
  const cnsp = findCnsp(bytes);
  const full = cnsp < 0 ? undefined : firstAsciiRun(bytes, cnsp + META_OFFSET, cnsp + META_OFFSET + META_SIZE);
  const hash = full?.indexOf('#') ?? -1;
  const name = (hash < 0 ? full : full!.slice(0, hash).trim()) || undefined;
  const variant = hash < 0 ? undefined : full!.slice(hash + 1).trim() || undefined;
  return { name, variant, version, versionRaw };
}

/** The per-note key map's zones (low→high), or `[]` when the file has none readable. */
export function readNspZones(bytes: Uint8Array): NspZone[] {
  const cnsp = findCnsp(bytes);
  return cnsp < 0 ? [] : readKeyMap(bytes, cnsp);
}

/** Read a Nord Piano (`.npno`) file's header metadata. Does not read audio. */
export function readNsp(bytes: Uint8Array): NspFile {
  const id = readNspIdentity(bytes);
  if (!id) {
    return { recognized: false, checksumValid: false, warnings: ['Not a Nord Piano (.npno) file — missing CBIN/npno signature.'] };
  }
  const checksumValid = verifyNs4Checksum(bytes);
  const warnings: string[] = [];
  if (!checksumValid) warnings.push('Piano checksum mismatch — file may be truncated or modified.');
  const zones = readNspZones(bytes);
  return {
    recognized: true, ...id, codec: Math.trunc(id.versionRaw! / 100), checksumValid,
    sampleCount: zones.length || undefined, zones: zones.length ? zones : undefined, warnings,
  };
}
