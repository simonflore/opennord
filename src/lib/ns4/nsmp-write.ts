/**
 * Nord Sample (`.nsmp`) container **writer** — assembles a single-stroke codec-3
 * sample from PCM, so OpenNord can create a `.nsmp` file from a user's own audio.
 *
 * Structure mirrors what `readNsmp` parses: the shared
 * `CBIN` envelope + a flat section sequence `NSMP → hdr → cat → map → stk → sty
 * → meta`, each `[tag:u32 BE][version:u32 BE][size:u32 BE][payload]`. The `stk`
 * section carries a stroke header + the editor-exact NW1 block stream (`nw1-encode.ts`).
 *
 * Validated by **round-trip through our own reader** (`nsmp-write.test.ts`):
 * `decodeNsmp(writeNsmp(pcm))` returns the input PCM. Every stroke gets the header a
 * real one has: region pointers (start, second start, loop begin, end), the root key and
 * the default pitch base; a stroke converted from another sample ({@link WriteStrokeMeta})
 * also carries the source's pitch and gain bytes and its loop. A stroke written from PCM
 * alone once had zero region pointers, which crashed Nord Sound Manager 9.03 (hardware
 * test 2026-10-14). Nothing here has played on a keyboard yet.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own audio only — local sample creation,
 * never factory content.
 */

import { encodeCarriedStream, putRegionPointers } from './nsmp-stroke-carry';
import { clampPcm16 } from './nw1-resample';
import { patchNs4Checksum } from '../clavia/checksum';

const CBIN_HEADER_SIZE = 0x2c;

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
  /** Bottom key of this zone. Default: `rootKey`. */
  keyLow?: number;
  /** The key this sample is pitched for (unpitched playback note). */
  rootKey: number;
  /** Top velocity of this zone — a layer boundary (1–127). Default 127. */
  velTop?: number;
  /** Bottom velocity of this zone (velMin). Default 0. */
  velLow?: number;
  /** Zone record bytes +3…+5: zone mode, playback and one-shot. Default: the codec's usual mode, 0, 0. */
  zoneMode?: number;
  zonePlayback?: number;
  zoneIsOneShot?: number;
  /** What a converted stroke carries over from its source besides the audio. */
  stroke?: WriteStrokeMeta;
}

/**
 * The parts of a stroke that are not audio, carried from a source sample. The stroke header
 * has one layout in every generation: bytes
 * +0x04…+0x11 hold the root key, pitch base, channel count and gain values, and the four
 * region pointers at +0x12/+0x1b/+0x24/+0x2d are positions in the compressed stream.
 */
export interface WriteStrokeMeta {
  /** Source header bytes +0x04…+0x11 (14 bytes), written as they are: root key, pitch base
   *  and the gain bytes, which every generation reads alike (the maintainers’ notes, "Gain
   *  bytes"). The channel count (+0x08) always comes from the audio. */
  headerFields?: Uint8Array;
  /** The stroke's pitch base (header +0x06, u16): its tuning. Overrides `headerFields`. */
  pitchBase?: number;
  /** The root key the zone gives this stroke (header +0x05). Overrides `headerFields`. */
  rootKey?: number;
  /** Source header bytes +0x34…+0x5f of a codec-3/4 stroke (editor values, meaning unknown),
   *  written as they are. A legacy source has none. */
  headerTail?: Uint8Array;
  /** Segment boundaries of the source stream (interleaved sample positions): the encoder
   *  opens a segment at each, as the source did. */
  segmentsInterleaved?: number[];
  /** Loop and alternate start, in frames per channel. */
  loop?: { loopStart: number; altStart: number; loops: boolean };
  /** Loop-decay field (header +0x28, 24 bits) as the source has it. */
  decayRaw?: number;
}

export interface WriteNsmpOptions {
  /** Sample name (stored in the `hdr` section; ASCII, truncated to fit). */
  name: string;
  /** Per-channel integer PCM (mono or stereo). */
  channels: ArrayLike<number>[];
  /** Format generation: 3 → `.nsmp3`, 4 → `.nsmp4` (word-interleaved). Default 3. */
  codec?: 3 | 4;
}

export interface WriteNsmpMultiOptions {
  name: string;
  /** Zones: splits (key ranges) and layers (velocity ranges), each with audio. */
  zones: WriteZone[];
  /** Format generation: 3 → `.nsmp3`, 4 → `.nsmp4` (word-interleaved). Default 3. */
  codec?: 3 | 4;
  /** The `map`'s global level and detune (its first 6 bytes) as the source has them. Default unity. */
  globalLevelDetune?: Uint8Array;
  /** Per-key level and detune: 128 rows of 6 bytes, as the source has them. Default unity. */
  perNote?: Uint8Array[];
  /** Codec 4: write zones that share keys and root as one zone with several strokes (velocity
   *  layers), as the editor does. Off by default: a Stage 4 rejected such a file (see
   *  {@link groupLayers}). */
  layeredZones?: boolean;
}

/** The level/detune values a `map` opens with. */
interface MapLevels { global?: Uint8Array; perNote?: Uint8Array[]; layeredZones?: boolean }

const UNITY = [0x10, 0, 0, 0, 0, 0]; // per-note level 0x100000, detune 0

/**
 * The 16-byte `map` zone record — **root-aligned, identical for codec 3 & 4** (the
 * shared zone layout, see {@link NsmpZone} / `ZONE_LAYOUT`):
 *   +0 rootKey | +1 keyHigh(split) | +2 keyLow(btm) | +3 zoneMode |
 *   +6 u16 strokeCount=1 | +8 u32 globalID | +12 u16 strength=1 | +14 velMin | +15 velMax.
 * We write single-stroke zones (keyLow = rootKey unless given); `globalID` matches
 * the stroke's own u32 id at `stk` header +0. `zoneMode` defaults per-codec to the
 * value seen in real files (codec-3 `Strings` = 0, codec-4 `Other` = 1).
 */
/**
 * A zone's top key, capped at 24 semitones above its root. The Sample Editor greys out keys past
 * that (the sample DSP pitches up at most 4×), and none of the 2,861 zones in the local corpus
 * reaches further (the most is exactly 24).
 */
export const MAX_KEYS_ABOVE_ROOT = 24;
const zoneTopKey = (z: WriteZone): number => Math.min(z.keyHigh, z.rootKey + MAX_KEYS_ABOVE_ROOT) & 0x7f;

function zoneEntry(z: WriteZone, globalID: number, zoneMode: number): Uint8Array {
  const e = new Uint8Array(16);
  e[0] = z.rootKey & 0x7f; // root key (pitched note)
  e[1] = zoneTopKey(z); // top key (split)
  e[2] = (z.keyLow ?? z.rootKey) & 0x7f; // bottom key — default to root
  e[3] = (z.zoneMode ?? zoneMode) & 0xff; // per-zone playback mode
  e[4] = (z.zonePlayback ?? 0) & 0xff;
  e[5] = (z.zoneIsOneShot ?? 0) & 0xff;
  e[7] = 1; // u16 strokeCount @+6 = 1
  e[8] = (globalID >>> 24) & 0xff; e[9] = (globalID >>> 16) & 0xff; e[10] = (globalID >>> 8) & 0xff; e[11] = globalID & 0xff; // u32 globalID @+8
  e[13] = 1; // u16 strength @+12 = 1
  e[14] = z.velLow ?? 0; // velMin
  e[15] = z.velTop ?? 127; // velMax (top velocity of the layer)
  return e;
}

/**
 * A codec-4 zone with its strokes, as the editor writes it:
 * an 8-byte head `[root][keyHigh][keyLow][mode][playback][oneShot][strokeCount:u16]`, then
 * per stroke `[id:u32][strength:u16][velMin][velMax]`. Velocity layers are strokes of one
 * zone; written as separate zones over the same keys, a Stage 4 played only the first
 * (hardware test 2026-10-14). With one stroke this is the 16-byte {@link zoneEntry}.
 */
function layeredZoneEntry(g: { zone: WriteZone; strokes: { z: WriteZone; id: number }[] }): Uint8Array {
  const e = new Uint8Array(8 + g.strokes.length * 8);
  const z = g.zone;
  e[0] = z.rootKey & 0x7f; e[1] = zoneTopKey(z); e[2] = (z.keyLow ?? z.rootKey) & 0x7f;
  // Zone mode 0: every one of the 534 zones in the local `.nsmp4` corpus has it. With 1 (an
  // earlier default) a Stage 4 played each zone at its recorded pitch on every key.
  e[3] = (z.zoneMode ?? 0) & 0xff; e[4] = (z.zonePlayback ?? 0) & 0xff; e[5] = (z.zoneIsOneShot ?? 0) & 0xff;
  e[6] = (g.strokes.length >>> 8) & 0xff; e[7] = g.strokes.length & 0xff;
  g.strokes.forEach(({ z: s, id }, j) => {
    const o = 8 + j * 8;
    e[o] = (id >>> 24) & 0xff; e[o + 1] = (id >>> 16) & 0xff; e[o + 2] = (id >>> 8) & 0xff; e[o + 3] = id & 0xff;
    e[o + 5] = 1; // strength (the value every single-stroke zone has; its meaning for layers is not known)
    e[o + 6] = s.velLow ?? 0; e[o + 7] = s.velTop ?? 127;
  });
  return e;
}

/**
 * Zones that share root and key range become one zone with several strokes, in order, when
 * `layered` is set; otherwise one stroke per zone. Stroke ids stay the zones' positions
 * (1-based), matching the `stk` sections. Layered is off by default: a Stage 4 reported
 * "Memory pool is exhausted" on a two-stroke zone, and the Sample Editor never writes one for
 * the Stage 4 (a zone's samples there are alternative takes; only the active one is exported,
 * the maintainers’ notes, third round).
 */
function groupLayers(zones: WriteZone[], layered: boolean): { zone: WriteZone; strokes: { z: WriteZone; id: number }[] }[] {
  if (!layered) return zones.map((z, i) => ({ zone: z, strokes: [{ z, id: i + 1 }] }));
  const groups = new Map<string, { zone: WriteZone; strokes: { z: WriteZone; id: number }[] }>();
  zones.forEach((z, i) => {
    const key = [z.rootKey, z.keyLow ?? z.rootKey, z.keyHigh, z.zoneMode ?? 0, z.zonePlayback ?? 0, z.zoneIsOneShot ?? 0].join(',');
    if (!groups.has(key)) groups.set(key, { zone: z, strokes: [] });
    groups.get(key)!.strokes.push({ z, id: i + 1 });
  });
  for (const g of groups.values()) g.strokes.sort((a, b) => (a.z.velLow ?? 0) - (b.z.velLow ?? 0));
  return [...groups.values()];
}

/**
 * Codec-3 `map` payload: `[6B global][128 × 6B per-note unity][1B zone count]
 * [N × 16B records][1B pad]`. The 1-byte count precedes the records and a 1-byte
 * pad trails them — matching real `.nsmp3` files and the `readNsmpZones` codec-3
 * path. (Codec-3 `map`, section version 14.)
 */
function buildMapPayloadC3(zones: WriteZone[], levels: MapLevels): Uint8Array {
  const parts: Uint8Array[] = [levelRow(levels.global)]; // global
  for (let i = 0; i < 128; i++) parts.push(levelRow(levels.perNote?.[i])); // per-note
  parts.push(Uint8Array.from([zones.length & 0xff])); // zone count
  zones.forEach((z, i) => parts.push(zoneEntry(z, i + 1, 0)));
  parts.push(Uint8Array.from([0])); // trailing pad
  return concat(parts);
}

/**
 * Codec-4 `map` payload, matching the verified codec-4 layout that
 * {@link parseCodec4ZoneRecords} reads:
 *   `[6B global][128 × 10B per-note: 6B unity + 4B incrementing note tag]`
 *   `[32B zone-table header, last byte = zone count][N × 16B C4 zone records]`
 *   `[6B trailer 00 00 00 01 00 00]`.
 * Records begin at payload offset `6 + 128*10 + 32 = 1318`; the reader self-checks
 * `recStart + count*16 + 6 == sectionEnd`, which this layout satisfies exactly.
 * (The codec-3 form mis-tagged version 21 read back as zero zones — the bug that
 * made `.nsmp4` conversion lose its splits/layers and become path-dependent.)
 */
function buildMapPayloadC4(zones: WriteZone[], levels: MapLevels): Uint8Array {
  const parts: Uint8Array[] = [levelRow(levels.global)]; // global
  for (let n = 0; n < 128; n++) parts.push(Uint8Array.from([...levelRow(levels.perNote?.[n]), n, n, n, n])); // per-note + note tag
  const groups = groupLayers(zones, levels.layeredZones ?? false);
  parts.push(defaultUnisonHeader(groups.length)); // 31B SampleUnison block + 1B zone count
  for (const g of groups) parts.push(layeredZoneEntry(g));
  parts.push(Uint8Array.from([0x00, 0x00, 0x00, 0x01, 0x00, 0x00])); // trailer
  return concat(parts);
}

/**
 * The codec-4 `map`'s 31-byte SampleUnison block + 1-byte zone count, written as a
 * real `.nsmp4` stores it *off*: voices = 2 per tier, gains unity (0 dB), no
 * detune/pan spread, no random. (Earlier the writer emitted an all-zero header —
 * 0 voices / −∞ dB gains — an invalid unison config; see `readSampleUnison`.)
 */
function defaultUnisonHeader(count: number): Uint8Array {
  const h = new Uint8Array(32); // bytes default to 0 (mode/topKey/detune/pan/random)
  h[13] = h[14] = h[15] = h[16] = 2; // numVoice 1/2/3/Same
  for (const o of [17, 20, 23, 26]) h[o] = 0x10; // gainX3 1/2/3/Same = unity 0x100000
  h[31] = count & 0xff; // zone count
  return h;
}

/** A 6-byte level + detune row: the given bytes, or unity. */
function levelRow(row: Uint8Array | undefined): Uint8Array {
  return row && row.length >= 6 ? row.slice(0, 6) : Uint8Array.from(UNITY);
}

/** Build the `map` payload in the target generation's verified layout. */
function buildMapPayload(zones: WriteZone[], codec: 3 | 4, levels: MapLevels = {}): Uint8Array {
  return codec === 4 ? buildMapPayloadC4(zones, levels) : buildMapPayloadC3(zones, levels);
}

/**
 * Assemble a **multisample** codec-3 `.nsmp`: one stroke per zone + a `map`
 * placing them across key splits and velocity layers. Round-trips through
 * `readNsmp`/`decodeNsmp`/`readNsmpZones`.
 */
export function writeNsmpMulti(opts: WriteNsmpMultiOptions): Uint8Array {
  const { name, zones } = opts;
  const codec = opts.codec ?? 3;
  const levels = { global: opts.globalLevelDetune, perNote: opts.perNote, layeredZones: opts.layeredZones };
  return assembleNsmp(name, zones.map((z) => z.channels), buildMapPayload(zones, codec, levels), codec, zones.map((z) => ({ rootKey: z.rootKey, ...z.stroke })));
}

/**
 * Assemble a single-stroke codec-3 `.nsmp` from PCM. Returns the complete file
 * bytes (CRC-32 patched). Round-trips through `readNsmp`/`decodeNsmp`.
 */
export function writeNsmp(opts: WriteNsmpOptions): Uint8Array {
  const { name, channels } = opts;
  const codec = opts.codec ?? 3;
  // single zone from the bottom of the keyboard, root key C4 (60), as high as the root allows
  const mapPayload = buildMapPayload([{ channels, keyLow: 0, keyHigh: 127, rootKey: 60 }], codec);
  return assembleNsmp(name, [channels], mapPayload, codec, [{ rootKey: 60 }]);
}

/** Assemble the CBIN envelope + sections (one `stk` per stroke) + CRC. */
function assembleNsmp(
  name: string,
  strokes: ArrayLike<number>[][],
  mapPayload: Uint8Array,
  codec: 3 | 4,
  metas: WriteStrokeMeta[],
): Uint8Array {
  // Section versions differ by codec generation (observed in real .nsmp3/.nsmp4).
  const v = codec === 4
    ? { file: 400, nsmp: 40, hdr: 11, map: 21, stk: 11, sty: 17, nsmpLevel: 0x05 }
    : { file: 300, nsmp: 30, hdr: 10, map: 14, stk: 11, sty: 7, nsmpLevel: 0x0c };
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

  // --- sections (templated from real samples) ---
  // The `NSMP` payload's last byte differs by generation: 0x0c in all 28 local `.nsmp3`, 0x05
  // in all 13 local `.nsmp4`. With 0x0c in a `.nsmp4`, Nord Sound Manager 9.22 lists the
  // sample as "Unsupported version" and asks for a newer OS; 0x05 is accepted (hardware test
  // 2026-10-14, Stage 4). What the byte means is not known.
  const nsmp = section('NSMP', v.nsmp, Uint8Array.from([0x00, 0x02, 0x00, v.nsmpLevel]));

  const hdrPayload = new Uint8Array(112);
  new DataView(hdrPayload.buffer).setUint16(4, 0x062c, false); // templated marker
  hdrPayload.set(asciiPad(name, 112 - 10, 0).subarray(0, 112 - 10), 10); // name at +10
  const hdr = section('\0hdr', v.hdr, hdrPayload);

  const cat = section('\0cat', 7, Uint8Array.from([0x0f, 0, 0, 0, 0, 0, 0, 0]));
  const map = section('\0map', v.map, mapPayload);

  // One `stk` per stroke, every one built the way the editor builds it (`carriedStroke`): its
  // byte-exact encoder, and a header whose region pointers name where the stream starts, loops
  // and stops. Nord Sound Manager decodes a stroke from those pointers; the earlier template
  // left them at zero for a stroke with no loop, and NSM 9.03 crashed reading it
  // (hardware test 2026-10-14). The pointers are absolute
  // stream positions, so each `stk` is built knowing where it lands in the file.
  let at = header.length + nsmp.length + hdr.length + cat.length + map.length;
  const stks = strokes.map((channels, i) => {
    // The codecs store ±32767; out-of-range PCM (a resampler's overshoot on hot audio) would be
    // encoded wrongly and read back without audio, so every caller gets it clamped here.
    const pcm = clampPcm16(channels);
    const stk = section('\0stk', v.stk, carriedStroke(pcm, i + 1, metas[i] ?? {}, wordInterleaved, at + 12));
    at += stk.length;
    return stk;
  });

  const sty = section('\0sty', v.sty, Uint8Array.from(
    [0x00, 0x00, 0x7f, 0x1e, 0x2b, 0, 0, 0, 0, 0, 0, 0x01, 0x4a, 0, 0x01, 0, 0x4a, 0, 0, 0x40, 0, 0, 0, 0],
  ));
  const meta = section('meta', 1, Uint8Array.from([0x00, 0x02, 0x00, 0x0e, 0xb2, 0x28, 0, 0, 0, 0, 0, 0]));

  const file = concat([header, nsmp, hdr, cat, map, ...stks, sty, meta]);
  return patchNs4Checksum(file); // CRC-32 over bytes[0x2C:] → 0x18
}

/** Fixed part of a codec-3/4 stroke header; zero padding follows up to the block stream. */
const STROKE_HEADER_FIXED = 0x60;
/** A stroke's stop block sits on a multiple of this many stream words from the file body. */
const STROKE_END_ALIGN = 32;

const put32 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 24) & 0xff; b[o + 1] = (v >>> 16) & 0xff; b[o + 2] = (v >>> 8) & 0xff; b[o + 3] = v & 0xff;
};

/**
 * Gain bytes (+0x09…+0x11, the maintainers’ notes "Gain bytes") for a stroke with no source to
 * copy them from. No real stroke has a zero gain: across the 1,378 local `.nsmp3`/`.nsmp4`
 * strokes it runs 0.36–1.45 of unity (0x100000). So: unity gain, exponent 10, and the peak
 * field as real strokes most often store it at that exponent, half the loudest sample, signed
 * like it. What the instrument does with the peak is still not known.
 */
function putFreshGain(header: Uint8Array, channels: ArrayLike<number>[]): void {
  let loudest = 0;
  for (const c of channels) for (let i = 0; i < c.length; i++) if (Math.abs(c[i]) > Math.abs(loudest)) loudest = c[i];
  const peak = Math.round(loudest / 2) & 0xffffff;
  header[0x09] = 0x10; header[0x0a] = 0; header[0x0b] = 0; // gain u24 = 0x100000 (unity)
  header[0x0c] = 10; // exponent
  header[0x0d] = (peak >>> 16) & 0xff; header[0x0e] = (peak >>> 8) & 0xff; header[0x0f] = peak & 0xff;
}

/**
 * A `stk` payload for a stroke converted from another sample: the header a real codec-3/4
 * stroke has, then the block stream cut into the source's segments.
 *
 * Read off real files: the four region pointers are
 * the positions of segment-opening blocks, counted in 32-bit words from the file body
 * (file offset 0x2C): start = the first block, second start, loop begin, end = the stop
 * block. Loop begin equals end on a one-shot. The loop-begin block carries the loop-decay
 * flag. The header is 0x60 bytes plus zero padding chosen so the stop block lands on a
 * multiple of 32 words.
 */
function carriedStroke(channels: ArrayLike<number>[], globalID: number, meta: WriteStrokeMeta, wordInterleaved: boolean, payloadOffset: number): Uint8Array {
  const carried = encodeCarriedStream(channels, meta, { wordInterleaved });

  // Pad the header so the stop block is aligned (payloadOffset − 0x2C is a multiple of 4).
  const base = (payloadOffset - CBIN_HEADER_SIZE + STROKE_HEADER_FIXED) / 4;
  const pad = (STROKE_END_ALIGN - ((base + carried.stopWord) % STROKE_END_ALIGN)) % STROKE_END_ALIGN;
  const header = new Uint8Array(STROKE_HEADER_FIXED + pad * 4);

  put32(header, 0, globalID);
  if (meta.headerFields) header.set(meta.headerFields.subarray(0, 14), 0x04);
  else putFreshGain(header, channels);
  const pitchBase = meta.pitchBase ?? (meta.headerFields ? undefined : 0x88ba);
  if (pitchBase !== undefined) { header[6] = (pitchBase >>> 8) & 0xff; header[7] = pitchBase & 0xff; }
  if (meta.rootKey !== undefined) header[5] = meta.rootKey & 0xff;
  header[8] = channels.length;
  putRegionPointers(header, base + pad, carried, meta.decayRaw);
  if (meta.headerTail) header.set(meta.headerTail.subarray(0, STROKE_HEADER_FIXED - 0x34), 0x34);
  else { header[0x3e] = 0x41; header[0x3f] = 0xa0; } // 20.0 as a float: the value every real codec-3/4 stroke has here
  return concat([header, carried.stream]);
}
