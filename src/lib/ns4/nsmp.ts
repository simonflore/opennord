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

const BODY_START = 0x2c;

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

/**
 * Walk the section tree. Codec 3/4 only (12-byte headers); older codecs use a
 * 9-byte header (`GetU24`/`GetU16`/`GetU32`) and are not handled here yet.
 */
export function parseNsmpSections(bytes: Uint8Array): NsmpSection[] {
  const sections: NsmpSection[] = [];
  let o = BODY_START;
  while (o + 12 <= bytes.length) {
    const tag = u32be(bytes, o);
    const version = u32be(bytes, o + 4);
    const size = u32be(bytes, o + 8);
    const payloadOffset = o + 12;
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
    return { recognized: false, checksumValid: false, sections: [], strokeCount: 0, suspectedFactory: false, warnings: ['Not a Nord Sample file.'] };
  }
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

  return { recognized: true, version, versionRaw, codec, checksumValid, name, sections, strokeCount, suspectedFactory: looksFactory(name), warnings };
}

export interface DecodedStrokeResult extends DecodedStroke {
  /** Index of the source `stk` section. */
  index: number;
  /** Channel count used (decoder de-interleaves by this). */
  channelCount: number;
}

/**
 * Locate a stroke's block stream within its `stk` payload. The stroke header is
 * variable-length, so the block-stream start is found by the binding constraint:
 * the unique offset whose decode stays bounded and consumes the section exactly
 * (ending on the stop sentinel at the section boundary). Validated against all 8
 * strokes of a real `.nsmp3` (see `nsmp.test.ts`).
 */
function decodeStrokeSection(bytes: Uint8Array, section: NsmpSection): { result: DecodedStroke; channelCount: number } | null {
  const BOUND = 1 << 26; // raw 16-bit reconstructions stay well under this
  for (let hdr = 0x60; hdr <= 0x180; hdr += 4) {
    const start = section.payloadOffset + hdr;
    if (start >= section.endOffset) break;
    for (const channelCount of [2, 1]) {
      let result: DecodedStroke;
      try {
        result = decodeStroke(bytes.subarray(0, section.endOffset), start, channelCount);
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
 * Currently validated for **codec 3** (`.nsmp3`); codec 4 (`.nsmp4`) uses a
 * format variant not yet supported and yields no decoded strokes (see
 * `docs/NSMP-CODEC.md`).
 */
export function decodeNsmp(bytes: Uint8Array): DecodedStrokeResult[] {
  const file = readNsmp(bytes);
  const out: DecodedStrokeResult[] = [];
  let index = 0;
  for (const section of file.sections) {
    if (!section.tag.endsWith('stk')) continue;
    const decoded = decodeStrokeSection(bytes, section);
    if (decoded) out.push({ ...decoded.result, index, channelCount: decoded.channelCount });
    index++;
  }
  return out;
}
