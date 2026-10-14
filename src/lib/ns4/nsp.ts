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
import { verifyTrailerChecksum } from '../clavia/crc16';
import { findCnsp, LAYER_TABLE_OFFSET, readLayerTable } from './nsp-audio';

const META_OFFSET = 0x16; // from the CNSP tag
const META_SIZE = 0x67; // 103 bytes
const KEYMAP_OFFSET = 0x8c; // 128-byte per-note map, from the CNSP tag (RE'd 2026-06-30, re-aligned 2026-10-10)
const KEYMAP_LEN = 128;
/** End of the u16[128] layers-per-root table (`nsp-audio.ts`). */
const LAYER_TABLE_END = LAYER_TABLE_OFFSET + 128 * 2;

/**
 * A piano's recordings sound this many semitones above their key-map root when played at
 * 44.1 kHz (every zone of three factory pianos measures +397…+408 cents; the instrument's
 * pitch formula subtracts the same 4 semitones). the maintainers’ notes.
 */
export const NSP_ROOT_OFFSET = 4;

/**
 * Highest key a zone holds, counted from its key-map root. Every zone of 36 factory pianos
 * ends at its root or one key above it. The loader indexes a record's 14 pre-loop factors
 * (+0x36) by `root − key + 1`, which is negative from two keys
 * above the root; an independent hardware test found that such a key
 * freezes the instrument while one key above the root plays.
 */
export const NSP_MAX_KEYS_ABOVE_ROOT = 1;

/**
 * Lowest first undamped key (header +0x40D) of the 36 factory pianos: 89 on grands and
 * uprights, 92–94 on electric grands, 109 (every key damped) elsewhere. OpenNord wrote 0 until
 * 2026-10-14, and such a piano rang on every key after key-up on a Stage 2
 *.
 */
export const NSP_MIN_UNDAMPED_FROM = 89;

/** One sampled note: the MIDI key range it covers, pitched from `rootNote`. */
export interface NspZone {
  /** The key map's root byte; the recording sounds at `rootNote + NSP_ROOT_OFFSET`. */
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
  /**
   * The CBIN header promises a container checksum: format byte 1 (v6 pianos, `CNSP` at 0x2C)
   * the CRC-32 at 0x18; format byte 0 (v5 pianos, `CNSP` at 0x18) a 2-byte CRC-16/CCITT-FALSE
   * trailer over the rest of the file, like the other legacy Clavia formats (verified on
   * the real v5.30 CP80 and Wurlitzer files). See {@link nspChecksumKind}.
   */
  hasChecksum: boolean;
  /**
   * The checksum matches. False when the header's format byte and the `CNSP` position
   * disagree (a damaged header can't vouch for the file) or name no known format.
   */
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
 *
 * Any byte run can look like one root, so a single zone counts only when the directory's
 * layers-per-root table (CNSP+0x622) agrees: strokes at that root and at no other note.
 * Every factory piano has ≥ 2 zones; a one-zone piano is what a home-made test file
 * (the maintainers’ notes, test recipe step 2) looks like.
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
  if (span.size === 0) return [];
  if (span.size === 1 && !layerTableHasOnly(bytes, cnsp, [...span.keys()][0])) return [];
  const zones = [...span.entries()].map(([rootNote, [lowNote, highNote]]) => ({ rootNote, lowNote, highNote }));
  zones.sort((a, b) => a.lowNote - b.lowNote);
  return zones;
}

/** The layers-per-root table lists strokes at `root` and at no other note. */
function layerTableHasOnly(bytes: Uint8Array, cnsp: number, root: number): boolean {
  if (cnsp + LAYER_TABLE_END > bytes.length) return false;
  return readLayerTable(bytes, cnsp).every((count, note) => (note === root) === (count > 0));
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

/**
 * Which checksum a piano carries, decided by its CBIN header: format
 * byte 1 (`bytes[4]`, v6) puts a CRC-32 of `bytes[0x2C:]` at 0x18 and the `CNSP` tag at 0x2C;
 * format byte 0 (v5, a 24-byte header) has the `CNSP` tag at 0x18 and a CRC-16 trailer.
 * `undefined` when the format byte and the `CNSP` position disagree, or the byte names no
 * known format: the header itself is damaged, so its checksum can't vouch for the file.
 */
export function nspChecksumKind(bytes: Uint8Array): 'crc32' | 'crc16' | undefined {
  const cnsp = findCnsp(bytes);
  if (bytes[4] === 1 && cnsp === 0x2c) return 'crc32';
  if (bytes[4] === 0 && cnsp === 0x18) return 'crc16';
  return undefined;
}

/**
 * Read a Nord Piano (`.npno`) file's header metadata and verify its checksum (a full pass
 * over the file). Does not read audio. Listings that only show name, version and key range
 * should use {@link readNspIdentity} and {@link readNspZones}, which skip the checksum.
 */
export function readNsp(bytes: Uint8Array): NspFile {
  const id = readNspIdentity(bytes);
  if (!id) {
    return { recognized: false, hasChecksum: false, checksumValid: false, warnings: ['Not a Nord Piano (.npno) file — missing CBIN/npno signature.'] };
  }
  const kind = nspChecksumKind(bytes);
  const hasChecksum = bytes[4] === 0 || bytes[4] === 1;
  const checksumValid = kind === 'crc32' ? verifyNs4Checksum(bytes) : kind === 'crc16' ? verifyTrailerChecksum(bytes) : false;
  const warnings: string[] = [];
  if (!kind) warnings.push('Piano header is inconsistent — the file is damaged.');
  else if (!checksumValid) warnings.push('Piano checksum mismatch — file may be truncated or modified.');
  const zones = readNspZones(bytes);
  return {
    recognized: true, ...id, codec: Math.trunc(id.versionRaw! / 100), hasChecksum, checksumValid,
    sampleCount: zones.length || undefined, zones: zones.length ? zones : undefined, warnings,
  };
}
