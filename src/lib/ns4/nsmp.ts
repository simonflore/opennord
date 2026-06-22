/**
 * Nord Sample (`.nsmp*`) container parser — CBIN envelope + the `NW1` section
 * tree, recovered by RE from the Nord Sample Editor (`docs/NSMP-CODEC.md`).
 *
 * A `.nsmp` file is a flat sequence of sections after the 0x2C CBIN header. For
 * codec 3/4 each section header is `[tag:u32 BE][version:u32 BE][size:u32 BE]`
 * (`CSectionIterator::Read_`), followed by `size` payload bytes:
 *
 *   NSMP → hdr (name) → cat → map (per-zone level/detune) → N×stk (strokes) →
 *   sty → meta
 *
 * Each `stk` section is one sample stroke (key/velocity zone): a variable-length
 * stroke header followed by the block stream decoded by {@link decodeStroke}.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): user-created samples, processed locally; audio is
 * never embedded or shared.
 */

import { hasCbinMagic, fileTypeTag } from '../clavia/cbin';
import { verifyNs4Checksum } from '../clavia/checksum';
import { decodeStroke, type DecodedStroke } from './nsmp-codec';
import { dsp2Level } from './nw1-dsp';

export interface NsmpSection {
  tag: string;
  version: number;
  /** Payload byte size (excludes the 12-byte section header). */
  size: number;
  /** Byte offset of the payload (section header start + 12). */
  payloadOffset: number;
  /** Byte offset of the next section (payloadOffset + size). */
  endOffset: number;
}

export interface NsmpFile {
  recognized: boolean;
  /** Library version as shown, e.g. "3.00" / "4.00". */
  version?: string;
  versionRaw?: number;
  /** Codec generation = floor(versionRaw / 100): 3 for `.nsmp3`, 4 for `.nsmp4`. */
  codec?: number;
  /** OG/legacy `NWS` container (original `.nsmp`, version 8) → 24-bit NW1 codec. */
  legacy: boolean;
  /**
   * Piano-library note file (`.npno`, `CNSP` root @0x2c) — a full multi-sampled
   * piano/EP instrument, distinct from the `NSMP` stroke-based sample formats.
   * Only the name is decoded (the audio body is the firmware-gated CNSP codec).
   */
  pianoLibrary?: boolean;
  checksumValid: boolean;
  name?: string;
  sections: NsmpSection[];
  /** Number of `stk` (stroke / zone) sections. */
  strokeCount: number;
  /** Best-effort: looks like factory/library content (Clavia IP) vs user-created. */
  suspectedFactory: boolean;
  warnings: string[];
}

/**
 * Best-effort guess: is this likely factory/library content (Clavia IP) rather
 * than a user's own recording? Mirrors the editor's own user-created-only gate
 * ("NSMP v3 Factory Library files are not supported"). Conservative — when
 * unsure, returns false so we never block a user's own sample; the UI surfaces
 * the suspicion rather than refusing. See docs/LEGAL.md, docs/FORMAT.md.
 */
export function looksFactory(name: string | undefined): boolean {
  if (!name) return false;
  // Factory sample names carry a vendor/library marker + version, e.g.
  // "Strings Multi … ST 4.1", "… PS 4.1", "… CL v4", "… PH_v2".
  return /\b(PS|CL|PH|ST|GP|EP)\s?v?\d+(\.\d+)?$/i.test(name.trim());
}

const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

function tagString(tag: number): string {
  let s = '';
  for (let i = 3; i >= 0; i--) {
    const c = (tag >>> (i * 8)) & 0xff;
    s += c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : '.';
  }
  return s;
}

const u24be = (b: Uint8Array, o: number) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];
const u16be = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];

const NSMP_MAGIC = 0x4e534d50; // "NSMP" — codec 3/4 body root @0x2c
const NWS_MAGIC = 0x4e5753; // "NWS"  — OG/legacy body root @0x18

/**
 * Where the section tree starts and how its headers are framed. Two real shapes:
 * **modern** (codec 3/4) — `NSMP` root at `0x2c`, `[tag:u32][version:u32][size:u32]`
 * (12-byte) headers; **OG/legacy** (`.nsmp` v8) — `NWS` root at `0x18`,
 * `[tag:u24][version:u16][size:u32]` (9-byte) headers, decoded with the 24-bit
 * NW1 variant. Detected by magic; falls back to the CBIN version (`0x14`) for the
 * speculative codec-1/2 form. (`CSectionIterator::Read_` / `PeekFormat`.)
 */
export function nsmpLayout(bytes: Uint8Array): { bodyStart: number; headerSize: number; legacy: boolean } {
  if (u32be(bytes, 0x2c) === NSMP_MAGIC) return { bodyStart: 0x2c, headerSize: 12, legacy: false };
  if (u24be(bytes, 0x18) === NWS_MAGIC) return { bodyStart: 0x18, headerSize: 9, legacy: true };
  const codec = Math.trunc((bytes[0x14] | (bytes[0x15] << 8)) / 100);
  const legacy = codec === 1 || codec === 2;
  return { bodyStart: 0x2c, headerSize: legacy ? 9 : 12, legacy };
}

/**
 * Walk the section tree using the layout from {@link nsmpLayout}: codec **3/4**
 * `[tag:u32][version:u32][size:u32]` (12 bytes) from `0x2c`; **OG/legacy** + codec
 * 1/2 `[tag:u24][version:u16][size:u32]` (9 bytes), OG from the `NWS` root at `0x18`.
 */
export function parseNsmpSections(bytes: Uint8Array): NsmpSection[] {
  const { bodyStart, headerSize } = nsmpLayout(bytes);
  const legacy = headerSize === 9;
  const sections: NsmpSection[] = [];
  let o = bodyStart;
  while (o + headerSize <= bytes.length) {
    const tag = legacy ? u24be(bytes, o) : u32be(bytes, o);
    const version = legacy ? u16be(bytes, o + 3) : u32be(bytes, o + 4);
    const size = u32be(bytes, o + (legacy ? 5 : 8));
    const payloadOffset = o + headerSize;
    if (payloadOffset + size > bytes.length) break; // truncated / not a real section
    sections.push({ tag: tagString(tag), version, size, payloadOffset, endOffset: payloadOffset + size });
    o = payloadOffset + size;
  }
  return sections;
}

/** Read the printable name from the `hdr` section payload. */
function readName(bytes: Uint8Array, hdr: NsmpSection): string | undefined {
  let run = '';
  for (let i = hdr.payloadOffset; i < hdr.endOffset && i < bytes.length; i++) {
    const c = bytes[i];
    if (c >= 0x20 && c < 0x7f) run += String.fromCharCode(c);
    else if (run.length >= 2) break;
    else run = '';
  }
  return run.trim() || undefined;
}

/** Parse a `.nsmp*` file's header + section structure (no audio decode). */
/**
 * Read the display name from a `.npno` (piano-library note) file. These use a
 * `CNSP` root at 0x2c, NOT the `NSMP` section tree, so they carry no `.hdr`
 * section. The name sits in the CNSP header as an ASCII field (a space-padded
 * copy with a trailing `#` marker, then a clean null-terminated copy) — e.g.
 * `Clavinet D6 6.1.npno` → "Clavinet D6". RE'd from the factory corpus; we take
 * the first letter-initial printable run after the CNSP header and strip the
 * `#`/padding. Returns undefined if no plausible name is found.
 */
export function readNpnoName(bytes: Uint8Array): string | undefined {
  // Scan past the 16-byte CBIN header + the CNSP marker/header for the name
  // field. Accept the first run that looks like a real name — a name-like char
  // set only (letters/digits/spaces/.-_), length >= 3 — which rejects the short
  // binary-header junk (e.g. "d(zx") that precedes the name field.
  const NAME_LIKE = /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/;
  let run = '';
  const accept = (s: string): string | undefined => {
    const cleaned = s.replace(/[#\s]+$/, '').trim();
    return cleaned.length >= 3 && NAME_LIKE.test(cleaned) ? cleaned : undefined;
  };
  for (let i = 0x30; i < Math.min(bytes.length, 0x120); i++) {
    const c = bytes[i];
    if (c >= 0x20 && c < 0x7f) {
      run += String.fromCharCode(c);
    } else {
      const got = accept(run);
      if (got) return got;
      run = '';
    }
  }
  return accept(run);
}

export function readNsmp(bytes: Uint8Array): NsmpFile {
  const warnings: string[] = [];
  // `.npno` piano-library files: CBIN container, `npno` type tag, `CNSP` root.
  // We surface the name only (audio body is the firmware-gated CNSP codec).
  if (hasCbinMagic(bytes) && fileTypeTag(bytes) === 'npno') {
    const name = readNpnoName(bytes);
    return {
      recognized: true, pianoLibrary: true, legacy: false, checksumValid: false,
      name, sections: [], strokeCount: 0, suspectedFactory: true, warnings: [],
    };
  }
  const recognized = hasCbinMagic(bytes) && fileTypeTag(bytes) === 'nsmp';
  if (!recognized) {
    return { recognized: false, legacy: false, checksumValid: false, sections: [], strokeCount: 0, suspectedFactory: false, warnings: ['Not a Nord Sample file.'] };
  }
  const { legacy } = nsmpLayout(bytes);
  const versionRaw = bytes[0x14] | (bytes[0x15] << 8);
  const major = Math.trunc(versionRaw / 100);
  // Modern codecs carry an x.yy library version (300 → "3.00"); the OG `.nsmp` uses
  // a small format revision (8) and has no CRC field, so don't fake either.
  const version = legacy ? `${versionRaw}` : `${major}.${String(versionRaw - major * 100).padStart(2, '0')}`;
  const codec = major;
  const checksumValid = verifyNs4Checksum(bytes);
  if (!checksumValid && !legacy) warnings.push('Sample checksum mismatch — possibly truncated/modified.');

  const sections = parseNsmpSections(bytes);
  const hdr = sections.find((s) => s.tag === '.hdr' || s.tag.endsWith('hdr'));
  const name = hdr ? readName(bytes, hdr) : undefined;
  const strokeCount = sections.filter((s) => s.tag.endsWith('stk')).length;

  return { recognized: true, version, versionRaw, codec, legacy, checksumValid, name, sections, strokeCount, suspectedFactory: looksFactory(name), warnings };
}

/**
 * A keyboard zone from the `map` section — one entry of the splits/velocity-layer
 * table. The 16-byte single-stroke record is **root-aligned and identical across
 * codec 3 & 4** (the one shared `CSectionMap::Read` path, @1002ed4e4):
 *
 *   +0 rootKey | +1 keyHigh(NoteExtend_Hi/split) | +2 keyLow(NoteExtend_Lo) |
 *   +3 zoneMode | +4 zonePlayback | +5 zoneIsOneShot | +6 u16 strokeCount(=1) |
 *   +8 u32 globalID | +12 u16 strength(=1) | +14 velMin | +15 velMax
 *
 * `keyHigh`/`keyLow` are the zone's split bounds; `rootKey` the key it's pitched
 * for; `velLow`..`velTop` its velocity range (a layer). `globalID` selects the
 * stroke that plays — matching the stroke's id at `stk` header +3 (NOT a
 * positional index). Verified vs `.nsmpproj` ground truth + real file dumps;
 * see `docs/NSMP-CODEC.md`. (Multi-stroke zones — strokeCount>1 — exist on the
 * wire but aren't modeled; all known content is single-stroke.)
 */
export interface NsmpZone {
  /** Top velocity of the layer — `velMax` @+15. */
  velTop: number;
  /** Bottom velocity of the layer — `velMin` @+14. */
  velLow: number;
  /** Top key — the zone's split point (record +1). */
  keyHigh: number;
  /** Bottom key of the zone (record +2). */
  keyLow: number;
  /** Key the sample is pitched for / plays at unity (record +0). */
  rootKey: number;
  /** Per-zone playback mode byte (+3). */
  zoneMode: number;
  /** Per-zone playback flag (+4). */
  zonePlayback: number;
  /** Per-zone one-shot flag (+5). */
  zoneIsOneShot: number;
  /** The stroke this zone plays, by the stroke's global id (record +11 == `stk` header +3). */
  globalID: number;
  /** Byte offset of this 16-byte record in the file, for in-place edits (0 when unknown). */
  recordOffset: number;
}

/**
 * Field byte-offsets within the 16-byte zone record. Root-aligned and **identical
 * for codec 3 & 4** — the generations differ only in the per-note row width and the
 * block that precedes the records (a 1-byte count for codec 3; a ~32-byte
 * SampleUnison block ending in the count for codec 4), not in the record itself.
 */
export interface ZoneRecordLayout {
  rootKey: number; keyHigh: number; keyLow: number;
  zoneMode: number; zonePlayback: number; zoneIsOneShot: number;
  globalID: number; velLow: number; velTop: number;
}
export const ZONE_LAYOUT: ZoneRecordLayout = {
  rootKey: 0, keyHigh: 1, keyLow: 2, zoneMode: 3, zonePlayback: 4, zoneIsOneShot: 5,
  globalID: 11, velLow: 14, velTop: 15,
};
/** @deprecated codec 3 & 4 share {@link ZONE_LAYOUT}; kept as aliases. */
export const ZONE_LAYOUT_C3 = ZONE_LAYOUT;
export const ZONE_LAYOUT_C4 = ZONE_LAYOUT;

/** The 16-byte zone-record layout (shared across codec 3 & 4). */
export function zoneRecordLayout(_codec?: number): ZoneRecordLayout {
  return ZONE_LAYOUT;
}

/** Read one 16-byte zone record at byte offset `e` using the given field layout. */
function readZoneRecord(bytes: Uint8Array, e: number, L: ZoneRecordLayout): NsmpZone {
  return {
    velTop: bytes[e + L.velTop],
    velLow: bytes[e + L.velLow],
    rootKey: bytes[e + L.rootKey],
    keyHigh: bytes[e + L.keyHigh],
    keyLow: bytes[e + L.keyLow],
    zoneMode: bytes[e + L.zoneMode],
    zonePlayback: bytes[e + L.zonePlayback],
    zoneIsOneShot: bytes[e + L.zoneIsOneShot],
    globalID: bytes[e + L.globalID],
    recordOffset: e,
  };
}

/**
 * Codec-4 (`.nsmp4`, map section version 21) zone table. The codec-4 `map`
 * widens the per-note level/detune block to **10-byte rows** — a 6-byte unity
 * entry `10 00 00 00 00 00` followed by a 4-byte incrementing note index
 * (`00 00 00 00`, `01 01 01 01`, … `7f 7f 7f 7f`), 128 rows in all — so the
 * codec-3 6-byte unity skip misaligns and over-reads. Layout (verified against
 * `Other.nsmp4` 4 zones + `Strings.nsmp4` 9 zones, cross-checked vs `.nsmpproj`):
 *
 *   [6B global][128 × 10B per-note][32B zone-table header, last byte = count]
 *   [count × 16B zone records][6B trailer `00 00 00 01 00 00`]
 *
 * So records begin at payload offset `6 + 128*10 + 32 = 1318`, and the byte just
 * before them holds the count. We self-check that `records + trailer` exactly fill
 * the section; if the header math doesn't hold (unexpected per-note width), we
 * fall back to scanning for the run of `strokeCount` valid records.
 */
export function parseCodec4ZoneRecords(
  bytes: Uint8Array, map: NsmpSection, strokeCount: number,
): NsmpZone[] {
  if (strokeCount <= 0) return [];
  const REC = 16;
  const PER_NOTE = 6 + 128 * 10; // global + 128 ten-byte rows
  const HEADER = 32;             // zone-table header; its last byte is the zone count

  // Records are root-aligned (ZONE_LAYOUT_C4): rootKey@+0, keyHigh@+1, keyLow@+2,
  // globalID@+11, trailer `00 01 00`@+12, velTop@+15.
  // Preferred path: fixed header offset, self-validated by the section size equation.
  const recStart = map.payloadOffset + PER_NOTE + HEADER;
  const count = bytes[recStart - 1];
  if (count >= 1 && recStart + count * REC + 6 === map.endOffset) {
    const zones: NsmpZone[] = [];
    for (let i = 0; i < count; i++) zones.push(readZoneRecord(bytes, recStart + i * REC, ZONE_LAYOUT_C4));
    return zones;
  }

  // Fallback: skip the per-note rows, then scan for `strokeCount` valid records.
  let o = map.payloadOffset + 6;
  const isPerNoteRow = (p: number) => p + 10 <= map.endOffset &&
    bytes[p] === 0x10 && bytes[p + 1] === 0 && bytes[p + 2] === 0 &&
    bytes[p + 3] === 0 && bytes[p + 4] === 0 && bytes[p + 5] === 0;
  while (isPerNoteRow(o)) o += 10;
  const runValid = (start: number): boolean => {
    if (start + strokeCount * REC > map.endOffset) return false;
    for (let i = 0; i < strokeCount; i++) {
      const e = start + i * REC;
      if (bytes[e] > 127 || bytes[e + 1] > 127 || bytes[e + 11] < 1) return false; // rootKey / keyHigh / globalID
      if (bytes[e + 12] !== 0 || bytes[e + 13] !== 1 || bytes[e + 14] !== 0) return false; // trailer `00 01 00`
    }
    return true;
  };
  for (let p = o; p + strokeCount * REC <= map.endOffset; p++) {
    if (!runValid(p)) continue;
    const zones: NsmpZone[] = [];
    for (let i = 0; i < strokeCount; i++) zones.push(readZoneRecord(bytes, p + i * REC, ZONE_LAYOUT_C4));
    return zones;
  }
  return [];
}

/**
 * Map each stroke's global id (`stk` header +3) to its root key (`stk` header +5).
 * The stroke header begins `00 00 00 <gid> 00 <root> 88 ba …` across every codec
 * generation — validated against codec-4 ground truth (sine_24 root 57, ramp_24
 * root 24, matching their `.nsmpproj` `m_rootKey`).
 */
function strokeRootByGlobalId(bytes: Uint8Array, sections: NsmpSection[]): Map<number, number> {
  const roots = new Map<number, number>();
  for (const s of sections) {
    if (!s.tag.endsWith('stk')) continue;
    const root = bytes[s.payloadOffset + 5];
    if (root <= 127) roots.set(bytes[s.payloadOffset + 3], root);
  }
  return roots;
}

/**
 * Read the per-zone splits/layers table from the `map` section. Skips the global
 * + per-note level/detune block (unity entries `10 00 00 00 00 00`), then parses
 * 16-byte zone entries. (Codec-3 `map` form; verified against Strings.nsmp3.)
 */
/** The `map` section's global level (u24) + detune (s24), with a default flag.
 *  Layout per docs/NSMP-CODEC.md: `[global level/detune]` at the map payload
 *  start; unity = `10 00 00 00 00 00` (.nsmpproj m_gain=1.0, m_detune=0). */
export interface GlobalLevelDetune { level: number; detune: number; isDefault: boolean }

export function readGlobalLevelDetune(bytes: Uint8Array): GlobalLevelDetune | null {
  const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'));
  if (!map) return null;
  const p = map.payloadOffset;
  const level = u24be(bytes, p);
  const raw = u24be(bytes, p + 3);
  const detune = raw >= 0x800000 ? raw - 0x1000000 : raw; // s24
  return { level, detune, isDefault: level === 0x100000 && detune === 0 };
}

/** Count per-note rows that differ from unity (`10 00 00 00 00 00`). The block
 *  follows the global 6 bytes: codec-3 128×6B, codec-4 128×10B. */
export function perNoteCustomCount(bytes: Uint8Array): number {
  const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'));
  if (!map) return 0;
  const codec = readNsmp(bytes).codec ?? 0;
  const rowLen = codec >= 4 ? 10 : 6;
  let o = map.payloadOffset + 6, custom = 0;
  for (let i = 0; i < 128 && o + rowLen <= map.endOffset; i++, o += rowLen) {
    const unity = bytes[o] === 0x10 && bytes[o + 1] === 0 && bytes[o + 2] === 0 &&
      bytes[o + 3] === 0 && bytes[o + 4] === 0 && bytes[o + 5] === 0;
    if (!unity) custom++;
  }
  return custom;
}

/**
 * The codec-4 `map`'s **SampleUnison / voicing** block — the 31-byte structure
 * between the per-note level/detune table and the zone count, read by
 * `CSectionMap::Read` (@1002ed4e4). Codec 3 has no such block. Gains are the
 * `DSP2Level` dB scale; `detune*`/`pan*` are stored raw (u16/u8) and their value
 * scale isn't pinned (the whole corpus is unison-off). `mode`/`blockMode` are the
 * `Zevs::NordSmp::EUnisonMode`/`EUnisonBlockMode` enums (0 = off).
 */
export interface SampleUnison {
  mode: number; topKey: number;
  detuneMax: number; sameDetuneMin: number; panMax: number;
  detuneMax2: number; panMax2: number; detuneMax3: number; panMax3: number;
  numVoice1: number; numVoice2: number; numVoice3: number; numVoiceSame: number;
  /** Per-tier voice gains in dB (`DSP2Level`). */
  gainDb1: number; gainDb2: number; gainDb3: number; gainDbSame: number;
  randomStrokeMode: number; blockRandomSustPed: number;
  /** True when unison is engaged (`mode !== 0`). */
  active: boolean;
}

/** Default (unison-off) block as real `.nsmp4` stores it: 2 voices per tier, unity gain. */
export const DEFAULT_SAMPLE_UNISON: Readonly<SampleUnison> = {
  mode: 0, topKey: 0, detuneMax: 0, sameDetuneMin: 0, panMax: 0,
  detuneMax2: 0, panMax2: 0, detuneMax3: 0, panMax3: 0,
  numVoice1: 2, numVoice2: 2, numVoice3: 2, numVoiceSame: 2,
  gainDb1: 0, gainDb2: 0, gainDb3: 0, gainDbSame: 0,
  randomStrokeMode: 0, blockRandomSustPed: 0, active: false,
};

/**
 * Read the codec-4 `map` SampleUnison block. Returns null for codec 3 / no map /
 * a block that runs past the section. Field order + sizes are the exact
 * `CSectionMap::Read` read sequence (mode, topKey, then interleaved detune(u16)/
 * pan(u8) spreads, four voice counts, four u24 gains, two random flags).
 */
export function readSampleUnison(bytes: Uint8Array): SampleUnison | null {
  const codec = readNsmp(bytes).codec ?? 0;
  if (codec < 4) return null;
  const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'));
  if (!map) return null;
  const o = map.payloadOffset + 6 + 128 * 10; // after global + per-note (10B rows)
  if (o + 31 > map.endOffset) return null;
  const mode = bytes[o];
  return {
    mode, topKey: bytes[o + 1],
    detuneMax: u16be(bytes, o + 2), sameDetuneMin: u16be(bytes, o + 4), panMax: bytes[o + 6],
    detuneMax2: u16be(bytes, o + 7), panMax2: bytes[o + 9],
    detuneMax3: u16be(bytes, o + 10), panMax3: bytes[o + 12],
    numVoice1: bytes[o + 13], numVoice2: bytes[o + 14], numVoice3: bytes[o + 15], numVoiceSame: bytes[o + 16],
    gainDb1: dsp2Level(u24be(bytes, o + 17)), gainDb2: dsp2Level(u24be(bytes, o + 20)),
    gainDb3: dsp2Level(u24be(bytes, o + 23)), gainDbSame: dsp2Level(u24be(bytes, o + 26)),
    randomStrokeMode: bytes[o + 29], blockRandomSustPed: bytes[o + 30],
    active: mode !== 0,
  };
}

export function readNsmpZones(bytes: Uint8Array): NsmpZone[] {
  const sections = parseNsmpSections(bytes);
  const map = sections.find((s) => s.tag.endsWith('map'));
  if (!map) return [];

  // OG/legacy (.nsmp v8) has a different `map` layout than codec 3/4 — its per-note
  // level block is 6-byte unity entries ending in 0x10 (not starting), and the zone
  // table sits at the tail. Parse it separately. (Reverse-engineered from real OG
  // files — see parseLegacyZoneRecords.)
  if (nsmpLayout(bytes).legacy) {
    const strokeCount = sections.filter((s) => s.tag.endsWith('stk')).length;
    const zones = parseLegacyZoneRecords(bytes, map.payloadOffset, map.endOffset, strokeCount);
    // The OG `map` record carries no root key (the byte we'd read there is ~0, far
    // below the zone) — the real per-zone root lives in the `stk` header (+5), keyed
    // by global id, exactly as NSE reads it (CSectionStroke). Codec 3/4 keep their
    // map-record root, which is correct for NSE-authored files and round-trips edits.
    const roots = strokeRootByGlobalId(bytes, sections);
    return zones.map((z) => ({ ...z, rootKey: roots.get(z.globalID) ?? z.rootKey }));
  }

  // Codec-4 (`.nsmp4`, map section version 21) widens the per-note block to
  // 10-byte rows, so the codec-3 6-byte unity-skip below misaligns and yields
  // garbage zones. Parse it with the dedicated codec-4 reader.
  if (map.version >= 21) {
    const strokeCount = sections.filter((s) => s.tag.endsWith('stk')).length;
    return parseCodec4ZoneRecords(bytes, map, strokeCount);
  }

  // Codec-3 `map`: [6B global][128 × 6B per-note level/detune][1B zone count][N × 16B
  // records][1B pad]. The per-note block is a fixed 128 rows (CSectionMap::Read loops
  // 0..0x80 unconditionally) — a *fixed* skip, not a unity-scan, so a non-unity
  // per-note level/detune row no longer truncates it. The 1-byte zone count precedes
  // the records (earlier readers skipped it → an off-by-one that misread velTop).
  const recStart = map.payloadOffset + 6 + 128 * 6 + 1; // global + per-note + count byte
  const count = bytes[recStart - 1];
  const zones: NsmpZone[] = [];
  for (let i = 0; i < count && recStart + i * 16 + 16 <= map.endOffset; i++) {
    zones.push(readZoneRecord(bytes, recStart + i * 16, ZONE_LAYOUT));
  }
  return zones;
}

/**
 * OG/legacy (.nsmp v8) zone table, reverse-engineered from real files. After the
 * per-note level block, the `map` ends with `[count:u16][00 00]` then `count`
 * 12-byte records:
 *   [strokeIndex:u8][rootKey:u8][tune:u16][keyHigh:u32 BE][00 01 00 00]
 * `keyHigh` is the zone's top key (split point); velocity isn't per-zone (single
 * layer → 127). The records can overrun the map's declared size by a couple of
 * bytes, so we bound by the buffer and locate the table by the count marker that
 * is followed by `count` records whose keyHigh is a valid key (≤127).
 */
export function parseLegacyZoneRecords(
  bytes: Uint8Array, searchStart: number, searchEnd: number, count: number,
): NsmpZone[] {
  if (count <= 0) return [];
  const REC = 12;
  const recordsValid = (recStart: number): boolean => {
    for (let i = 0; i < count; i++) {
      const o = recStart + i * REC;
      if (o + 8 > bytes.length || u32be(bytes, o + 4) > 127) return false;
    }
    return true;
  };
  for (let p = searchStart; p < searchEnd; p++) {
    if (u16be(bytes, p) !== count || bytes[p + 2] !== 0 || bytes[p + 3] !== 0) continue;
    const recStart = p + 4; // count u16 + 2 pad bytes
    if (!recordsValid(recStart)) continue;
    const zones: NsmpZone[] = [];
    for (let i = 0; i < count; i++) {
      const o = recStart + i * REC;
      // Legacy 12B layout: strokeIndex@+0 (the global id), rootKey@+1, keyHigh u32be@+4.
      // No separate bottom key in this generation; keyLow mirrors rootKey.
      const keyHigh = u32be(bytes, o + 4);
      zones.push({
        velTop: 127, velLow: 0, keyHigh, keyLow: bytes[o + 1], rootKey: bytes[o + 1],
        zoneMode: 0, zonePlayback: 0, zoneIsOneShot: 0, globalID: bytes[o], recordOffset: o,
      });
    }
    return zones;
  }
  return [];
}

export interface StrokeLoop {
  /** Loop start, per-channel samples from the stroke start. */
  loopStart: number;
  /** Loop end, per-channel samples from the stroke start. */
  loopEnd: number;
  /** True when the stroke loops (loop-out before the sample end); false = one-shot. */
  loops: boolean;
}

/**
 * Per-stroke loop region from the `stk` header's four region pointers
 * (start @+0x12, loop-in @+0x1b, loop-out @+0x24, end @+0x2d; u32 BE, per-channel
 * samples, cumulative across strokes — see docs/NSMP-CODEC.md). Returns the loop
 * window relative to the stroke start and the one-shot flag (`loop-out == end`).
 * Validated on OG codec-1 (TAKE ON ME stk1/2/3/8 read one-shot, matching the RE).
 * Returns null when the pointers aren't monotonic — a guard for any generation
 * whose header offsets we haven't independently pinned, so we never show garbage.
 */
export function readStrokeLoop(bytes: Uint8Array, payloadOffset: number): StrokeLoop | null {
  const u1 = u32be(bytes, payloadOffset + 0x12); // start
  const u2 = u32be(bytes, payloadOffset + 0x1b); // loop-in
  const u3 = u32be(bytes, payloadOffset + 0x24); // loop-out
  const u4 = u32be(bytes, payloadOffset + 0x2d); // end
  if (!(u1 <= u2 && u2 <= u3 && u3 <= u4)) return null;
  const span = u4 - u1;
  if (span <= 0 || span > (1 << 27)) return null; // implausible → unknown
  return { loopStart: u2 - u1, loopEnd: u3 - u1, loops: u3 !== u4 };
}

/** Write loop-in (@+0x1b) and loop-out (@+0x24) u32 BE into a `stk` header in
 *  place. Pointers are absolute, cumulative across strokes — the same frame
 *  {@link readStrokeLoop} reads. Start (@+0x12) and end (@+0x2d) are left
 *  untouched, so the sample window is preserved. Caller re-checksums. */
export function patchStrokeLoopBytes(out: Uint8Array, stkPayloadOffset: number, loopInAbs: number, loopOutAbs: number): void {
  const put = (o: number, v: number) => {
    out[o] = (v >>> 24) & 0xff; out[o + 1] = (v >>> 16) & 0xff; out[o + 2] = (v >>> 8) & 0xff; out[o + 3] = v & 0xff;
  };
  put(stkPayloadOffset + 0x1b, loopInAbs >>> 0);
  put(stkPayloadOffset + 0x24, loopOutAbs >>> 0);
}

export interface DecodedStrokeResult extends DecodedStroke {
  /** Index of the source `stk` section. */
  index: number;
  /** Channel count used (decoder de-interleaves by this). */
  channelCount: number;
  /** The stroke's global id (`stk` header byte +3) — what a zone's `globalID` references. */
  globalID: number;
  /** Loop window from the stroke header, or null when not decodable. */
  loop: StrokeLoop | null;
}

const BOUND = 1 << 26; // raw 16-bit reconstructions stay well under this

/**
 * Channel count from the stroke header — payload byte 8. Traced via the binary:
 * `CSectionStroke::Read` writes this byte to `SSmpAttributes+4`, which `SetAttributes`
 * copies to `CSmpStream+0xC` = `CSmpStream::GetChannelCnt` (the count the decoder
 * de-interleaves by). Returns 1 or 2, or 0 when it isn't a plain mono/stereo value
 * (then we fall back to the audio heuristic). Verified `== 2` on every stroke of
 * real `.nsmp3`/`.nsmp4`/OG stereo samples.
 */
function strokeChannelHint(bytes: Uint8Array, payloadOffset: number): number {
  const c = bytes[payloadOffset + 8];
  return c === 1 || c === 2 ? c : 0;
}

/** Channel counts to try, hint first; falls back to `dflt` when there's no hint. */
function channelOrder(hint: number, dflt: number[]): number[] {
  return hint === 1 ? [1, 2] : hint === 2 ? [2, 1] : dflt;
}

/**
 * Cheap structural pre-filter: from `start`, does a contiguous run of valid NW1
 * block headers (3-byte u24 for OG, 4-byte u32 for codec 3) end on a stop sentinel
 * at/near `end`? Shortlists candidate block-stream starts before the costlier full
 * decode + min-peak pick. Wrong byte alignments bail almost immediately.
 */
function streamReachesEnd(bytes: Uint8Array, start: number, end: number, u24: boolean): boolean {
  const hb = u24 ? 3 : 4;
  const wb = u24 ? 24 : 32;
  const tol = u24 ? 3 : 4;
  let o = start;
  let blocks = 0;
  while (o + hb <= end) {
    const w = u24 ? u24be(bytes, o) : u32be(bytes, o);
    const sc = w & 0x3fff;
    const fo = (w >>> 14) & 0xf;
    const bw = ((w >>> 19) & 0xf) + 1;
    if (fo === 0 && bw === 1) return blocks > 20 && Math.abs(o + hb - end) <= tol;
    if (fo > 7 || sc === 0) return false;
    o += hb + Math.ceil((sc * bw) / wb) * hb;
    blocks++;
  }
  return false;
}

/**
 * Locate and decode a stop-terminated stroke (codec 3 = 32-bit, OG = 24-bit). The
 * stroke header is variable-length, so the block-stream start is found by scanning
 * offsets: structurally pre-filter to those whose stream ends on the section's stop
 * sentinel, then pick the one decoding to the **smallest peak** (stereo or mono).
 * Wrong byte alignments may still reach the end structurally but diverge in
 * amplitude, so min-peak robustly selects the true alignment + channel count.
 */
function findStrokeStop(bytes: Uint8Array, section: NsmpSection, u24: boolean): { result: DecodedStroke; channelCount: number } | null {
  const bounded = bytes.subarray(0, section.endOffset);
  const end = section.endOffset;
  // Use the stroke-header channel count when present (resolves near-silent strokes,
  // where mono/stereo are indistinguishable from audio); else try both, min-peak.
  const hint = strokeChannelHint(bytes, section.payloadOffset);
  const channels = hint ? [hint] : [2, 1];
  let best: { result: DecodedStroke; channelCount: number; peak: number } | null = null;
  for (let start = section.payloadOffset; start < section.payloadOffset + 0x260 && start < end; start++) {
    if (!streamReachesEnd(bytes, start, end, u24)) continue;
    for (const channelCount of channels) {
      let result: DecodedStroke;
      try {
        result = decodeStroke(bounded, start, channelCount, { u24 });
      } catch {
        continue;
      }
      if (result.channels[0].length < 100) continue;
      const peak = result.channels[0].reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      if (peak < BOUND && (!best || peak < best.peak)) best = { result, channelCount, peak };
    }
    if (best && best.peak < 1 << 14) break; // unambiguously clean alignment — done
  }
  return best ? { result: best.result, channelCount: best.channelCount } : null;
}

function decodeStrokeSection(
  bytes: Uint8Array,
  section: NsmpSection,
  opts: { wordInterleaved?: boolean; u24?: boolean },
): { result: DecodedStroke; channelCount: number } | null {
  // OG/legacy (24-bit): the stroke header is large + variable and 3-byte framing
  // is only byte-aligned, so use the min-peak locator (many offsets reach the end
  // structurally; only the true alignment reconstructs cleanly).
  if (opts.u24) return findStrokeStop(bytes, section, true);

  // Codec 3 (32-bit sample-interleaved) + codec 4 (word-interleaved): the block
  // stream sits at a header offset in a tight range; take the first offset whose
  // decode stays bounded and consumes the section. Channel count comes from the
  // stroke header (byte 8) when present — which resolves *near-silent* strokes that
  // the audio alone can't (mono vs stereo identical) — else prefer mono (a loud
  // stereo stream decoded as mono diverges past BOUND, so real stereo falls to 2).
  const hint = strokeChannelHint(bytes, section.payloadOffset);
  const bounded = bytes.subarray(0, section.endOffset);
  for (let hdr = 0x60; hdr <= 0x180; hdr += 4) {
    const start = section.payloadOffset + hdr;
    if (start >= section.endOffset) break;
    for (const channelCount of channelOrder(hint, [1, 2])) {
      let result: DecodedStroke;
      try {
        result = decodeStroke(bounded, start, channelCount, { wordInterleaved: opts.wordInterleaved });
      } catch {
        continue;
      }
      const peak = result.channels[0].reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      const reachedEnd = result.endOffset >= section.endOffset - 8;
      if (reachedEnd && peak < BOUND && result.channels[0].length > 100) {
        return { result, channelCount };
      }
    }
  }
  return null;
}

/**
 * Decode every stroke in a `.nsmp*` file to raw integer PCM per channel.
 * Auto-selects the layout by version: **OG** (original `.nsmp` v8, 24-bit
 * sample-interleaved), **codec 3** (`.nsmp3`, 32-bit sample-interleaved), and
 * **codec 4** (`.nsmp4`, per-channel word-interleaved). Validated against real
 * samples in all three formats (see `nsmp.test.ts`, `docs/NSMP-CODEC.md`).
 */
export function decodeNsmp(bytes: Uint8Array): DecodedStrokeResult[] {
  const file = readNsmp(bytes);
  const opts = { wordInterleaved: file.codec === 4, u24: file.legacy };
  const out: DecodedStrokeResult[] = [];
  let index = 0;
  for (const section of file.sections) {
    if (!section.tag.endsWith('stk')) continue;
    const decoded = decodeStrokeSection(bytes, section, opts);
    // `stk` header byte +3 is the stroke's global id (the value a zone's globalID matches).
    if (decoded) out.push({
      ...decoded.result, index, channelCount: decoded.channelCount,
      globalID: bytes[section.payloadOffset + 3],
      loop: readStrokeLoop(bytes, section.payloadOffset),
    });
    index++;
  }
  return out;
}
