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
 * | 0x08 | u8  | 0x02         |
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
  b[0x08] = 0x02;
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

const rU32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const rU24 = (b: Uint8Array, o: number) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];

/** Parse the fixed OG stroke header back into its fields (inverse of the writer). */
export function parseOgStrokeHeader(b: Uint8Array, off = 0): OgStrokeHeaderFields {
  return {
    globalID: rU32(b, off + 0x00),
    keyByte: b[off + 0x05],
    pitchBase: (b[off + 0x06] << 8) | b[off + 0x07], // cents assumed 0 (round-trip)
    cents: 0,
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
