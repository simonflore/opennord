/**
 * Nord Sample (`.nsmp*`) container parser — CBIN envelope + the `NW1` section
 * tree, recovered by RE from the Nord Sample Editor.
 *
 * A `.nsmp` file is a flat sequence of sections after the 0x2C CBIN header. For
 * codec 3/4 each section header is `[tag:u32 BE][version:u32 BE][size:u32 BE]`
 * followed by `size` payload bytes:
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

import { verifyNs4Checksum } from '../clavia/checksum';
import { identifyNsmp, nsmpLayout, nsmpHasChecksumField } from '../clavia/sample-identify';
import { decodeStroke, type DecodedStroke } from './nsmp-codec';
import { dsp2Level } from './nw1-dsp';

// Header identification + section-tree framing are model-agnostic container
// knowledge (clavia/sample-identify); re-exported here for the codec's callers.
export { nsmpLayout };

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

/**
 * Read the sample instrument's **main category id** from the `cat` section
 * (byte 0 = `m_categoryCategory`; byte 1 is the subcategory). Present for OG,
 * codec-3 and codec-4 stroke files; absent for `.npno` piano libraries. Returns
 * `undefined` when there's no `cat` section. Resolve to a name via
 * `sampleCategoryName` (`clavia/sample-categories`). RE'd from the Nord Sample
 * Editor's category list.
 */
export function readSampleCategoryId(bytes: Uint8Array): number | undefined {
  return readSampleCategory(bytes).main;
}

/**
 * Read the sample instrument's main + sub category ids from the `cat` section
 * (byte 0 = `m_categoryCategory`, byte 1 = `m_categorySubCategory`). Resolve to
 * a display label with `sampleCategoryLabel` (`clavia/sample-categories`).
 */
export function readSampleCategory(bytes: Uint8Array): { main?: number; sub?: number } {
  const cat = parseNsmpSections(bytes).find((s) => s.tag.endsWith('cat'));
  if (!cat || cat.payloadOffset >= bytes.length) return {};
  return { main: bytes[cat.payloadOffset], sub: bytes[cat.payloadOffset + 1] };
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

/**
 * Structural factory marker — the authoritative origin signal, independent of
 * name/folder/category (all of which are user-configurable). The `hdr` section
 * payload carries a non-zero flag word at **+8** (the two bytes immediately
 * before the name) on Nord factory-library samples, and zero on user imports.
 * RE'd against real installed/backup content: codec 4 — 15/15 user imports =
 * `00 00`, 8/8 factory = `0a 01`; codec 3 — an installed factory sound bank is
 * uniformly non-zero (`0a 01` at v3.10, `00 01` at v3.00) while a user import is
 * `00 00`, matching how the Sample Editor tells factory sounds from user imports
 *. Same `+8` offset for codec 3 and 4.
 * CAVEAT: reliable for samples read from a backup/partition (installed); a
 * factory sample re-exported loose can have the flag stripped → reads as user.
 * Returns false when the flag region is missing/truncated.
 */
export function hdrFactoryFlag(bytes: Uint8Array, hdr: NsmpSection): boolean {
  const at = hdr.payloadOffset + 8;
  if (at + 1 >= hdr.endOffset || at + 1 >= bytes.length) return false;
  return ((bytes[at] ?? 0) | (bytes[at + 1] ?? 0)) !== 0;
}

/** Smallest head that contains the whole `hdr` section (so `parseNsmpSections`
 *  includes it before breaking on the next, truncated section). */
export const NSMP_FACTORY_HEAD_BYTES = 320;

/**
 * Resolve factory-vs-user from just a file **head** (≥ {@link NSMP_FACTORY_HEAD_BYTES}),
 * so the badge can be filled lazily from a tiny ranged read instead of the whole
 * sample. Codec 3 & 4 (where the flag is RE-validated); `undefined` when it
 * can't be determined (other codec, truncated, or no `hdr`).
 */
export function nsmpHeadFactory(head: Uint8Array): boolean | undefined {
  const id = identifyNsmp(head);
  if (!id.recognized || (id.codec !== 3 && id.codec !== 4)) return undefined;
  const hdr = parseNsmpSections(head).find((s) => s.tag.endsWith('hdr'));
  return hdr ? hdrFactoryFlag(head, hdr) : undefined;
}

/** The file extensions of a Nord Sample, every generation. */
export const NSMP_EXTENSIONS = ['.nsmp', '.nsmp3', '.nsmp4'] as const;

/** Whether a file name is a Nord Sample's ({@link NSMP_EXTENSIONS}). */
export const isNsmpFileName = (name: string) => NSMP_EXTENSIONS.some((e) => name.toLowerCase().endsWith(e));

/** Whether OpenNord can decode a sample's audio: the original `.nsmp`, `.nsmp3` and `.nsmp4`. */
export const isDecodableNsmp = (file: Pick<NsmpFile, 'codec' | 'legacy'>) =>
  file.legacy || file.codec === 3 || file.codec === 4;

export function readNsmp(bytes: Uint8Array): NsmpFile {
  const warnings: string[] = [];
  const id = identifyNsmp(bytes);
  // `.npno` piano-library files: CBIN container, `npno` type tag, `CNSP` root.
  // We surface the name only (audio body is the firmware-gated CNSP codec).
  if (id.pianoLibrary) {
    const name = readNpnoName(bytes);
    return {
      recognized: true, pianoLibrary: true, legacy: false, checksumValid: false,
      name, sections: [], strokeCount: 0, suspectedFactory: true, warnings: [],
    };
  }
  if (!id.recognized) {
    return { recognized: false, legacy: false, checksumValid: false, sections: [], strokeCount: 0, suspectedFactory: false, warnings: ['Not a Nord Sample file.'] };
  }
  const { legacy, version, versionRaw, codec } = id;
  // Only NSM-era (format-1) `.nsmp3/.nsmp4` carry the CRC-32 field at 0x18–0x1b;
  // format-0 exports (e.g. some Library-3.0 `.nsmp3`) put the `NSMP` section root
  // there, so there's nothing to validate — verifying against those bytes falsely
  // reports a mismatch (and re-checksumming would corrupt the file; see
  // patchEditedNsmp). Treat "no checksum field" as nothing-wrong.
  const hasChecksum = nsmpHasChecksumField(bytes);
  const checksumValid = hasChecksum ? verifyNs4Checksum(bytes) : true;
  if (hasChecksum && !checksumValid) warnings.push('Sample checksum mismatch — possibly truncated/modified.');
  // `NWS` containers cover two codecs: v8 → codec 1 (rev A,
  // Library 1.x) and v11 → codec 2 (rev B, Library 2.0; CBIN ver 200, `map`
  // version 10). Both are now read (audio + name + zones).
  // `0xffff` is the accepted "Undefined" legacy stamp (codec-1 family). Warn only for
  // a legacy file that is *none* of these — a generation we haven't mapped.
  if (legacy && versionRaw !== undefined && versionRaw !== 8 && versionRaw !== 0xffff && codec !== 2) {
    warnings.push(
      `Unverified Nord Sample generation (NWS v${versionRaw}). Only Library 1.x ` +
        `(.nsmp v8), Library 2.0 (codec 2), and the "Undefined" legacy stamp are ` +
        `validated — readout may be incomplete.`,
    );
  }

  const sections = parseNsmpSections(bytes);
  const hdr = sections.find((s) => s.tag === '.hdr' || s.tag.endsWith('hdr'));
  const name = hdr ? readName(bytes, hdr) : undefined;
  const strokeCount = sections.filter((s) => s.tag.endsWith('stk')).length;

  // Origin is claimed ONLY from the structural factory flag (codec 3 & 4, RE-
  // validated). Where there's no reliable signal — OG/legacy `.nsmp`, or a sample
  // with no `hdr` — we make NO claim rather than guess from the name (which both
  // over- and under-matches the factory naming convention). `.npno` pianos keep
  // their factory default (handled in the pianoLibrary branch above).
  const suspectedFactory = hdr && (codec === 3 || codec === 4) ? hdrFactoryFlag(bytes, hdr) : false;

  return { recognized: true, version, versionRaw, codec, legacy, checksumValid, name, sections, strokeCount, suspectedFactory, warnings };
}

/**
 * A keyboard zone from the `map` section — one entry of the splits/velocity-layer
 * table. The 16-byte single-stroke record is **root-aligned and identical across
 * codec 3 & 4** (one shared layout):
 *
 *   +0 rootKey | +1 keyHigh(NoteExtend_Hi/split) | +2 keyLow(NoteExtend_Lo) |
 *   +3 zoneMode | +4 zonePlayback | +5 zoneIsOneShot | +6 u16 strokeCount(=1) |
 *   +8 u32 globalID | +12 u16 strength(=1) | +14 velMin | +15 velMax
 *
 * `keyHigh`/`keyLow` are the zone's split bounds; `rootKey` the key it's pitched
 * for; `velLow`..`velTop` its velocity range (a layer). `globalID` selects the
 * stroke that plays — matching the stroke's u32 id at `stk` header +0 (NOT a
 * positional index). Verified vs `.nsmpproj` ground truth + real file dumps;
 *. (Multi-stroke zones — strokeCount>1 — exist on the
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
  /** The stroke this zone plays, by the stroke's global id (record u32 @+8 == `stk` header u32 @+0). */
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

/**
 * The 16-byte zone-record field layout — **codec 3 & 4 only** (they share it).
 * Legacy (`NWS`) records are a different shape entirely and are read by
 * {@link parseLegacyZoneRecords} / written by {@link patchLegacyNsmp}; never apply
 * this layout to a legacy file (doing so put codec-3/4 offsets onto a 12-byte v9
 * record and produced a silently broken download — the bug this narrowing prevents).
 */
export function zoneRecordLayout(): ZoneRecordLayout {
  return ZONE_LAYOUT;
}

/**
 * A stroke's global id: the u32 that opens its `stk` header, in every generation. A zone
 * names its stroke by this number. It was read as its low byte alone until 2026-10-13; 13 of
 * 50 local `.nsmp4` samples have ids above 255, and in two of them two strokes share a low
 * byte, so one of the pair could never be reached and the other looked shared.
 */
export function strokeGlobalId(bytes: Uint8Array, payloadOffset: number): number {
  return u32be(bytes, payloadOffset);
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
    globalID: u32be(bytes, e + L.globalID - 3), // the u32 at +8; `L.globalID` is its low byte
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
  bytes: Uint8Array, map: NsmpSection, strokeCount: number, gidSet?: Set<number>,
): NsmpZone[] {
  if (strokeCount <= 0) return [];
  const REC = 16;
  const PER_NOTE = 6 + 128 * 10; // global + 128 ten-byte rows
  const HEADER = 32;             // zone-table header; its last byte is the zone count

  // Records are root-aligned (ZONE_LAYOUT_C4): rootKey@+0, keyHigh@+1, keyLow@+2,
  // globalID@+11, velTop@+15. A real record has all three key bytes ≤127, a global
  // id that names a real stroke, and the "strength=1" marker. That marker moved
  // between codec-4 revisions — the older layout writes `00 01 00` at +12, the newer
  // (`.nsmp4` 4.2, e.g. unison-on libraries) writes `01` at +7 — so accept either.
  // All the fields we read are identical across both; only the marker offset differs.
  const marker = (o: number) =>
    (bytes[o + 12] === 0 && bytes[o + 13] === 1 && bytes[o + 14] === 0) || bytes[o + 7] === 1;
  // The id is the u32 at +8. A file from an early OpenNord has other bytes ahead of its low
  // byte there; when the u32 names no stroke and the low byte does, the low byte is the id.
  const idAt = (o: number) => {
    const full = u32be(bytes, o + 8);
    return !gidSet || gidSet.has(full) || !gidSet.has(bytes[o + 11]) ? full : bytes[o + 11];
  };
  const record = (o: number): NsmpZone => ({ ...readZoneRecord(bytes, o, ZONE_LAYOUT_C4), globalID: idAt(o) });
  const valid = (o: number) =>
    o + REC <= map.endOffset && bytes[o] <= 127 && bytes[o + 1] <= 127 && bytes[o + 2] <= 127 &&
    (gidSet ? gidSet.has(idAt(o)) : idAt(o) >= 1) && marker(o);

  // Preferred path: the table sits at the fixed header offset. Its **trailer length
  // varies** (both 6 B and 2 B observed) — it tracks the `SampleUnison`/random-stroke
  // config, not the instrument — so accept any small trailer and validate the first
  // record is real (guards against false accept).
  const recStart = map.payloadOffset + PER_NOTE + HEADER;
  const count = bytes[recStart - 1];
  const trailer = map.endOffset - (recStart + count * REC);
  if (count >= 1 && trailer >= 0 && trailer <= 8 && valid(recStart)) {
    const zones: NsmpZone[] = [];
    for (let i = 0; i < count; i++) zones.push(record(recStart + i * REC));
    return zones;
  }

  // Fallback: the zone-table header (`SampleUnison` block) can be a different size and
  // per-note rows aren't always unity, so the fixed offset can be wrong. Locate the
  // table as the maximal run of valid 16-byte records anywhere after the global block.
  // Zone count need not equal stroke count (a spare stroke may be unmapped). The
  // `keyLow ≤ 127` check in `valid` is what rejects the off-by-a-few-bytes phantom run.
  // Ties break toward the payload end for the same reason as `parseStrokeRefZoneRecords`:
  // a one-zone table scores 1, which stray matches inside the per-note rows also score,
  // and the real table is the last structure in the payload.
  let best = { start: -1, n: 0, trailer: Number.MAX_SAFE_INTEGER };
  for (let p = map.payloadOffset + 6; p + REC <= map.endOffset; p++) {
    let n = 0;
    for (let o = p; valid(o); o += REC) n++;
    if (n === 0) continue;
    const trailer = map.endOffset - (p + n * REC);
    if (n > best.n || (n === best.n && trailer < best.trailer)) best = { start: p, n, trailer };
  }
  if (best.start < 0) return [];
  const zones: NsmpZone[] = [];
  for (let i = 0; i < best.n; i++) zones.push(record(best.start + i * REC));
  return zones;
}

/**
 * Map each stroke's global id (`stk` header u32 @+0) to its root key (`stk` header +5).
 * The stroke header begins `<gid:u32> 00 <root> 88 ba …` across every codec
 * generation — validated against codec-4 ground truth (sine_24 root 57, ramp_24
 * root 24, matching their `.nsmpproj` `m_rootKey`).
 */
function strokeRootByGlobalId(bytes: Uint8Array, sections: NsmpSection[]): Map<number, number> {
  const roots = new Map<number, number>();
  for (const s of sections) {
    if (!s.tag.endsWith('stk')) continue;
    const root = bytes[s.payloadOffset + 5];
    if (root <= 127) roots.set(strokeGlobalId(bytes, s.payloadOffset), root);
  }
  return roots;
}

/**
 * Legacy (`NWS`) analogue of {@link strokeRootByGlobalId}: the OG `stk` header
 * stores the global id as a **u32 BE at +0** (not a u8 at +3), so key by that.
 * Root is at +0x05, same as every generation. Used by the v9 (non-v10 legacy)
 * zone reader, whose map records now carry the full u24 gid.
 */
function legacyStrokeRootByGlobalId(bytes: Uint8Array, sections: NsmpSection[]): Map<number, number> {
  const roots = new Map<number, number>();
  for (const s of sections) {
    if (!s.tag.endsWith('stk')) continue;
    const root = bytes[s.payloadOffset + 5];
    if (root <= 127) roots.set(u32be(bytes, s.payloadOffset), root);
  }
  return roots;
}

/**
 * Read the per-zone splits/layers table from the `map` section. Skips the global
 * + per-note level/detune block (unity entries `10 00 00 00 00 00`), then parses
 * 16-byte zone entries. (Codec-3 `map` form; verified against Strings.nsmp3.)
 */
/** The `map` section's global level (u24) + detune (s24), with a default flag.
 *  Layout per the maintainers’ notes: `[global level/detune]` at the map payload
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

/**
 * Where a legacy `map` (v9, v10) keeps its 128 per-key rows: after the global 6 bytes and 9
 * zero bytes. The zone table follows the rows: a u24 count, then that many records (12
 * bytes in v9, 15 in v10), ending exactly at the section's end in all 29 local legacy
 * samples.
 */
export const LEGACY_MAP_ROWS = 15;
const LEGACY_MAP_TABLE = LEGACY_MAP_ROWS + 128 * 6;

/** The first 6 bytes of the `map`: global level + detune, the same place in every generation. */
export function readGlobalLevelDetuneBytes(bytes: Uint8Array): Uint8Array | null {
  const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'));
  return map && map.payloadOffset + 6 <= map.endOffset ? bytes.slice(map.payloadOffset, map.payloadOffset + 6) : null;
}

/**
 * The 128 per-key level + detune rows of the `map` (6 bytes each; unity is
 * `10 00 00 00 00 00`). They follow the global 6 bytes: codec 3 has 128 × 6 bytes, codec 4
 * 128 × 10 (the row, then 4 more bytes). A legacy `.nsmp` (`map` v9 and v10) has 9 zero
 * bytes before its rows ({@link LEGACY_MAP_ROWS}).
 */
export function readPerNoteRows(bytes: Uint8Array): Uint8Array[] | null {
  const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'));
  if (!map) return null;
  const file = readNsmp(bytes);
  const rowLen = !file.legacy && (file.codec ?? 0) >= 4 ? 10 : 6;
  let first = map.payloadOffset + 6;
  if (file.legacy) {
    // The real layout frames its zone table with a count; a `.nsmp` an older OpenNord wrote
    // has the rows straight after the global bytes and 15-byte records to the end.
    const table = map.payloadOffset + LEGACY_MAP_TABLE;
    const count = table + 3 <= map.endOffset ? u24be(bytes, table) : -1;
    const rec = map.version === 10 ? 15 : 12;
    const len = map.endOffset - map.payloadOffset;
    if (count >= 0 && table + 3 + count * rec === map.endOffset) first = map.payloadOffset + LEGACY_MAP_ROWS;
    else if (!(len >= 6 + 768 && (len - 6 - 768) % 15 === 0)) return null;
  }
  if (first + 128 * rowLen > map.endOffset) return null;
  return Array.from({ length: 128 }, (_, i) => bytes.slice(first + i * rowLen, first + i * rowLen + 6));
}

/** Count per-note rows that differ from unity (`10 00 00 00 00 00`); see {@link readPerNoteRows}. */
export function perNoteCustomCount(bytes: Uint8Array): number {
  const rows = readPerNoteRows(bytes) ?? [];
  return rows.filter((r) => !(r[0] === 0x10 && r[1] === 0 && r[2] === 0 && r[3] === 0 && r[4] === 0 && r[5] === 0)).length;
}

/**
 * The codec-4 `map`'s **SampleUnison / voicing** block — the 31-byte structure
 * between the per-note table and the zone count. Codec 3 has no such block.
 *
 * It does not switch unison on: that is the program's Unison setting (0–3). It holds
 * what each setting does for this sample. Layout as the instrument reads it (Stage 4
 * ARM loader; the maintainers’ notes), which real files confirm (their
 * values come out as round numbers only this way): `mode, topKey`, four u16 BE, three
 * pan bytes, four voice counts, four u24 gains, two flags.
 */
export interface SampleUnison {
  /** 0 = the instrument's built-in detune and pan; 1 = the values below. */
  mode: number;
  /** Highest key that uses neighbouring recordings; above it one recording is doubled. */
  topKey: number;
  /** Detune of Unison 1 / 2 / 3, raw: ± raw·25/65536 semitone (40 ≈ ±1.5 cents). */
  detuneMax: number; detuneMax2: number; detuneMax3: number;
  /** Detune (same scale) used at Unison 1 when both voices play the same recording. */
  sameDetuneMin: number;
  /** Stereo width of Unison 1 / 2 / 3: 0 = both voices centred, 100 = hard left/right. */
  panMax: number; panMax2: number; panMax3: number;
  numVoice1: number; numVoice2: number; numVoice3: number; numVoiceSame: number;
  /** Per-tier voice gains in dB (`DSP2Level`). */
  gainDb1: number; gainDb2: number; gainDb3: number; gainDbSame: number;
  /** Non-zero: repeated notes step through neighbouring recordings. */
  randomStrokeMode: number; blockRandomSustPed: number;
  /** True when the sample carries its own unison values (`mode !== 0`). */
  custom: boolean;
}

/** Default block as our writer stores it: built-in voicing, 2 voices per tier, unity gain. */
export const DEFAULT_SAMPLE_UNISON: Readonly<SampleUnison> = {
  mode: 0, topKey: 0, detuneMax: 0, detuneMax2: 0, detuneMax3: 0, sameDetuneMin: 0,
  panMax: 0, panMax2: 0, panMax3: 0,
  numVoice1: 2, numVoice2: 2, numVoice3: 2, numVoiceSame: 2,
  gainDb1: 0, gainDb2: 0, gainDb3: 0, gainDbSame: 0,
  randomStrokeMode: 0, blockRandomSustPed: 0, custom: false,
};

/** Offset of the codec-4 `map`'s per-note table (128 rows of 10 bytes), or null. */
function codec4PerNoteOffset(bytes: Uint8Array): { rows: number; end: number } | null {
  if ((readNsmp(bytes).codec ?? 0) < 4) return null;
  const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'));
  return map ? { rows: map.payloadOffset + 6, end: map.endOffset } : null;
}

/**
 * Read the codec-4 `map` SampleUnison block. Returns null for codec 3 / no map /
 * a block that runs past the section.
 */
export function readSampleUnison(bytes: Uint8Array): SampleUnison | null {
  const at = codec4PerNoteOffset(bytes);
  if (!at) return null;
  const o = at.rows + 128 * 10; // after the per-note rows
  if (o + 31 > at.end) return null;
  const mode = bytes[o];
  return {
    mode, topKey: bytes[o + 1],
    detuneMax: u16be(bytes, o + 2), detuneMax2: u16be(bytes, o + 4), detuneMax3: u16be(bytes, o + 6),
    sameDetuneMin: u16be(bytes, o + 8),
    panMax: bytes[o + 10], panMax2: bytes[o + 11], panMax3: bytes[o + 12],
    numVoice1: bytes[o + 13], numVoice2: bytes[o + 14], numVoice3: bytes[o + 15], numVoiceSame: bytes[o + 16],
    gainDb1: dsp2Level(u24be(bytes, o + 17)), gainDb2: dsp2Level(u24be(bytes, o + 20)),
    gainDb3: dsp2Level(u24be(bytes, o + 23)), gainDbSame: dsp2Level(u24be(bytes, o + 26)),
    randomStrokeMode: bytes[o + 29], blockRandomSustPed: bytes[o + 30],
    custom: mode !== 0,
  };
}

/** The neighbouring keys whose recordings a key may borrow. */
export interface NoteAlternates {
  /** For unison: up to two other keys whose recordings sound alongside this key's own. */
  unison: number[];
  /** For repeated notes: the subset of {@link unison} a repeat may play instead. */
  random: number[];
}

/** A raw unison detune value in cents: raw·25 pitch units, a unit being 1/65536 of a
 *  semitone. */
export function unisonDetuneRawToCents(raw: number): number {
  return (raw * 25 * 100) / 65536;
}

/**
 * Per-key alternate recordings from the codec-4 per-note rows: each row ends in four
 * key bytes `b0..b3`. `b0`/`b1` name the alternates (a byte equal to the key itself
 * means none); `b2`/`b3` repeat the ones that repeated notes may also use — both, the
 * first only, or neither (Stage 4 loader; the maintainers’ notes).
 * Null for codec 3, and when the file marks the table unused (`0xFF` on key 0).
 */
export function readNoteAlternates(bytes: Uint8Array): NoteAlternates[] | null {
  const at = codec4PerNoteOffset(bytes);
  if (!at || at.rows + 128 * 10 > at.end || bytes[at.rows + 6] === 0xff) return null;
  return Array.from({ length: 128 }, (_, key) => {
    const [b0, b1, b2, b3] = bytes.subarray(at.rows + key * 10 + 6, at.rows + key * 10 + 10);
    const unison = [b0, b1].filter((k) => k !== key && k < 128);
    const first = b2 === b0, second = b3 === b1;
    const random = first && second ? unison : (first || second) && unison.length === 2 ? [first ? b0 : b1] : [];
    return { unison, random };
  });
}

/** Tru-Vibrato state from the codec-4 `.sty` (style) section. */
export interface TruVibrato {
  on: boolean;
  /** The 9 raw parameter bytes (3 groups of 3); per-byte meaning not yet pinned. */
  params: number[];
}

/**
 * Read Tru-Vibrato from the `.sty` section. Tru-Vibrato is a **codec-4.2** style
 * feature: the 4.2 layout stores a `flag + 9-byte block` in the trailing 13 bytes
 * of a 108-byte `.sty` (the older 4.1 layout is 92 bytes and carries no vibrato).
 * We only report it for that validated layout — off/on was proven against the
 * Spitfire String Quintet corpus (bowed = on, pizzicato/spiccato = off). The
 * `.sty` section is the sample's embedded style preset
 * block; the individual param scales aren't pinned yet.
 */
export function readTruVibrato(bytes: Uint8Array): TruVibrato | null {
  if ((readNsmp(bytes).codec ?? 0) < 4) return null;
  const sty = parseNsmpSections(bytes).find((s) => s.tag.endsWith('sty'));
  if (!sty) return null;
  const len = sty.endOffset - sty.payloadOffset;
  if (len !== 108) return null; // only the 4.2 style layout carries the vibrato block
  const o = sty.payloadOffset + 95; // flag byte, then the 9-byte block
  const flag = bytes[o];
  if (flag !== 0 && flag !== 1) return null; // not the expected flag → don't guess
  return { on: flag === 1, params: [...bytes.slice(o + 1, o + 10)] };
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
    // Codec-2 / NSMP-2 revision B (Library 2.0) uses `map` version 10 — a 15-byte
    // record table distinct from v8's (version 9) legacy 12-byte records. Route it
    // to the dedicated parser; the v8 path below would yield garbage.
    if (map.version === 10) {
      return parseCodec2ZoneRecords(bytes, map, strokeRootByGlobalId(bytes, sections));
    }
    const strokeCount = sections.filter((s) => s.tag.endsWith('stk')).length;
    // The OG `map` record carries no root key at all — the byte we'd read there is the
    // high byte of its `u24` level (0x10 at unity, hence the "root ≈ 16" the OG corpus
    // shows). The real per-zone root lives in the `stk` header (+5), keyed by global
    // id, exactly as NSE reads it (CSectionStroke). Codec 3/4 keep their map-record
    // root, which is correct for NSE-authored files and round-trips edits. The v9 map
    // record now carries the full u24 gid, so key the root lookup on the header's u32
    // (not the u8 `+3` read codec 3/4 use) — see legacyStrokeRootByGlobalId.
    const roots = legacyStrokeRootByGlobalId(bytes, sections);
    const zones = parseLegacyZoneRecords(
      bytes, map.payloadOffset, map.endOffset, strokeCount, new Set(roots.keys()),
    );
    return zones.map((z) => ({ ...z, rootKey: roots.get(z.globalID) ?? z.rootKey }));
  }

  // Codec-4 (`.nsmp4`, map section version 21) widens the per-note block to
  // 10-byte rows, so the codec-3 6-byte unity-skip below misaligns and yields
  // garbage zones. Parse it with the dedicated codec-4 reader.
  if (map.version >= 21) {
    const stk = sections.filter((s) => s.tag.endsWith('stk'));
    const gidSet = new Set(stk.map((s) => strokeGlobalId(bytes, s.payloadOffset)));
    return parseCodec4ZoneRecords(bytes, map, stk.length, gidSet);
  }

  // Codec-3 format-0 / Library-3.0 `.nsmp3` (`map` version 12) uses an 11-byte
  // stroke-reference record, distinct from the v13/v14 16-byte form below. Route it
  // to the dedicated reader (the v14 parser would misread it as garbage zones).
  if (map.version === 12) {
    return parseCodec3V12ZoneRecords(bytes, map, strokeRootByGlobalId(bytes, sections));
  }

  // Codec-3 `map`: [6B global][128 × 6B per-note level/detune][1B zone count][N × 16B
  // records][1B pad]. The per-note block is a fixed 128 rows (rows run
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
 * OG/legacy (.nsmp, `map` version 9) zone table, reverse-engineered from real files.
 * After the per-note level block the `map` ends with `[count:u16]` then `count`
 * **flush** 12-byte records, no leading padding:
 *   [gid:u24 BE][level:u24 BE][keyHigh:u32 BE][strength:u16 BE]
 * `recordOffset` points at the record start (the `gid`'s first byte); the records
 * sit at `count + 12i`. `keyHigh` is the zone's top key (split point); velocity isn't
 * per-zone (single layer → 127). `strength` is the same field the codec-3/4 record
 * carries at +12 (`SetStrength`) and is **1** in all known content — it's the
 * per-record marker we anchor on.
 *
 * This is a **stroke-reference** table, the same family as v10/v12
 * ({@link parseStrokeRefZoneRecords}): it names a stroke by global id and stores a
 * split point, and everything else is derived. There is **no `rootKey` and no
 * `keyLow` slot** — `keyLow` tiles top-down from the next zone's split point, and
 * the root rides the `stk` header (+5), which is where {@link readNsmpZones} takes
 * it from — keyed by the full u24 gid via {@link legacyStrokeRootByGlobalId}, since
 * the OG `stk` header stores the gid as a u32 at +0, not a u8 at +3.
 *
 * `gid` was previously misread as a single low byte at `+0`, with the record framed
 * as `[X:u16][gid:u8][level:u24][keyHigh:u32][strength:u16]` — an "un-identified u16
 * X" leading every record. That `X` is not padding: it is the gid's own **high two
 * bytes**. The RedLib fixture makes this unambiguous — record 0 is
 * `00 02 a1 | 2d 18 18 | 00 00 00 6c | 00 01`: `00 02 a1` is gid **673** (u24 BE),
 * matching the `stk` header's u32 gid `00 00 02 a1` exactly; the old reader took only
 * the low byte (`a1` = 161) and called `00 02` an unidentified marker. Reframing on
 * the true `[gid:u24]` fixes the latent desync in `writeOgMap` for gids > 255 (it
 * wrote only the low byte) and makes `NsmpZone.globalID` for v9 zones the real
 * catalog id, not a truncation.
 *
 * `[+3..+5]` is a `u24` **`DSP2Level` gain**, not a root+tune: unity is `10 00 00`
 * (= `level2DSP(0)`), and the Stage-2 RedLib corpus carries real per-zone trims
 * (`2d 18 18` = +9.00 dB exactly — a hand-dialed value). Reading its high byte as
 * `keyLow` produced overlapping zones.
 *
 * `gidSet` (the strokes' global ids) pins the table to records naming real strokes,
 * the same guard `parseCodec2/3/4ZoneRecords` use; omitted → the check is skipped.
 */
export function parseLegacyZoneRecords(
  bytes: Uint8Array, searchStart: number, searchEnd: number, count: number, gidSet?: Set<number>,
): NsmpZone[] {
  if (count <= 0) return [];
  const REC = 12;
  const recordsValid = (recStart: number): boolean => {
    for (let i = 0; i < count; i++) {
      const o = recStart + i * REC;
      if (o + REC > bytes.length || u32be(bytes, o + 6) > 127) return false;
      if (u16be(bytes, o + 10) !== 1) return false; // strength — 1 in all known content
      if (gidSet && !gidSet.has(u24be(bytes, o))) return false; // gid is u24 BE @+0
    }
    return true;
  };
  // Scan **backwards**: the record table ends the `map`, so the latest candidate that
  // still fits inside the window is the real one. Forwards-with-first-match was safe
  // only while `count` was large enough to make `[count:u16]` + `count` valid records a
  // near-unique byte pattern; at `count === 1` the very first `00 01` pair in the
  // payload — trivially common inside the per-note level block — was accepted instead,
  // giving a one-zone file a phantom key map (2026-07-28).
  for (let p = searchEnd - 1; p >= searchStart; p--) {
    if (u16be(bytes, p) !== count) continue;
    const recStart = p + 2; // count:u16, then the first record starts immediately (no leading X)
    if (recStart + count * REC > searchEnd) continue; // table lives inside the map
    if (!recordsValid(recStart)) continue;
    const raw = Array.from({ length: count }, (_, i) => {
      const o = recStart + i * REC;
      return { globalID: u24be(bytes, o), keyHigh: u32be(bytes, o + 6), recordOffset: o };
    });
    raw.sort((a, b) => b.keyHigh - a.keyHigh); // top-down, defensive (already file order)
    return raw.map((r, i) => ({
      velTop: 127, velLow: 0,
      keyHigh: r.keyHigh,
      // No bottom-key slot: tile from the next zone down; the last zone runs to 0.
      keyLow: i + 1 < raw.length ? raw[i + 1].keyHigh + 1 : 0,
      // No root slot either — `readNsmpZones` overrides this from the `stk` header.
      rootKey: r.keyHigh,
      zoneMode: 0, zonePlayback: 0, zoneIsOneShot: 0,
      globalID: r.globalID, recordOffset: r.recordOffset,
    }));
  }
  return [];
}

/**
 * Layout of a "stroke-reference" zone record — the family of `map` tables that
 * reference a stroke by global id and store a split point, deriving everything else
 * (keyLow by tiling, rootKey from the `stk` header). Two known members:
 *   - **v10** (codec-2 / Library-2.0 `.nsmp`): 15-byte, `gid@0`, `keyHigh@7`,
 *     signature `[+8]=0x00 [+9]=0x01`.
 *   - **v12** (codec-3 `.nsmp3`, both format-0 and format-1): 11-byte
 *     `00 01 [keyLow] [keyHigh] 00 00 01 00 00 00 [gid]` — `gid@10`, `keyHigh@3`,
 *     signature `[0]=0x00 [1]=0x01 [6]=0x01`. (An earlier RE used `gid@4`/`keyHigh@8`;
 *     that only *coincidentally* validated on a few files — it read the gid off by one
 *     record and landed on a false all-zeros run elsewhere, yielding all-same-root
 *     garbage. `gid@10` is the real field.)
 * Both validated across their corpora (gids match strokes + are distinct, zones tile,
 * roots are musical — the maintainers’ notes).
 */
interface StrokeRefRecSpec {
  rec: number;
  gidOff: number;
  /** Bytes of the id at `gidOff`: 1 (default) or 4. */
  gidBytes?: 1 | 4;
  keyHighOff: number;
  ok: (bytes: Uint8Array, o: number, gidSet: Set<number>) => boolean;
}

/**
 * Generic reader for the stroke-reference `map` families above. Locates the table
 * as the maximal run of valid fixed-size records after the global+per-note block,
 * then derives `keyLow` by top-down tiling and `rootKey` from the `stk` header by
 * global id (no separate count field is relied upon).
 *
 * **Ties break toward the end of the payload.** Run length alone is ambiguous when
 * the true table is short: a one-zone file's real run is length 1, which any
 * accidental record-shaped match also scores — and the scan starts at `+6`, i.e.
 * *inside* the 128-row per-note level/detune block, which is a rich source of them.
 * With a strict `>` the lowest offset won, so a single-zone map could resolve to a
 * phantom zone sitting in the per-note rows (wrong root/`keyHigh`, or no usable key
 * map at all). The zone table is the **last** structure in the `map` payload — only
 * a small pad follows it — so among equal-length runs the one ending nearest
 * `endOffset` is the real one. Multi-zone files are unaffected: a strictly longer
 * run still wins outright, which is every corpus fixture (2026-07-28).
 */
function parseStrokeRefZoneRecords(
  bytes: Uint8Array, map: NsmpSection, rootByGid: Map<number, number>, spec: StrokeRefRecSpec,
): NsmpZone[] {
  const gidSet = new Set(rootByGid.keys());
  const { rec, gidOff, keyHighOff } = spec;
  let best = { start: -1, n: 0, trailer: Number.MAX_SAFE_INTEGER };
  for (let start = map.payloadOffset + 6; start + rec <= map.endOffset; start++) {
    let n = 0;
    for (let o = start; o + rec <= map.endOffset && spec.ok(bytes, o, gidSet); o += rec) n++;
    if (n === 0) continue;
    const trailer = map.endOffset - (start + n * rec);
    if (n > best.n || (n === best.n && trailer < best.trailer)) best = { start, n, trailer };
  }
  if (best.start < 0) return [];
  const raw: { globalID: number; keyHigh: number; recordOffset: number }[] = [];
  for (let i = 0; i < best.n; i++) {
    const o = best.start + i * rec;
    const globalID = spec.gidBytes === 4 ? u32be(bytes, o + gidOff) : bytes[o + gidOff];
    raw.push({ globalID, keyHigh: bytes[o + keyHighOff], recordOffset: o });
  }
  return zonesFromStrokeRefs(raw, rootByGid);
}

/** Zones from `{stroke id, top key}` records: sorted top-down, each reaching down to the next. */
function zonesFromStrokeRefs(
  raw: { globalID: number; keyHigh: number; recordOffset: number }[], rootByGid: Map<number, number>,
): NsmpZone[] {
  raw.sort((a, b) => b.keyHigh - a.keyHigh); // top-down, defensive
  return raw.map((r, i) => ({
    velTop: 127, velLow: 0,
    keyHigh: r.keyHigh,
    keyLow: i + 1 < raw.length ? raw[i + 1].keyHigh + 1 : 0,
    rootKey: rootByGid.get(r.globalID) ?? r.keyHigh,
    zoneMode: 0, zonePlayback: 0, zoneIsOneShot: 0,
    globalID: r.globalID, recordOffset: r.recordOffset,
  }));
}

/** Codec-2 / NSMP-2 rev B (`map` v10) zone table — 15-byte records. */
export function parseCodec2ZoneRecords(
  bytes: Uint8Array, map: NsmpSection, rootByGid: Map<number, number>,
): NsmpZone[] {
  // The table as real files have it: a u24 count after the per-key rows, then 15-byte
  // records `[gid:u24][level:u24][detune:s24][keyHigh:u8][strokes:u16][0 0 0]` to the end
  // of the section. Reading it by its count finds every record; the scan below (kept for
  // maps without that frame, such as those an older OpenNord wrote) takes the id from two
  // bytes further on and so lost the last record of every real file.
  const table = map.payloadOffset + LEGACY_MAP_TABLE;
  const count = table + 3 <= map.endOffset ? u24be(bytes, table) : 0;
  if (count > 0 && table + 3 + count * 15 === map.endOffset) {
    const raw = Array.from({ length: count }, (_, i) => {
      const o = table + 3 + i * 15;
      return { globalID: u24be(bytes, o), keyHigh: bytes[o + 9], recordOffset: o };
    });
    if (raw.every((r) => r.keyHigh <= 127)) return zonesFromStrokeRefs(raw, rootByGid);
  }
  // gid@+0, keyHigh@+7. The "strength" marker varies between codec-2 revisions —
  // most write `00 01` at +8/+9. The Spitfire-era libraries instead carry a per-zone
  // value (detune/gain) at +1..+3: `10 00 00` (unity) OR a real value like `0c db 3e`.
  // The old `+1 == 0x10` check only caught the unity case, so records with a real
  // value truncated the run (e.g. Pizzicato → 8 of 37 zones). The value region is
  // always followed by structural zeros (+4..+6 and +8, +10..+14) — a reliable
  // marker independent of the value. Accept any of the three; the maximal-run +
  // gid-in-set guard rejects phantom alignments regardless.
  return parseStrokeRefZoneRecords(bytes, map, rootByGid, {
    rec: 15, gidOff: 0, keyHighOff: 7,
    ok: (b, o, g) => g.has(b[o]) && b[o + 7] <= 127 && (
      (b[o + 8] === 0 && b[o + 9] === 1) ||
      b[o + 1] === 0x10 ||
      // Structural marker — but require a real keyHigh (≥ 1): all-zero padding
      // trivially satisfies the zero checks and (when a stroke has gid 0) would
      // otherwise form a giant phantom run of identical zeros.
      (b[o + 7] >= 1 && b[o + 4] === 0 && b[o + 5] === 0 && b[o + 6] === 0 && b[o + 8] === 0 &&
       b[o + 10] === 0 && b[o + 11] === 0 && b[o + 12] === 0 && b[o + 13] === 0 && b[o + 14] === 0)
    ),
  });
}

/** Codec-3 (`map` v12, both `.nsmp3` envelope formats) zone table — 11-byte records. */
export function parseCodec3V12ZoneRecords(
  bytes: Uint8Array, map: NsmpSection, rootByGid: Map<number, number>,
): NsmpZone[] {
  // 11-byte records: keyHigh@+3, gid@+10, "strength=1" marker@+6. Earlier readers
  // also required @+1===1, but that byte isn't stable across v12 exports (Spitfire-
  // era libraries leave it 0/varying) — @+6 is the reliable marker, so drop @+1.
  return parseStrokeRefZoneRecords(bytes, map, rootByGid, {
    rec: 11, gidOff: 7, gidBytes: 4, keyHighOff: 3,
    ok: (b, o, g) => b[o] === 0 && b[o + 6] === 1 && b[o + 3] <= 127 && b[o + 3] >= 1 && g.has(u32be(b, o + 7)),
  });
}

/**
 * A stroke's region pointers as the `stk` header stores them: positions in the stroke's
 * **compressed stream**, in stream words (24-bit for the OG layout, 32-bit otherwise),
 * relative to the stroke's start pointer. They are not audio sample positions — the
 * sample DSP jumps its stream reader to them; use
 * {@link strokeLoop} for audio frames.
 */
export interface StrokeRegions {
  /** Alternate start point (the editor's `SecondStart`): where a note starts when the
   *  layer skips the attack. */
  secondStart: number;
  /** Where the loop begins (the editor's `LoopBegin`). */
  loopBegin: number;
  /** End of the stream, and the loop's end. */
  end: number;
  /** True when the stroke loops (`loopBegin` before `end`); false = one-shot. */
  loops: boolean;
  /** Loop-decay field (signed 24-bit at +0x28): −gain·2²³ per envelope update, so
   *  `0x800000` is −1.0 = hold. */
  decayRaw: number;
}

/**
 * The four region pointers of a `stk` header (start @+0x12, second start @+0x1b, loop
 * begin @+0x24, end @+0x2d; u32 BE, cumulative across strokes) and its loop-decay field.
 * The editor writes them from `GetSecondStart`/`GetLoopBegin`/`GetEnd`
 * (`EncodeStrokePhase0`) and forces loop begin = end on a one-shot. Returns null when the
 * pointers aren't monotonic — a guard for any generation whose header offsets we haven't
 * independently pinned, so we never show garbage.
 */
export function readStrokeRegions(bytes: Uint8Array, payloadOffset: number): StrokeRegions | null {
  const u1 = u32be(bytes, payloadOffset + 0x12); // start
  const u2 = u32be(bytes, payloadOffset + 0x1b); // second start
  const u3 = u32be(bytes, payloadOffset + 0x24); // loop begin
  const u4 = u32be(bytes, payloadOffset + 0x2d); // end
  if (!(u1 <= u2 && u2 <= u3 && u3 <= u4)) return null;
  const span = u4 - u1;
  if (span <= 0 || span > (1 << 27)) return null; // implausible → unknown
  const decayRaw = (bytes[payloadOffset + 0x28] << 16) | (bytes[payloadOffset + 0x29] << 8) | bytes[payloadOffset + 0x2a];
  return { secondStart: u2 - u1, loopBegin: u3 - u1, end: span, loops: u3 !== u4, decayRaw };
}

/** Updates per second of the sample DSP's gain envelope — the rate the loop decay is
 *  defined against (the editor's `SMetric::kEnvelopeUpdateRate`). */
export const NSMP_ENVELOPE_RATE = 21700;

/**
 * Loop decay as a rate: dB lost per second inside the loop, 0 = hold. The stored field
 * is −c·2²³ with c the gain multiplier per envelope update (where
 * c = 0.01^(1/(seconds·rate)), i.e. the editor's Decay time is the time to fall 40 dB).
 */
export function loopDecayDbPerSecond(decayRaw: number): number {
  const c = Math.abs(decayRaw >= 0x800000 ? decayRaw - 0x1000000 : decayRaw) / 0x800000;
  if (!(c > 0) || c >= 1) return 0;
  return -20 * Math.log10(c) * NSMP_ENVELOPE_RATE;
}

export interface StrokeLoop {
  /** Loop begin, per-channel frames from the stroke start. */
  loopStart: number;
  /** Loop end, per-channel frames from the stroke start — the end of the stroke's audio. */
  loopEnd: number;
  /** True when the stroke loops; false = one-shot. */
  loops: boolean;
  /** Alternate start point, per-channel frames (0 when it is the normal start). */
  altStart: number;
  /** dB lost per second while playback is inside the loop; 0 = the loop holds its level. */
  decayDbPerSecond: number;
}

/**
 * A stroke's loop in **audio frames**: the header's stream-word regions
 * ({@link readStrokeRegions}) looked up in the decoded stream's segment-opening blocks
 * (`DecodedStroke.marks`). Every region pointer lands on one — the loop-begin block is
 * the one carrying the loop-decay flag. The decoder may enter the stream a few words
 * from the header's start pointer, so positions are anchored on the stream end (the
 * `end` pointer is the stop block). Null when the header is unreadable or a pointer
 * doesn't land on a block (never a guessed position).
 */
export function strokeLoop(regions: StrokeRegions | null, decoded: DecodedStroke, channelCount: number): StrokeLoop | null {
  const last = decoded.marks[decoded.marks.length - 1];
  if (!regions || !last) return null;
  const frames = decoded.channels[0]?.length ?? 0;
  const frameAt = (word: number, shift: number): number | null => {
    const m = decoded.marks.find((x) => x.word === word + shift);
    return m ? Math.floor(m.sample / Math.max(1, channelCount)) : null;
  };
  // One offset for the whole stroke: anchored on the stream end, or failing that the
  // pointers as written (a stream whose last segment-opening block isn't its end).
  const shift = [last.word - regions.end, 0].find((x) => !regions.loops || frameAt(regions.loopBegin, x) !== null);
  if (shift === undefined) return null;
  const loopStart = regions.loops ? frameAt(regions.loopBegin, shift)! : frames;
  // Nothing plays from the alternate start yet, so one that lands on no block is
  // reported as the normal start rather than costing the stroke its loop.
  const altStart = frameAt(regions.secondStart, shift) ?? 0;
  return {
    loopStart, loopEnd: frames, loops: regions.loops && loopStart < frames, altStart,
    decayDbPerSecond: regions.loops ? loopDecayDbPerSecond(regions.decayRaw) : 0,
  };
}

/** Write the second-start (@+0x1b) and loop-begin (@+0x24) pointers, u32 BE, into a
 *  `stk` header in place. Pointers are absolute stream-word positions, cumulative across
 *  strokes — the same frame {@link readStrokeRegions} reads, and each must sit on a
 *  segment-opening block of the stream, so this only moves a region between existing
 *  blocks; it cannot place a loop at an arbitrary audio position. Start (@+0x12) and
 *  end (@+0x2d) are left untouched, so the sample window is preserved. Caller
 *  re-checksums. */
export function patchStrokeLoopBytes(out: Uint8Array, stkPayloadOffset: number, loopInAbs: number, loopOutAbs: number): void {
  const put = (o: number, v: number) => {
    out[o] = (v >>> 24) & 0xff; out[o + 1] = (v >>> 16) & 0xff; out[o + 2] = (v >>> 8) & 0xff; out[o + 3] = v & 0xff;
  };
  put(stkPayloadOffset + 0x1b, loopInAbs >>> 0);
  put(stkPayloadOffset + 0x24, loopOutAbs >>> 0);
}

/**
 * A stroke's stored-PCM replay rate in Hz at 0 cents — the stroke-header pitch base
 * (`0x88ba` = 35002; `nsmp-og.ts` `PITCH_BASE`). It is the rate the decoded PCM is
 * clocked at *when the zone sounds at its root key*, and it carries this same value
 * in every real stroke across generations. It is **not** the keyboard's engine or
 * DAC rate: the engine reads at `strokeRate · 2^((key − root)/12)` — the *stroke's*
 * rate, which a fine-tuned root nudges off 35002 — and converts at 48/96 kHz. So the
 * implied Nyquist bounds what the file stores, not what the instrument emits. What is
 * established is structural (a stroke is one discrete PCM stream, bandlimited to half
 * its own rate); the *numeric* 17501 Hz is conditional on 0x88ba meaning 35002
 * samples/s, which is unverified against hardware (the maintainers’ notes, "Scope — what
 * 35002 Hz is and isn't").
 * Playing or exporting that PCM at any other rate detunes it: the old 44100
 * audition placeholder played it `44100/35002 = 2^(4/12)` = **+4 semitones** sharp
 * (a C sample sounded like E) while the stored root — hence the display note and
 * WAV filename — stayed correct. Used as the fallback when a stroke carries no
 * pitch base (OpenNord-authored codec-3/4 strokes before this field was written).
 */
export const NSMP_SAMPLE_RATE = 0x88ba; // 35002 Hz

/**
 * A stroke's replay sample rate from its `stk` header pitch base — u16 BE at
 * payload `+6` (`… <root> 88 ba …`, the same offset in every generation:
 * `round(2^(cents/1200)·0x88ba)`, so a fine-tuned root nudges it). Falls back to
 * {@link NSMP_SAMPLE_RATE} when the field is absent (0) or outside a plausible
 * audio-rate window — e.g. OpenNord's own writer left it zero before this field.
 */
function strokeSampleRate(bytes: Uint8Array, payloadOffset: number): number {
  const base = u16be(bytes, payloadOffset + 6);
  return base >= 8000 && base <= 96000 ? base : NSMP_SAMPLE_RATE;
}

export interface DecodedStrokeResult extends DecodedStroke {
  /** Index of the source `stk` section. */
  index: number;
  /** Channel count used (decoder de-interleaves by this). */
  channelCount: number;
  /** The stroke's global id (`stk` header u32 @+0) — what a zone's `globalID` references. */
  globalID: number;
  /** Loop window in audio frames, or null when not decodable. */
  loop: StrokeLoop | null;
  /** Replay sample rate in Hz — the stroke-header pitch base ({@link strokeSampleRate}).
   *  Feed this to playback/WAV export so the sample sounds at its stored pitch. */
  sampleRate: number;
}

const BOUND = 1 << 26; // raw 16-bit reconstructions stay well under this

/**
 * Channel count from the stroke header — payload byte 8. Traced via the binary:
 * the byte is the stroke's channel count
 * (the count the decoder
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

/** Blocks a header chain must have before an arbitrary offset is believed to start a stroke. */
const MIN_CHAIN_BLOCKS = 21;
/**
 * The same for an offset that opens with a forced block ({@link opensStroke}): a short
 * stroke whose blocks merge into long runs has few of them (a 13,664-frame note has
 * under 21), and such an opening that also ends on the section's stop is not chance.
 */
const MIN_OPENING_CHAIN_BLOCKS = 3;

/**
 * Cheap structural pre-filter: from `start`, does a contiguous run of valid NW1
 * block headers (3-byte u24 for OG, 4-byte u32 for codec 3) end on a stop sentinel
 * at/near `end`? Shortlists candidate block-stream starts before the costlier full
 * decode + min-peak pick. Wrong byte alignments bail almost immediately.
 */
function streamReachesEnd(bytes: Uint8Array, start: number, end: number, u24: boolean, minBlocks = MIN_CHAIN_BLOCKS): boolean {
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
    if (fo === 0 && bw === 1) return blocks >= minBlocks && Math.abs(o + hb - end) <= tol;
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
 *
 * A stroke opens with a forced block: order 0 with the linear-mode bit set (the encoder's
 * segment-opening block, `planBlocks`). Offsets whose first header is such a block are
 * tried first. Without that, header bytes that happen to parse as a block running into
 * the stream were taken as the start whenever they came first and decoded quietly
 * enough: the bytes at +3 (global id, 0, root key) did so for about one stroke in a
 * hundred of the files `writeCodec2Nsmp` writes, which then decoded to noise, and 7 of
 * 1,558 strokes in real legacy samples got a block of invented frames before their
 * attack. Offsets with any other first header are only tried when no such start is
 * found, and the fixed header fields are never tried ({@link STROKE_FIXED_HEADER}).
 */
function findStrokeStop(bytes: Uint8Array, section: NsmpSection, u24: boolean): { result: DecodedStroke; channelCount: number } | null {
  return findStrokeStopAt(bytes, section, u24, true) ?? findStrokeStopAt(bytes, section, u24, false);
}

/**
 * Bytes of a legacy stroke header that are always header: the fields up to the end
 * pointer at +0x2d (`readStrokeRegions`). The block stream starts after them (+0x33 at
 * the earliest in 1,558 local strokes), so nothing before is tried as its start.
 */
const STROKE_FIXED_HEADER = 0x31;

/** True when the header word at `o` is a forced opening block: order 0, linear mode. */
function opensStroke(bytes: Uint8Array, o: number, u24: boolean): boolean {
  const w = u24 ? u24be(bytes, o) : u32be(bytes, o);
  return ((w >>> 14) & 0xf) === 0 && ((w >>> 23) & 1) === 1;
}

function findStrokeStopAt(
  bytes: Uint8Array, section: NsmpSection, u24: boolean, openingOnly: boolean,
): { result: DecodedStroke; channelCount: number } | null {
  const bounded = bytes.subarray(0, section.endOffset);
  const end = section.endOffset;
  // Use the stroke-header channel count when present (resolves near-silent strokes,
  // where mono/stereo are indistinguishable from audio); else try both, min-peak.
  const hint = strokeChannelHint(bytes, section.payloadOffset);
  const channels = hint ? [hint] : [2, 1];
  let best: { result: DecodedStroke; channelCount: number; peak: number } | null = null;
  for (let start = section.payloadOffset + STROKE_FIXED_HEADER; start < section.payloadOffset + 0x260 && start < end; start++) {
    if (openingOnly && !opensStroke(bytes, start, u24)) continue;
    if (!streamReachesEnd(bytes, start, end, u24, openingOnly ? MIN_OPENING_CHAIN_BLOCKS : MIN_CHAIN_BLOCKS)) continue;
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
 * samples in all three formats (see `nsmp.test.ts`, the maintainers’ notes).
 */
export function decodeNsmp(bytes: Uint8Array): DecodedStrokeResult[] {
  const file = readNsmp(bytes);
  const opts = { wordInterleaved: file.codec === 4, u24: file.legacy };
  const out: DecodedStrokeResult[] = [];
  let index = 0;
  for (const section of file.sections) {
    if (!section.tag.endsWith('stk')) continue;
    const decoded = decodeStrokeSection(bytes, section, opts);
    if (decoded) out.push({
      ...decoded.result, index, channelCount: decoded.channelCount,
      globalID: strokeGlobalId(bytes, section.payloadOffset),
      loop: strokeLoop(readStrokeRegions(bytes, section.payloadOffset), decoded.result, decoded.channelCount),
      sampleRate: strokeSampleRate(bytes, section.payloadOffset),
    });
    index++;
  }
  return out;
}
