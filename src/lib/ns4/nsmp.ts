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
  const version = `${major}.${String(versionRaw - major * 100).padStart(2, '0')}`;
  const codec = major;
  const checksumValid = verifyNs4Checksum(bytes);
  if (!checksumValid) warnings.push('Sample checksum mismatch — possibly truncated/modified.');

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
 * Read the per-zone splits/layers table from the `map` section. Skips the global
 * + per-note level/detune block (unity entries `10 00 00 00 00 00`), then parses
 * 16-byte zone entries. (Codec-3 `map` form; verified against Strings.nsmp3.)
 */
export function readNsmpZones(bytes: Uint8Array): NsmpZone[] {
  const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'));
  if (!map) return [];
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

export interface DecodedStrokeResult extends DecodedStroke {
  /** Index of the source `stk` section. */
  index: number;
  /** Channel count used (decoder de-interleaves by this). */
  channelCount: number;
}

const BOUND = 1 << 26; // raw 16-bit reconstructions stay well under this

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
  let best: { result: DecodedStroke; channelCount: number; peak: number } | null = null;
  for (let start = section.payloadOffset; start < section.payloadOffset + 0x260 && start < end; start++) {
    if (!streamReachesEnd(bytes, start, end, u24)) continue;
    for (const channelCount of [2, 1]) {
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
  // decode stays bounded and consumes the section (prefer mono — a loud stereo
  // stream decoded as mono diverges past BOUND, so real stereo falls through to 2).
  // NOTE: the true channel count lives in the (still-undecoded) stroke header; this
  // audio heuristic can mislabel *near-silent* strokes, where mono and stereo are
  // indistinguishable from the samples alone (docs/NSMP-CODEC.md).
  const bounded = bytes.subarray(0, section.endOffset);
  for (let hdr = 0x60; hdr <= 0x180; hdr += 4) {
    const start = section.payloadOffset + hdr;
    if (start >= section.endOffset) break;
    for (const channelCount of [1, 2]) {
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
