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
 * from the 5 Library-2.0 fixtures — see docs/NSMP-CODEC.md.
 *
 * ⚠️ **Experimental / not hardware-validated** (same posture as the v8 writer):
 * the stroke-header region pointers + normalize gain and the `map` per-note block
 * are best-effort — there is no editor that writes a *generated* file to byte-match
 * against. **Audio, name, zones, container + CRC are exact and round-trip through
 * `readNsmp`/`decodeNsmp`/`readNsmpZones`.**
 */
import { encodeStrokeNW1, BLOCK_PER_CH_OG } from './nw1-encode';
import { assembleOgNsmp, type OgSection } from './nsmp-og';

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
}

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
 * `map` (v10): `[6B global level/detune][128 × 6B per-note level/detune]` then the
 * **15-byte** zone records (`globalID@0, 0x10@1, detune-s24@4, keyHigh@7,
 * 0x0001@8`). Global + per-note are written unity; records are generated from the
 * zones. `readNsmpZones`/`parseCodec2ZoneRecords` round-trips this exactly.
 */
function writeCodec2Map(zones: Codec2WriteZone[]): Uint8Array {
  const GLOBAL = 6;
  const PERNOTE = 128 * 6;
  const REC = 15;
  const out = new Uint8Array(GLOBAL + PERNOTE + zones.length * REC);
  putU24(out, 0, UNITY_LEVEL); // global level (unity), detune 0
  for (let i = 0; i < 128; i++) putU24(out, GLOBAL + i * 6, UNITY_LEVEL); // per-note unity
  let o = GLOBAL + PERNOTE;
  // Records, ordered top-down by keyHigh (matches the factory layout + the reader).
  const sorted = [...zones].sort((a, b) => b.keyHigh - a.keyHigh);
  for (const z of sorted) {
    out[o] = z.globalID & 0xff;
    out[o + 1] = 0x10;
    // +4..6 detune s24 = 0; +7 keyHigh; +8..9 = 0x0001 (strokeCount)
    out[o + 7] = z.keyHigh & 0xff;
    out[o + 9] = 0x01;
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

/**
 * The codec-2 60-byte (`0x3c`) stroke header. Same field layout as the OG/codec-1
 * header (globalID, key, pitch, channels, normGain, peak, region pointers U1–U4
 * with `0x80` markers) but binOffset `0x3c` and **no** keyHigh trailer (keyHigh
 * lives in the v10 map). Region pointers are best-effort (content-adaptive).
 */
function writeCodec2StrokeHeader(z: Codec2WriteZone): Uint8Array {
  const ch = z.channels.length;
  const lenPerCh = z.channels[0]?.length ?? 0;
  const segs = (z.segmentsInterleaved ?? []).map((s) => Math.floor(s / Math.max(1, ch)));
  const b = new Uint8Array(CODEC2_BIN_OFFSET);
  putU32(b, 0x00, z.globalID >>> 0);
  b[0x05] = z.rootKey & 0xff;
  putU16(b, 0x06, PITCH_BASE); // cents 0
  b[0x08] = ch & 0xff;
  putU24(b, 0x09, UNITY_NORMGAIN & 0xffffff);
  b[0x0c] = 0x0a;
  putU24(b, 0x0d, pcmPeak(z.channels));
  // Region pointers (per-channel positions): start, secondStart, loopOut, end.
  putU32(b, 0x12, 0); // U1 start
  putU24(b, 0x16, 0x800000); // decay marker
  putU32(b, 0x1b, segs[0] ?? 0); // U2 second-start
  b[0x1f] = 0x80;
  putU32(b, 0x24, segs[1] ?? lenPerCh); // U3 loop-out
  putU24(b, 0x28, 0x800000); // decay marker
  putU32(b, 0x2d, lenPerCh); // U4 end
  // 0x31..0x3b: zero padding to binOffset.
  return b;
}

/** One `stk` payload: 60-byte codec-2 header + the 24-bit NW1 block stream. */
export function writeCodec2StrokePayload(z: Codec2WriteZone): Uint8Array {
  const stream = encodeStrokeNW1(z.channels, {
    u24: true, blockPerCh: BLOCK_PER_CH_OG, segmentsInterleaved: z.segmentsInterleaved,
  });
  const header = writeCodec2StrokeHeader(z);
  const out = new Uint8Array(header.length + stream.length);
  out.set(header, 0);
  out.set(stream, header.length);
  return out;
}

/**
 * Write a complete codec-2 / NSMP-2 rev B (`NWS` v11) `.nsmp` from decoded strokes
 * + zones + name. Section order `NWS → hdr → cat → map → stk×N → sty` + trailing
 * CRC-16, assembled by {@link assembleOgNsmp} with envelope version 200. See the
 * module header for the experimental caveat.
 */
export function writeCodec2Nsmp(opts: { name?: string; zones: Codec2WriteZone[] }): Uint8Array {
  const sections: OgSection[] = [
    { tag: 'NWS', version: 11, payload: new Uint8Array(0) },
    { tag: 'hdr', version: 9, payload: writeCodec2Hdr(opts.name ?? '') },
    { tag: 'cat', version: 5, payload: new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0]) },
    { tag: 'map', version: 10, payload: writeCodec2Map(opts.zones) },
    ...opts.zones.map((z) => ({ tag: 'stk', version: 9, payload: writeCodec2StrokePayload(z) })),
    { tag: 'sty', version: 5, payload: new Uint8Array([0, 0, 0, 1, 1, 1, 0, 0, 0]) },
  ];
  return assembleOgNsmp(sections, 200);
}
