/**
 * Codec-2 / NSMP-2 **revision B** (Nord Sample Library 2.0) WRITER — `NWS` body
 * version 11, CBIN container version 200. The newer `.nsmp` variant: unlike v8
 * (rev A) it carries the sample **name**, a **category**, and the richer **v10
 * zone map**, so down-converting `.nsmp3`/`.nsmp4` → `.nsmp` keeps the name and
 * splits that v8 silently drops. Requires Library-2.0-capable keyboard firmware.
 *
 * Reuses the shared NW1 stream encoder + the CBIN envelope / 9-byte-section
 * framing / trailing CRC-16 machinery from `nsmp-og.ts`. Format details (envelope
 * v200, NWS v11, hdr v9 12-byte prefix + name, cat v5, map v10 15-byte records,
 * stk v9 60-byte header at binOffset 0x3c, sty v5, trailing LE CRC-16) were RE'd
 * from the 5 Library-2.0 fixtures.
 *
 * ⚠️ **Experimental / not hardware-validated** (same posture as the v8 writer):
 * the stroke-header region pointers + normalize gain and the `map` per-note block
 * are best-effort — there is no editor that writes a *generated* file to byte-match
 * against. **Audio, name, zones, container + CRC are exact and round-trip through
 * `readNsmp`/`decodeNsmp`/`readNsmpZones`.**
 */
import { BLOCK_PER_CH_OG } from './nw1-encode';
import { assembleOgNsmp, type OgSection } from './nsmp-og';
import { encodeCarriedStream, putRegionPointers } from './nsmp-stroke-carry';
import { LEGACY_MAP_ROWS } from './nsmp';
import type { WriteStrokeMeta } from './nsmp-write';

/** `GetStrokeBinOffset` for codec 2 (vs codec-1's 0x60) — block stream start. */
const CODEC2_BIN_OFFSET = 0x3c; // 60 bytes
/** Pitch/rate base at cents 0 (shared with codec 1). */
const PITCH_BASE = 0x88ba;
/** Unity level (2^20) for the map global + per-note rows. */
const UNITY_LEVEL = 0x100000;

const putU32 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 24) & 0xff; b[o + 1] = (v >>> 16) & 0xff; b[o + 2] = (v >>> 8) & 0xff; b[o + 3] = v & 0xff;
};
const putU24 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 16) & 0xff; b[o + 1] = (v >>> 8) & 0xff; b[o + 2] = v & 0xff;
};
const putU16 = (b: Uint8Array, o: number, v: number) => { b[o] = (v >>> 8) & 0xff; b[o + 1] = v & 0xff; };

/** One zone/stroke to write: audio + keyboard placement + loop segments. */
export interface Codec2WriteZone {
  /** Per-channel integer PCM (internal domain — what `decodeStroke` returns). */
  channels: ArrayLike<number>[];
  /** Stroke global id (`stk` header +0, `map` record +0). */
  globalID: number;
  /** Root key the sample is pitched for (`stk` header +5). */
  rootKey: number;
  /** Zone top key / split point (`map` record keyHigh @+7). */
  keyHigh: number;
  /** Segment boundaries (interleaved positions) from the source's loop blocks. */
  segmentsInterleaved?: number[];
  /** What a converted stroke carries over from its source besides the audio. */
  stroke?: WriteStrokeMeta;
}

/** The level/detune values the `map` opens with (6-byte rows as the source has them). */
export interface Codec2MapLevels { global?: Uint8Array; perNote?: Uint8Array[] }

/** `hdr` (v9): a 12-byte constant prefix (RE'd from the corpus) + NUL-padded name. */
const HDR_PREFIX = [0x00, 0x00, 0xdb, 0x00, 0x01, 0x54, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00];
const HDR_SIZE = 111;
function writeCodec2Hdr(name: string): Uint8Array {
  const out = new Uint8Array(HDR_SIZE);
  out.set(HDR_PREFIX, 0);
  const nm = (name ?? '').slice(0, HDR_SIZE - 12 - 1);
  for (let i = 0; i < nm.length; i++) {
    const c = nm.charCodeAt(i);
    out[12 + i] = c >= 0x20 && c < 0x7f ? c : 0x5f; // printable ASCII, else '_'
  }
  return out;
}

/**
 * `map` (v10), laid out as real Library-2.0 samples have it (29 local files, every one
 * ending exactly on its last record): `[6B global level/detune][9 zero bytes]
 * [128 × 6B per-key level/detune][count:u24]` then one 15-byte record a zone:
 * `[gid:u24][level:u24][detune:s24][keyHigh:u8][strokes:u16 = 1][0 0 0]`.
 *
 * Until 2026-10-13 this wrote the rows straight after the global bytes and no count, which
 * our reader's record scan accepted but which puts every per-key row 9 bytes early for
 * anything that reads the real layout.
 */
function writeCodec2Map(zones: Codec2WriteZone[], levels: Codec2MapLevels = {}): Uint8Array {
  const REC = 15;
  const table = LEGACY_MAP_ROWS + 128 * 6;
  const out = new Uint8Array(table + 3 + zones.length * REC);
  const row = (o: number, r: Uint8Array | undefined) => { if (r && r.length >= 6) out.set(r.subarray(0, 6), o); else putU24(out, o, UNITY_LEVEL); };
  row(0, levels.global); // global level (unity), detune 0
  for (let i = 0; i < 128; i++) row(LEGACY_MAP_ROWS + i * 6, levels.perNote?.[i]);
  putU24(out, table, zones.length);
  let o = table + 3;
  // Records, ordered top-down by keyHigh (matches the factory layout + the reader).
  const sorted = [...zones].sort((a, b) => b.keyHigh - a.keyHigh);
  for (const z of sorted) {
    putU24(out, o, z.globalID & 0xffffff);
    putU24(out, o + 3, UNITY_LEVEL); // zone level; detune (+6) 0
    out[o + 9] = z.keyHigh & 0xff;
    out[o + 11] = 0x01; // stroke count
    o += REC;
  }
  return out;
}

/** Max abs sample across channels → the stroke's peak (header +0x0d), clamped u24. */
function pcmPeak(channels: ArrayLike<number>[]): number {
  let peak = 0;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > peak) peak = a; }
  return Math.min(peak, 0xffffff);
}

/** Unity normGain (0 dB, no global normalize). */
const UNITY_NORMGAIN = 524288;

/** A legacy file's body starts after the 0x18-byte envelope; region pointers count from there. */
const LEGACY_BODY = 0x18;

/**
 * One `stk` payload: the stroke header, then the 24-bit NW1 block stream.
 *
 * The header has the layout every generation shares (globalID, key, pitch base, channels,
 * gain bytes, then the four region pointers with their `0x80` markers). The pointers are
 * the positions of segment-opening blocks in 24-bit words from the file body (offset
 * 0x18 here), read off real files: start = first block, second start, loop begin (equal to
 * end on a one-shot), end = the stop block. The loop-begin block carries the loop-decay
 * flag. The stream starts 0x3c bytes in (`GetStrokeBinOffset`), plus up to 2 zero bytes
 * so that it sits on a whole word from the body.
 *
 * `payloadOffset` is where this payload lands in the file.
 */
export function writeCodec2StrokePayload(z: Codec2WriteZone, payloadOffset = LEGACY_BODY): Uint8Array {
  const nCh = z.channels.length;
  const meta = z.stroke ?? {};
  const carried = encodeCarriedStream(
    z.channels, { segmentsInterleaved: meta.segmentsInterleaved ?? z.segmentsInterleaved, loop: meta.loop },
    { u24: true, blockPerCh: BLOCK_PER_CH_OG },
  );

  const pad = (3 - ((payloadOffset - LEGACY_BODY + CODEC2_BIN_OFFSET) % 3)) % 3;
  const b = new Uint8Array(CODEC2_BIN_OFFSET + pad);
  putU32(b, 0x00, z.globalID >>> 0);
  if (meta.headerFields) {
    b.set(meta.headerFields.subarray(0, 14), 0x04);
  } else {
    putU24(b, 0x09, UNITY_NORMGAIN & 0xffffff);
    b[0x0c] = 0x0a;
    putU24(b, 0x0d, pcmPeak(z.channels));
  }
  const pitchBase = meta.pitchBase ?? (meta.headerFields ? undefined : PITCH_BASE); // cents 0
  if (pitchBase !== undefined) putU16(b, 0x06, pitchBase);
  b[0x05] = z.rootKey & 0xff;
  b[0x08] = nCh & 0xff;
  putRegionPointers(b, (payloadOffset - LEGACY_BODY + b.length) / 3, carried, meta.decayRaw);
  const out = new Uint8Array(b.length + carried.stream.length);
  out.set(b, 0);
  out.set(carried.stream, b.length);
  return out;
}

/**
 * Write a complete codec-2 / NSMP-2 rev B (`NWS` v11) `.nsmp` from decoded strokes
 * + zones + name. Section order `NWS → hdr → cat → map → stk×N → sty` + trailing
 * CRC-16, assembled by {@link assembleOgNsmp} with envelope version 200. See the
 * module header for the experimental caveat.
 */
export function writeCodec2Nsmp(opts: { name?: string; zones: Codec2WriteZone[]; levels?: Codec2MapLevels }): Uint8Array {
  const SECTION_HEADER = 9; // [tag:u24][version:u16][size:u32]
  const sections: OgSection[] = [
    { tag: 'NWS', version: 11, payload: new Uint8Array(0) },
    { tag: 'hdr', version: 9, payload: writeCodec2Hdr(opts.name ?? '') },
    { tag: 'cat', version: 5, payload: new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0]) },
    { tag: 'map', version: 10, payload: writeCodec2Map(opts.zones, opts.levels) },
  ];
  // Each stroke's region pointers are absolute, so it is built knowing where it lands.
  let at = LEGACY_BODY + sections.reduce((n, x) => n + SECTION_HEADER + x.payload.length, 0);
  for (const z of opts.zones) {
    const payload = writeCodec2StrokePayload(z, at + SECTION_HEADER);
    sections.push({ tag: 'stk', version: 9, payload });
    at += SECTION_HEADER + payload.length;
  }
  sections.push({ tag: 'sty', version: 5, payload: new Uint8Array([0, 0, 0, 1, 1, 1, 0, 0, 0]) });
  return assembleOgNsmp(sections, 200);
}
