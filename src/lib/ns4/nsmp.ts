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

import { hasCbinMagic, fileTypeTag } from './bits';
import { verifyNs4Checksum } from './checksum';
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
 * table (16 bytes). `keyHigh` is the zone's top key (a split point); `velTop` its
 * top velocity (a layer boundary); `strokeIndex` (1-based in the file) selects the
 * sample stroke that plays. Decoded from `CSectionMap::Read` + real files
 * (`docs/NSMP-CODEC.md`).
 */
export interface NsmpZone {
  velTop: number;
  keyHigh: number;
  rootKey: number;
  strokeIndex: number;
}

/**
 * Codec-4 (`.nsmp4`, map section version 21) zone table. The codec-4 `map`
 * widens the per-note level/detune block to **10-byte rows** — a 6-byte unity
 * entry `10 00 00 00 00 00` followed by a 4-byte incrementing note index
 * (`00 00 00 00`, `01 01 01 01`, … `7f 7f 7f 7f`), 128 rows in all — so the
 * codec-3 6-byte unity skip misaligns and over-reads. After the 128 per-note
 * rows there's a short header block, then the **same 16-byte zone entries as
 * codec-3** begin (`velTop`, `keyHigh`@+1, `rootKey`@+3, `strokeIndex`@+12,
 * trailer `00 01 00`@+13). Because that header block has no fixed stride we don't
 * hardcode the offset; instead — mirroring {@link parseLegacyZoneRecords} — we
 * scan past the per-note block for the run of exactly `strokeCount` 16-byte
 * entries whose keys/trailers are all valid. Measured against every real
 * `.nsmp4` fixture: 128 rows → run start at payload offset 1317, count == strokes.
 */
export function parseCodec4ZoneRecords(
  bytes: Uint8Array, map: NsmpSection, strokeCount: number,
): NsmpZone[] {
  if (strokeCount <= 0) return [];
  const REC = 16;
  // Skip the global level (6 bytes) + the 10-byte per-note rows.
  let o = map.payloadOffset + 6;
  const isPerNoteRow = (p: number) => p + 10 <= map.endOffset &&
    bytes[p] === 0x10 && bytes[p + 1] === 0 && bytes[p + 2] === 0 &&
    bytes[p + 3] === 0 && bytes[p + 4] === 0 && bytes[p + 5] === 0;
  while (isPerNoteRow(o)) o += 10;

  const runValid = (start: number): boolean => {
    if (start + strokeCount * REC > map.endOffset) return false;
    for (let i = 0; i < strokeCount; i++) {
      const e = start + i * REC;
      if (bytes[e + 1] > 127 || bytes[e + 12] < 1) return false; // keyHigh / strokeIndex
      if (bytes[e + 13] !== 0 || bytes[e + 14] !== 1 || bytes[e + 15] !== 0) return false; // trailer
    }
    return true;
  };
  for (let p = o; p + strokeCount * REC <= map.endOffset; p++) {
    if (!runValid(p)) continue;
    const zones: NsmpZone[] = [];
    for (let i = 0; i < strokeCount; i++) {
      const e = p + i * REC;
      zones.push({ velTop: bytes[e], keyHigh: bytes[e + 1], rootKey: bytes[e + 3], strokeIndex: bytes[e + 12] });
    }
    return zones;
  }
  return [];
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
    return parseLegacyZoneRecords(bytes, map.payloadOffset, map.endOffset, strokeCount);
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
    zones.push({ velTop: bytes[o], keyHigh: bytes[o + 1], rootKey: bytes[o + 3], strokeIndex: bytes[o + 12] });
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
      zones.push({ velTop: 127, keyHigh: u32be(bytes, o + 4), rootKey: bytes[o + 1], strokeIndex: bytes[o] });
    }
    return zones;
  }
  return [];
}

export interface DecodedStrokeResult extends DecodedStroke {
  /** Index of the source `stk` section. */
  index: number;
  /** Channel count used (decoder de-interleaves by this). */
  channelCount: number;
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
    if (decoded) out.push({ ...decoded.result, index, channelCount: decoded.channelCount });
    index++;
  }
  return out;
}
