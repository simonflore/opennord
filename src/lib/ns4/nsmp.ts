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
export function readNsmp(bytes: Uint8Array): NsmpFile {
  const warnings: string[] = [];
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
 * table (16 bytes). Layout verified byte-for-byte against `.nsmpproj` ground truth
 * (rootKey/topNote/btmNote) and the matching `stk` headers (globalID), codec 3 & 4:
 *
 *   +0 velTop | +1 rootKey | +2 keyHigh(topNote/split) | +3 keyLow(btmNote)
 *   +4 u32 flag | +8 u32=1 | +12 globalID | +13 `00 01 00` trailer
 *
 * `keyHigh` is the zone's top key (a split point), `keyLow` its bottom; `rootKey`
 * is the key it's pitched for; `velTop` its top velocity (a layer boundary).
 * `globalID` selects the stroke that plays — it matches the stroke's id at `stk`
 * header byte +3 (NOT a positional index). See `docs/NSMP-CODEC.md`.
 */
export interface NsmpZone {
  velTop: number;
  /** Top key — the zone's split point (record +2). */
  keyHigh: number;
  /** Bottom key of the zone (record +3). */
  keyLow: number;
  /** Key the sample is pitched for / plays at unity (record +1). */
  rootKey: number;
  /** The stroke this zone plays, by the stroke's global id (record +12 == `stk` header +3). */
  globalID: number;
  /** Byte offset of this 16-byte record in the file, for in-place edits (0 when unknown). */
  recordOffset: number;
}

/**
 * Field byte-offsets within a 16-byte zone record. The two codec generations frame
 * the record one byte apart (verified vs `.nsmpproj` ground truth): codec-3 records
 * are velTop-first; codec-4 records are root-aligned with velTop trailing at +12+3.
 */
export interface ZoneRecordLayout {
  velTop: number; rootKey: number; keyHigh: number; keyLow: number; globalID: number;
}
export const ZONE_LAYOUT_C3: ZoneRecordLayout = { velTop: 0, rootKey: 1, keyHigh: 2, keyLow: 3, globalID: 12 };
export const ZONE_LAYOUT_C4: ZoneRecordLayout = { rootKey: 0, keyHigh: 1, keyLow: 2, globalID: 11, velTop: 15 };

/** The 16-byte zone-record layout for a file's generation (codec 3 vs 4). */
export function zoneRecordLayout(codec: number | undefined): ZoneRecordLayout {
  return codec === 4 ? ZONE_LAYOUT_C4 : ZONE_LAYOUT_C3;
}

/** Read one 16-byte zone record at byte offset `e` using the given field layout. */
function readZoneRecord(bytes: Uint8Array, e: number, L: ZoneRecordLayout): NsmpZone {
  return {
    velTop: bytes[e + L.velTop],
    rootKey: bytes[e + L.rootKey],
    keyHigh: bytes[e + L.keyHigh],
    keyLow: bytes[e + L.keyLow],
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

  let o = map.payloadOffset + 6; // global level (u24) + detune (s24)
  const isUnity = (p: number) => bytes[p] === 0x10 && bytes[p + 1] === 0 && bytes[p + 2] === 0 &&
    bytes[p + 3] === 0 && bytes[p + 4] === 0 && bytes[p + 5] === 0;
  while (o + 6 <= map.endOffset && isUnity(o)) o += 6; // per-note level/detune block
  const zones: NsmpZone[] = [];
  while (o + 16 <= map.endOffset) {
    zones.push(readZoneRecord(bytes, o, ZONE_LAYOUT_C3));
    o += 16;
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
      zones.push({ velTop: 127, keyHigh, keyLow: bytes[o + 1], rootKey: bytes[o + 1], globalID: bytes[o], recordOffset: o });
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
