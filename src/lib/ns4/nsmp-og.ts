/**
 * OG (`NWS` / codec-1, Stage-2-era) `.nsmp` stroke-header serializer — the fixed
 * 54-byte field block at the head of each `stk` payload, ported from
 * `Ymer::Codec::NW1::CSectionStroke::Write` (codec-1 path, `@1002f809c`,
 * `GetStrokeBinOffset = 0x60`). The block stream ({@link encodeStrokeNW1} with
 * `{ u24: true }`) follows after a zero-pad that aligns its start.
 *
 * Field map (byte offsets from the `stk` payload start; verified byte-for-byte
 * against the 17 real strokes in `BrassAlesis 2.nsmp` + `TAKE ON ME.nsmp`):
 *
 * | Off  | Sz  | Field        |
 * |------|-----|--------------|
 * | 0x00 | u32 | globalID     |
 * | 0x04 | u8  | 0            |
 * | 0x05 | u8  | keyByte (root/top) |
 * | 0x06 | u16 | pitch base = round(2^(cents/1200)·`PITCH_BASE`) (0x88ba @ cents 0) |
 * | 0x08 | u8  | channelCount (`GetChannelCnt`; 0x02 in every real — all-stereo — stroke) |
 * | 0x09 | u24 | normGain     |
 * | 0x0c | u8  | exponent byte |
 * | 0x0d | u24 | peak (14-bit) |
 * | 0x10 | u16 | 0            |
 * | 0x12 | u32 | U1 = base+start |
 * | 0x16 | u24 | decay A (`80 00 00` = one-shot) |
 * | 0x19 | u16 | 0            |
 * | 0x1b | u32 | U2 = base+loopIn |
 * | 0x1f | u8  | 0x80 marker  |
 * | 0x20 | u32 | 0            |
 * | 0x24 | u32 | U3 = base+loopOut |
 * | 0x28 | u24 | decay B      |
 * | 0x2b | u16 | 0            |
 * | 0x2d | u32 | U4 = base+end |
 * | 0x31 | u16 | 0            |
 * | 0x33 | u8  | keyHigh (zone split) |
 * | 0x34 | u16 | `00 01` trailer |
 *
 * ⚠️ The region pointers U1–U4 and `normGain`/`peak` are in the editor's
 * **internal (resampled) sample domain**; computing them from scratch for a fresh
 * downconvert needs the upstream resample/normalize pipeline (`docs/NSMP-CODEC.md`
 * — not reproduced here). This serializer is exact given those values; it is the
 * write half, validated by round-tripping real OG headers.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own audio only.
 */

/** Fixed stroke-header length before the alignment pad + block stream. */
export const OG_STROKE_HEADER_FIXED = 0x36; // 54 bytes

/** OG stroke `binOffset` (`GetStrokeBinOffset` for codec 1). */
export const OG_STROKE_BIN_OFFSET = 0x60;

/**
 * The pitch/rate base at cents 0 (`(this+0x18)[0]`). Constant across the 17 real
 * strokes (= 0x88ba); `2^(cents/1200)` scales it for a detuned root.
 */
export const PITCH_BASE = 0x88ba;

export interface OgStrokeHeaderFields {
  globalID: number;
  /** Root/top key byte (header +0x05). */
  keyByte: number;
  /** Detune in cents (header +0x06 = round(2^(cents/1200)·base)). Default 0. */
  cents?: number;
  /** Pitch base before detune (default {@link PITCH_BASE}). */
  pitchBase?: number;
  /**
   * Channel count (header +0x08 = `GetChannelCnt`; 1 = mono, 2 = stereo). The
   * decoder reads this byte as its channel hint, so it must match the audio (a
   * mono stroke written as `0x02` decodes back as stereo). Every real OG stroke is
   * stereo (`0x02`); default 2 keeps those byte-identical. Traceable to the shared
   * codec-3/4 stroke-header layout, where +0x08 is the channel count.
   */
  channelCount?: number;
  /** Gain mantissa (header +0x09, u24). */
  normGain: number;
  /** Exponent byte (header +0x0c). */
  expByte: number;
  /** 14-bit peak (header +0x0d, u24). */
  peak: number;
  /** Region pointers (compressed-stream positions): start, loopIn, loopOut, end. */
  u1: number;
  u2: number;
  u3: number;
  u4: number;
  /** Decay fields (u24); `0x800000` (= `80 00 00`) is the one-shot / no-decay marker. */
  decayA?: number;
  decayB?: number;
  /** Zone split — top key (header +0x33). */
  keyHigh: number;
}

const putU32 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 24) & 0xff;
  b[o + 1] = (v >>> 16) & 0xff;
  b[o + 2] = (v >>> 8) & 0xff;
  b[o + 3] = v & 0xff;
};
const putU24 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 16) & 0xff;
  b[o + 1] = (v >>> 8) & 0xff;
  b[o + 2] = v & 0xff;
};
const putU16 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 8) & 0xff;
  b[o + 1] = v & 0xff;
};

/**
 * Serialize the fixed 54-byte OG stroke header (offsets 0x00–0x35). The caller
 * appends the alignment pad + 24-bit block stream. Pure field packing — every
 * value is taken as given (see the domain caveat above).
 */
export function writeOgStrokeHeader(f: OgStrokeHeaderFields): Uint8Array {
  const cents = f.cents ?? 0;
  const base = f.pitchBase ?? PITCH_BASE;
  const pitch = Math.trunc(Math.pow(2, cents / 1200) * base + (cents === 0 ? 0 : 0.5));
  const decayA = f.decayA ?? 0x800000;
  const decayB = f.decayB ?? 0x800000;

  const b = new Uint8Array(OG_STROKE_HEADER_FIXED);
  putU32(b, 0x00, f.globalID >>> 0);
  b[0x04] = 0;
  b[0x05] = f.keyByte & 0xff;
  putU16(b, 0x06, pitch & 0xffff);
  b[0x08] = (f.channelCount ?? 2) & 0xff;
  putU24(b, 0x09, f.normGain & 0xffffff);
  b[0x0c] = f.expByte & 0xff;
  putU24(b, 0x0d, f.peak & 0xffffff);
  // 0x10..0x11 zero
  putU32(b, 0x12, f.u1 >>> 0);
  putU24(b, 0x16, decayA & 0xffffff);
  // 0x19..0x1a zero
  putU32(b, 0x1b, f.u2 >>> 0);
  b[0x1f] = 0x80;
  // 0x20..0x23 zero
  putU32(b, 0x24, f.u3 >>> 0);
  putU24(b, 0x28, decayB & 0xffffff);
  // 0x2b..0x2c zero
  putU32(b, 0x2d, f.u4 >>> 0);
  // 0x31..0x32 zero
  b[0x33] = f.keyHigh & 0xff;
  b[0x34] = 0x00;
  b[0x35] = 0x01;
  return b;
}

/**
 * One OG body section. Tag is the 3-char ASCII id (`NWS`/`hdr`/`map`/`stk`/`sty`);
 * the 9-byte header is `[tag:u24 BE][version:u16 BE][size:u32 BE]`.
 */
export interface OgSection {
  tag: string;
  version: number;
  payload: Uint8Array;
}

/**
 * The OG/`NWS` CBIN envelope (24 bytes): `CBIN`, format 0, `nsmp`, `0xff×8`,
 * versionRaw (LE) = 8, then the body. No CRC field (unlike codec 3/4). Verified
 * byte-for-byte against real OG files.
 */
export function ogEnvelope(versionRaw = 8): Uint8Array {
  const e = new Uint8Array(0x18);
  e.set([0x43, 0x42, 0x49, 0x4e], 0); // "CBIN"
  // 0x04 format type = 0 (OG); 0x08 "nsmp"; 0x0c..0x13 = 0xff×8
  e.set([0x6e, 0x73, 0x6d, 0x70], 8);
  for (let i = 0x0c; i < 0x14; i++) e[i] = 0xff;
  e[0x14] = versionRaw & 0xff;
  e[0x15] = (versionRaw >>> 8) & 0xff;
  return e;
}

/** Serialize one OG section: 9-byte header (`tag` NUL-trimmed to ≤3) + payload. */
function ogSectionBytes(s: OgSection): Uint8Array {
  const tag = s.tag.replace(/^\0+/, '').slice(-3);
  const out = new Uint8Array(9 + s.payload.length);
  for (let i = 0; i < 3; i++) out[i] = tag.charCodeAt(i) & 0xff;
  out[3] = (s.version >>> 8) & 0xff;
  out[4] = s.version & 0xff;
  putU32(out, 5, s.payload.length >>> 0);
  out.set(s.payload, 9);
  return out;
}

/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection/xorout). OG files
 * end with this checksum over the whole preceding file, stored **little-endian**
 * — the OG analogue of codec 3/4's envelope CRC-32. Verified on real OG files.
 */
export function crc16Ccitt(data: Uint8Array): number {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let b = 0; b < 8; b++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc;
}

/**
 * Assemble a complete OG `.nsmp` file: envelope + the ordered body sections
 * (`NWS → hdr → map → stk×N → sty`) + a trailing little-endian CRC-16/CCITT over
 * everything preceding it. Round-trips a real OG file byte-for-byte when fed its
 * parsed sections.
 */
export function assembleOgNsmp(sections: OgSection[], versionRaw = 8): Uint8Array {
  const parts = [ogEnvelope(versionRaw), ...sections.map(ogSectionBytes)];
  const bodyLen = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(bodyLen + 2);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  const crc = crc16Ccitt(out.subarray(0, bodyLen));
  out[bodyLen] = crc & 0xff; // little-endian
  out[bodyLen + 1] = (crc >>> 8) & 0xff;
  return out;
}

import { encodeStrokeNW1, BLOCK_PER_CH_OG } from './nw1-encode';

/** One OG zone/stroke to write: audio + keyboard placement + loop segments. */
export interface OgWriteZone {
  /** Per-channel integer PCM (internal domain — what `decodeStroke` returns). */
  channels: ArrayLike<number>[];
  /** Stroke global id (header +0x00, map record +0). */
  globalID: number;
  /** Root key the sample is pitched for (header +0x05, map record +1). */
  rootKey: number;
  /** Zone top key / split point (map record keyHigh). */
  keyHigh: number;
  /**
   * Segment boundaries (interleaved sample positions) recovered from the source's
   * `lin=1` blocks — drives Phase1 splitting so the block layout matches the
   * source's loop structure. Empty → a single segment.
   */
  segmentsInterleaved?: number[];
}

/** Build the OG legacy `map` payload: global + per-note unity + zone records. */
function writeOgMap(zones: OgWriteZone[]): Uint8Array {
  // 15-byte global prefix + 128 × 6-byte unity rows (`10 00 00 00 00 00`), then
  // [count:u16 BE][00 00] then 12-byte records — matches `parseLegacyZoneRecords`.
  const prefix = new Uint8Array(15);
  prefix[0] = 0x22; prefix[1] = 0x06; prefix[2] = 0x04; // templated global level marker
  const perNote = new Uint8Array(128 * 6);
  for (let i = 0; i < 128; i++) perNote[i * 6] = 0x10;
  const count = new Uint8Array(4);
  putU16(count, 0, zones.length);
  const recs = new Uint8Array(zones.length * 12);
  zones.forEach((z, i) => {
    const o = i * 12;
    recs[o] = z.globalID & 0xff;
    recs[o + 1] = z.rootKey & 0xff;
    // tune u16 @+2 = 0 (no detune); keyHigh u32 BE @+4; trailer `00 01 00 00` @+8
    putU32(recs, o + 4, z.keyHigh >>> 0);
    recs[o + 9] = 0x01;
  });
  const out = new Uint8Array(prefix.length + perNote.length + count.length + recs.length);
  let p = 0;
  for (const part of [prefix, perNote, count, recs]) { out.set(part, p); p += part.length; }
  return out;
}

/** Max abs sample across channels → the stroke's peak (header +0x0d), clamped u24. */
function pcmPeak(channels: ArrayLike<number>[]): number {
  let peak = 0;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > peak) peak = a; }
  return Math.min(peak, 0xffffff);
}

/** Unity normGain (level 0 dB, no global normalize): `(0.5·2^23 · 2^20) >> 23`. */
const OG_UNITY_NORMGAIN = 524288;

/**
 * Build one OG `stk` payload: the 54-byte fixed header + the `12×u24` zero block
 * + the 24-bit block stream. Region pointers/normGain are best-effort (the source
 * stroke's segments drive the stream; exact hardware loop pointers need the source
 * header's loop domain — see docs). Lossless and reader-round-trippable.
 */
export function writeOgStrokePayload(z: OgWriteZone): Uint8Array {
  const stream = encodeStrokeNW1(z.channels, {
    u24: true, blockPerCh: BLOCK_PER_CH_OG, segmentsInterleaved: z.segmentsInterleaved,
  });
  const lenPerCh = z.channels[0]?.length ?? 0;
  const segs = (z.segmentsInterleaved ?? []).map((s) => Math.floor(s / Math.max(1, z.channels.length)));
  const header = writeOgStrokeHeader({
    globalID: z.globalID,
    keyByte: z.rootKey,
    channelCount: z.channels.length,
    normGain: OG_UNITY_NORMGAIN,
    expByte: 0x0a,
    peak: pcmPeak(z.channels),
    // region pointers: start, secondStart, loopOut, end (per-channel) — best-effort.
    u1: 0,
    u2: segs[0] ?? 0,
    u3: segs[1] ?? lenPerCh,
    u4: lenPerCh,
    keyHigh: z.keyHigh,
  });
  // 12×u24 zero block (codec-1) follows the fixed header; no extra align pad needed
  // for our reader (it scans for the stream). Keeps the stream well within range.
  const zeros = new Uint8Array(36);
  const out = new Uint8Array(header.length + zeros.length + stream.length);
  out.set(header, 0);
  out.set(stream, header.length + zeros.length);
  return out;
}

/**
 * Write a complete OG (`NWS`/codec-1, Stage-2-era) `.nsmp` from decoded strokes +
 * zones. Audio is preserved exactly and the file round-trips through
 * `readNsmp`/`decodeNsmp`/`readNsmpZones`. ⚠️ **Experimental / not hardware-
 * validated**: the stroke-header region pointers and normalize gain are best-effort
 * (the editor cannot write OG, so there is no ground truth to byte-match a freshly
 * generated OG file against — only the audio stream + container are validated). See
 * `docs/NSMP-CODEC.md`.
 */
export function writeOgNsmp(opts: { name?: string; zones: OgWriteZone[]; hdrParams?: Uint8Array }): Uint8Array {
  const hdrPayload = new Uint8Array(18);
  if (opts.hdrParams && opts.hdrParams.length === 18) hdrPayload.set(opts.hdrParams);
  else hdrPayload.set([0x00, 0x00, 0xe4, 0x00, 0x00, 0xc0]); // templated params
  const sections: OgSection[] = [
    { tag: 'NWS', version: 8, payload: new Uint8Array(0) },
    { tag: 'hdr', version: 8, payload: hdrPayload },
    { tag: 'map', version: 9, payload: writeOgMap(opts.zones) },
    ...opts.zones.map((z) => ({ tag: 'stk', version: 8, payload: writeOgStrokePayload(z) })),
    { tag: 'sty', version: 5, payload: new Uint8Array(9) },
  ];
  return assembleOgNsmp(sections, 8);
}

const rU32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const rU24 = (b: Uint8Array, o: number) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];

/** Parse the fixed OG stroke header back into its fields (inverse of the writer). */
export function parseOgStrokeHeader(b: Uint8Array, off = 0): OgStrokeHeaderFields {
  return {
    globalID: rU32(b, off + 0x00),
    keyByte: b[off + 0x05],
    pitchBase: (b[off + 0x06] << 8) | b[off + 0x07], // cents assumed 0 (round-trip)
    cents: 0,
    channelCount: b[off + 0x08],
    normGain: rU24(b, off + 0x09),
    expByte: b[off + 0x0c],
    peak: rU24(b, off + 0x0d),
    u1: rU32(b, off + 0x12),
    decayA: rU24(b, off + 0x16),
    u2: rU32(b, off + 0x1b),
    u3: rU32(b, off + 0x24),
    decayB: rU24(b, off + 0x28),
    u4: rU32(b, off + 0x2d),
    keyHigh: b[off + 0x33],
  };
}
