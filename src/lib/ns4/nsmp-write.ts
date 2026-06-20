/**
 * Nord Sample (`.nsmp`) container **writer** — assembles a single-stroke codec-3
 * sample from PCM, so OpenNord can create a `.nsmp` file from a user's own audio.
 *
 * Structure mirrors what `readNsmp` parses (`docs/NSMP-CODEC.md`): the shared
 * `CBIN` envelope + a flat section sequence `NSMP → hdr → cat → map → stk → sty
 * → meta`, each `[tag:u32 BE][version:u32 BE][size:u32 BE][payload]`. The `stk`
 * section carries a stroke header + the {@link encodeStroke} block stream.
 *
 * Validated by **round-trip through our own reader** (`nsmp-write.test.ts`):
 * `decodeNsmp(writeNsmp(pcm))` returns the input PCM. Acceptance *on a real
 * keyboard* additionally needs the exact stroke-header fields (loop points, norm
 * gain, sample length — still being decoded) and the per-zone `map` content;
 * those are templated here and flagged as the remaining work + a hardware test.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own audio only — local sample creation,
 * never factory content.
 */

import { encodeStroke, type EncodeOptions } from './nsmp-encode';
import { patchNs4Checksum } from '../clavia/checksum';

const CBIN_HEADER_SIZE = 0x2c;
const STROKE_HEADER_SIZE = 0xb0; // observed; the block stream begins after it

/** Build one `[tag][version][size][payload]` section (tag NUL-left-padded to 4). */
function section(tag: string, version: number, payload: Uint8Array): Uint8Array {
  const head = new Uint8Array(12 + payload.length);
  const dv = new DataView(head.buffer);
  const t = tag.padStart(4, '\0');
  for (let i = 0; i < 4; i++) head[i] = t.charCodeAt(i);
  dv.setUint32(4, version, false);
  dv.setUint32(8, payload.length, false);
  head.set(payload, 12);
  return head;
}

function asciiPad(s: string, len: number, at = 0): Uint8Array {
  const b = new Uint8Array(len);
  for (let i = 0; i < s.length && at + i < len; i++) b[at + i] = s.charCodeAt(i) & 0x7f;
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/** One sample zone for a multisample: audio + where it sits on the keyboard. */
export interface WriteZone {
  /** Per-channel integer PCM (mono or stereo). */
  channels: ArrayLike<number>[];
  /** Top key of this zone — a split point (keys up to here use this zone). */
  keyHigh: number;
  /** The key this sample is pitched for (unpitched playback note). */
  rootKey: number;
  /** Top velocity of this zone — a layer boundary (1–127). Default 127. */
  velTop?: number;
}

export interface WriteNsmpOptions extends EncodeOptions {
  /** Sample name (stored in the `hdr` section; ASCII, truncated to fit). */
  name: string;
  /** Per-channel integer PCM (mono or stereo). */
  channels: ArrayLike<number>[];
  /** Format generation: 3 → `.nsmp3`, 4 → `.nsmp4` (word-interleaved). Default 3. */
  codec?: 3 | 4;
}

export interface WriteNsmpMultiOptions extends EncodeOptions {
  name: string;
  /** Zones: splits (key ranges) and layers (velocity ranges), each with audio. */
  zones: WriteZone[];
  /** Format generation: 3 → `.nsmp3`, 4 → `.nsmp4` (word-interleaved). Default 3. */
  codec?: 3 | 4;
}

const UNITY = [0x10, 0, 0, 0, 0, 0]; // per-note level 0x100000, detune 0

/**
 * Codec-3 16-byte `map` zone entry (splits/layers table). Real layout, verified
 * against `.nsmpproj` ground truth (see {@link NsmpZone} / `ZONE_LAYOUT_C3`):
 *   +0 velTop | +1 rootKey | +2 keyHigh(top/split) | +3 keyLow(btm) |
 *   +4 u32=1 | +8 u32=1 | +12 globalID | +13 `00 01 00`.
 * We write single-key zones (keyLow = rootKey); `globalID` matches the stroke's
 * own id at `stk` header +3.
 */
function zoneEntryC3(z: WriteZone, globalID: number): Uint8Array {
  const e = new Uint8Array(16);
  e[0] = z.velTop ?? 127; // top velocity (layer)
  e[1] = z.rootKey & 0x7f; // root key (pitched note)
  e[2] = z.keyHigh & 0x7f; // top key (split)
  e[3] = z.rootKey & 0x7f; // bottom key — default to root
  e[4] = 1; // u32 flag = 1
  e[8] = 1; // u32 = 1
  e[12] = globalID & 0xff; // stroke global id
  e[14] = 1; // trailer 00 01 00
  return e;
}

/**
 * Codec-4 16-byte `map` zone entry. The codec-4 record is the codec-3 one with
 * `velTop` rotated from the front (+0) to the tail (+15), shifting the rest down a
 * byte (verified vs `ZONE_LAYOUT_C4` / real `.nsmp4`):
 *   +0 rootKey | +1 keyHigh(top/split) | +2 keyLow(btm) | +3 u32=1 | +7 u32=1 |
 *   +11 globalID | +12 `00 01 00` | +15 velTop.
 */
function zoneEntryC4(z: WriteZone, globalID: number): Uint8Array {
  const e = new Uint8Array(16);
  e[0] = z.rootKey & 0x7f; // root key (pitched note)
  e[1] = z.keyHigh & 0x7f; // top key (split)
  e[2] = z.rootKey & 0x7f; // bottom key — default to root
  e[3] = 1; // u32 flag = 1
  e[7] = 1; // u32 = 1
  e[11] = globalID & 0xff; // stroke global id
  e[13] = 1; // trailer 00 01 00 @+12
  e[15] = z.velTop ?? 127; // top velocity (layer)
  return e;
}

/**
 * Codec-3 `map` payload: `[6B global][128 × 6B per-note unity][N × 16B C3 zone
 * records]`. (Codec-3 `map`, section version 14 — `readNsmpZones` codec-3 path.)
 */
function buildMapPayloadC3(zones: WriteZone[]): Uint8Array {
  const parts: Uint8Array[] = [Uint8Array.from(UNITY)]; // global
  for (let i = 0; i < 128; i++) parts.push(Uint8Array.from(UNITY)); // per-note
  zones.forEach((z, i) => parts.push(zoneEntryC3(z, i + 1)));
  return concat(parts);
}

/**
 * Codec-4 `map` payload, matching the verified codec-4 layout that
 * {@link parseCodec4ZoneRecords} reads (`docs/NSMP-CODEC.md`):
 *   `[6B global][128 × 10B per-note: 6B unity + 4B incrementing note tag]`
 *   `[32B zone-table header, last byte = zone count][N × 16B C4 zone records]`
 *   `[6B trailer 00 00 00 01 00 00]`.
 * Records begin at payload offset `6 + 128*10 + 32 = 1318`; the reader self-checks
 * `recStart + count*16 + 6 == sectionEnd`, which this layout satisfies exactly.
 * (The codec-3 form mis-tagged version 21 read back as zero zones — the bug that
 * made `.nsmp4` conversion lose its splits/layers and become path-dependent.)
 */
function buildMapPayloadC4(zones: WriteZone[]): Uint8Array {
  const parts: Uint8Array[] = [Uint8Array.from(UNITY)]; // global
  for (let n = 0; n < 128; n++) parts.push(Uint8Array.from([...UNITY, n, n, n, n])); // per-note + note tag
  const header = new Uint8Array(32); // zone-table header — only its last byte (count) is read
  header[31] = zones.length & 0xff;
  parts.push(header);
  zones.forEach((z, i) => parts.push(zoneEntryC4(z, i + 1)));
  parts.push(Uint8Array.from([0x00, 0x00, 0x00, 0x01, 0x00, 0x00])); // trailer
  return concat(parts);
}

/** Build the `map` payload in the target generation's verified layout. */
function buildMapPayload(zones: WriteZone[], codec: 3 | 4): Uint8Array {
  return codec === 4 ? buildMapPayloadC4(zones) : buildMapPayloadC3(zones);
}

/**
 * Assemble a **multisample** codec-3 `.nsmp`: one stroke per zone + a `map`
 * placing them across key splits and velocity layers. Round-trips through
 * `readNsmp`/`decodeNsmp`/`readNsmpZones`.
 */
export function writeNsmpMulti(opts: WriteNsmpMultiOptions): Uint8Array {
  const { name, zones } = opts;
  const codec = opts.codec ?? 3;
  return assembleNsmp(name, zones.map((z) => z.channels), buildMapPayload(zones, codec), opts.blockSize, codec);
}

/**
 * Assemble a single-stroke codec-3 `.nsmp` from PCM. Returns the complete file
 * bytes (CRC-32 patched). Round-trips through `readNsmp`/`decodeNsmp`.
 */
export function writeNsmp(opts: WriteNsmpOptions): Uint8Array {
  const { name, channels } = opts;
  const codec = opts.codec ?? 3;
  // single zone across the keyboard, root key C4 (60)
  const mapPayload = buildMapPayload([{ channels, keyHigh: 127, rootKey: 60 }], codec);
  return assembleNsmp(name, [channels], mapPayload, opts.blockSize, codec);
}

/** Assemble the CBIN envelope + sections (one `stk` per stroke) + CRC. */
function assembleNsmp(
  name: string,
  strokes: ArrayLike<number>[][],
  mapPayload: Uint8Array,
  blockSize: number | undefined,
  codec: 3 | 4,
): Uint8Array {
  // Section versions differ by codec generation (observed in real .nsmp3/.nsmp4).
  const v = codec === 4
    ? { file: 400, nsmp: 40, hdr: 11, map: 21, stk: 11, sty: 17 }
    : { file: 300, nsmp: 30, hdr: 10, map: 14, stk: 11, sty: 7 };
  const wordInterleaved = codec === 4; // codec 4 packs channels word-interleaved

  // --- CBIN envelope (0x00–0x2B) — samples: unslotted (bank/loc = 0xFFFFFFFF) ---
  const header = new Uint8Array(CBIN_HEADER_SIZE);
  const hv = new DataView(header.buffer);
  header.set([0x43, 0x42, 0x49, 0x4e], 0x00); // "CBIN"
  header[0x04] = 1; // format type
  header.set([0x6e, 0x73, 0x6d, 0x70], 0x08); // "nsmp"
  hv.setUint32(0x0c, 0xffffffff, false); // bank/loc — not slotted
  header[0x12] = 0x0f; // category byte (templated from real samples)
  hv.setUint16(0x14, v.file, true); // version (3.00 / 4.00) — u16 LE
  // 0x18 CRC-32 patched at the end.

  // --- sections (templated from real samples; see docs/NSMP-CODEC.md) ---
  const nsmp = section('NSMP', v.nsmp, Uint8Array.from([0x00, 0x02, 0x00, 0x0c]));

  const hdrPayload = new Uint8Array(112);
  new DataView(hdrPayload.buffer).setUint16(4, 0x062c, false); // templated marker
  hdrPayload.set(asciiPad(name, 112 - 10, 0).subarray(0, 112 - 10), 10); // name at +10
  const hdr = section('\0hdr', v.hdr, hdrPayload);

  const cat = section('\0cat', 7, Uint8Array.from([0x0f, 0, 0, 0, 0, 0, 0, 0]));
  const map = section('\0map', v.map, mapPayload);

  // One `stk` per stroke: a templated header then the encoded block stream. Byte 8
  // of the stroke header is the channel count (`CSectionStroke::Read` → `SSmpAttributes`
  // → `CSmpStream::GetChannelCnt`), so our reader recovers it without guessing.
  const stks = strokes.map((channels, i) => {
    const header = new Uint8Array(STROKE_HEADER_SIZE);
    header[3] = (i + 1) & 0xff; // global id — matches each zone's globalID (map +12)
    header[8] = channels.length; // 1 = mono, 2 = stereo
    return section('\0stk', v.stk, concat([header, encodeStroke(channels, { blockSize, wordInterleaved })]));
  });

  const sty = section('\0sty', v.sty, Uint8Array.from(
    [0x00, 0x00, 0x7f, 0x1e, 0x2b, 0, 0, 0, 0, 0, 0, 0x01, 0x4a, 0, 0x01, 0, 0x4a, 0, 0, 0x40, 0, 0, 0, 0],
  ));
  const meta = section('meta', 1, Uint8Array.from([0x00, 0x02, 0x00, 0x0e, 0xb2, 0x28, 0, 0, 0, 0, 0, 0]));

  const file = concat([header, nsmp, hdr, cat, map, ...stks, sty, meta]);
  return patchNs4Checksum(file); // CRC-32 over bytes[0x2C:] → 0x18
}
