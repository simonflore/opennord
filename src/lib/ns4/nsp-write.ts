/**
 * Writing a Nord Piano library (`.npno` / `CNSP`) — the encoder for the piano block codec
 * that `nsp-audio.ts` decodes, plus the container (header tables, stroke directory, the
 * three checksums). OpenNord-only: Nord ships no tool for user pianos.
 *
 * ⚠ HARDWARE-UNTESTED. Every field below is traceable (docs/NPNO-WRITE.md has the full
 * table), the output round-trips through our decoder bit-exactly, and re-encoding a factory
 * piano reproduces its decoded audio sample-for-sample — but no file from this encoder has
 * been loaded on an instrument yet. Several header/record fields are copied as constants
 * from what the factory files show; their meaning is unknown.
 *
 * Use it only for the user's OWN recordings. Re-encoding a factory piano is a local
 * verification step; the result is still Clavia's audio and is never shared (docs/LEGAL.md).
 *
 * Two layers:
 *  - {@link writeNpnoImage} / {@link readNpnoImage}: a lossless, field-complete model of a
 *    CNSP file (header bytes + per-stroke PCM and record bytes). Re-encoding is
 *    `writeNpnoImage(readNpnoImage(bytes))`.
 *  - {@link buildNpno}: a musician-shaped front end (key zones → velocity layers → PCM +
 *    optional sustain loop) that fills an image with documented defaults.
 */

import { crc16ccitt } from '../clavia/crc16';
import { computeNs4Checksum } from '../clavia/checksum';
import { decodeNspStroke, findCnsp, framesPerBlock, readNspDirectory } from './nsp-audio';

// ── Container constants (offsets relative to the `CNSP` tag unless noted) ──────────────────

/** Header bytes before the first stroke record (tables + directory). */
export const NPNO_HEADER_SIZE = 0x732;
export const NPNO_RECORD_SIZE = 0x76;
/** CNSP format codes. 0x464 = the v6 format (Stage 4 / Piano 5 era), 0x450 = v5. */
export const CNSP_V6 = 0x464;
export const CNSP_V5 = 0x450;
/** Block size in 16-bit words per channel (the DSP addresses blocks as n × 511 / n × 1022). */
const BLOCK_WORDS_PER_CHANNEL = 511;
/** The last 64 frames of a block repeat the next block's first 64 (DSP read-ahead slack). */
const BLOCK_OVERLAP = 64;
/** Block level byte = round(20·log10(8192 / block peak)); silent blocks carry 100. */
const LEVEL_REF = 8192;
const LEVEL_SILENT = 100;
/** Every factory stroke peaks at 7782 = 0.95 × 8192 (or whole dB below it). */
export const NPNO_PEAK = 7782;
/** First block offsets ≡ 830 (mod 1022) in all three factory files (stereo: an odd multiple). */
const BLOCK_GRID = 830;
/** Widest residual we emit. Factory files use 1–14; int16 input never needs more than 16. */
const MAX_WIDTH = 16;
/** Binomial predictors by order, newest history sample first (same as the decoder). */
const PREDICTORS: readonly (readonly number[])[] = [[], [1], [2, -1], [3, -3, 1], [4, -6, 4, -1]];

const CBIN_V6_SIZE = 0x2c;
const CBIN_V5_SIZE = 0x18;

// ── The image model ─────────────────────────────────────────────────────────────────────────

/** One stroke (a velocity layer, or a release sound) as the file stores it. */
export interface NpnoStrokeImage {
  /** Root MIDI note of the zone this stroke belongs to (feeds the layers-per-root table). */
  rootNote: number;
  /**
   * PCM per channel. For a looped stroke only frames before `loop.start + loop.length` are
   * used — the encoder appends the loop's continuation itself; anything after is ignored.
   * An unlooped stroke is padded with silence to its last block.
   */
  pcm: ArrayLike<number>[];
  /** The 4 frames before the stroke (predictor seed), per channel, oldest first. */
  preroll: number[][];
  loop?: { start: number; length: number };
  /**
   * The 0x76-byte record. The encoder overwrites the geometry it owns (offset, frames,
   * blocks, history, loop, loop-block fields); every other byte (flags, velocity, level,
   * voicing coefficients…) is written as given.
   */
  record: Uint8Array;
  /**
   * Block level bytes to use instead of measuring them (one per block, in order). The factory
   * encoder measures levels on its pre-rounding signal, so ~0.4% of its blocks differ from ours
   * by 1 dB; `readNpnoImage` keeps the originals so a re-encode is byte-identical. Ignored when
   * the block count differs — drop it after changing the PCM.
   */
  levels?: Uint8Array;
}

export interface NpnoImage {
  /** `v6`: 44-byte CBIN header + CRC-32 (all v6 factory files). `v5`: legacy 24-byte header + CRC-16 trailer. */
  envelope: 'v6' | 'v5';
  /** CBIN version ×100 at 0x14 (e.g. 610 = "6.10"); NSM's piano partition takes 500–699. */
  cbinVersion: number;
  channels: 1 | 2;
  /** CNSP+0x000 … +0x731. The encoder overwrites magic, checksum and the directory. */
  header: Uint8Array;
  strokes: NpnoStrokeImage[];
}

export interface NpnoWriteResult {
  bytes: Uint8Array;
  /** Things the encoder changed or wants the caller to know (e.g. a forced loop seam). */
  notes: string[];
  /** Per-stroke block statistics (for size reports and tests). */
  stats: { blocks: number; frames: number; widths: number[]; orders: number[] }[];
}

// ── Small helpers ───────────────────────────────────────────────────────────────────────────

const be16 = (b: Uint8Array, o: number, v: number) => { b[o] = (v >>> 8) & 0xff; b[o + 1] = v & 0xff; };
const be32 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 24) & 0xff; b[o + 1] = (v >>> 16) & 0xff; b[o + 2] = (v >>> 8) & 0xff; b[o + 3] = v & 0xff;
};
const ascii = (b: Uint8Array, o: number, s: string) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };

/** Bits a signed residual needs (two's complement): 0 and −1 need 1. */
function bitsFor(r: number): number {
  let v = r < 0 ? -r - 1 : r;
  let n = 1;
  while (v > 0) { v = Math.floor(v / 2); n++; }
  return n;
}

/** Block level byte for a block whose own + overlap frames peak at `peak`. */
export function blockLevel(peak: number): number {
  if (peak <= 0) return LEVEL_SILENT;
  return Math.max(0, Math.min(LEVEL_SILENT, Math.round(20 * Math.log10(LEVEL_REF / peak))));
}

// ── The stroke encoder ──────────────────────────────────────────────────────────────────────

interface EncodedStroke {
  data: Uint8Array;
  frames: number;
  blocks: number;
  /** Loop-start block: index, its first frame, and the first frame of the block after it. */
  loopBlock?: { index: number; first: number; next: number };
  widths: number[];
  orders: number[];
  seamForced: boolean;
}

/**
 * Encode one stroke into fixed-size blocks: for each block pick the predictor order (0–4) and
 * the narrowest residual width whose block — its own frames plus the 64 overlap frames —
 * holds every residual. History carries across blocks (the codec is lossless), so a greedy
 * per-block choice is globally consistent.
 */
export function encodeNpnoStroke(s: NpnoStrokeImage, channels: 1 | 2): EncodedStroke {
  const blockWords = BLOCK_WORDS_PER_CHANNEL * channels;
  const pcmLen = s.pcm[0].length;
  const loop = s.loop && s.loop.length > 0 ? s.loop : undefined;
  const loopEnd = loop ? loop.start + loop.length : 0;
  if (loop && (loop.start < 0 || loopEnd > pcmLen)) throw new Error(`loop ${loop.start}+${loop.length} outside the stroke (${pcmLen} frames)`);
  if (pcmLen === 0) throw new Error('empty stroke');
  // The stroke ends at the end of the block holding frame `target - 1`: the loop end itself
  // for looped strokes (factory files always end the block containing the loop end), the
  // last PCM frame otherwise.
  const target = loop ? loopEnd + 1 : pcmLen;
  const maxOwn = framesPerBlock(blockWords, 1, channels);
  const extLen = target + maxOwn + BLOCK_OVERLAP + 1;

  // Signal per channel: 4 preroll frames, then the PCM, then loop continuation / silence.
  const P = 4;
  let seamForced = false;
  const x = Array.from({ length: channels }, (_, c) => {
    const a = new Int32Array(P + extLen);
    for (let k = 0; k < 4; k++) a[k] = s.preroll[c]?.[k] ?? 0;
    const src = s.pcm[c];
    const end = loop ? loopEnd : pcmLen;
    for (let n = 0; n < end; n++) {
      const v = Math.round(src[n]);
      if (v < -32768 || v > 32767) throw new Error(`sample ${v} at frame ${n} is outside int16`);
      a[P + n] = v;
    }
    if (loop) {
      // The DSP jumps from the loop end back to the loop start keeping its predictor history,
      // so the 4 frames before the loop end must equal the 4 before the loop start.
      for (let k = 1; k <= 4; k++) {
        const want = a[P + loop.start - k];
        if (a[P + loopEnd - k] !== want) { a[P + loopEnd - k] = want; seamForced = true; }
      }
      for (let n = loopEnd; n < extLen; n++) a[P + n] = a[P + n - loop.length];
    }
    return a;
  });

  // Residuals per order, and the width each frame needs (max over channels).
  const need = PREDICTORS.map((coef) => {
    const w = new Uint8Array(extLen);
    for (let n = 0; n < extLen; n++) {
      let m = 1;
      for (let c = 0; c < channels; c++) {
        const a = x[c];
        let p = 0;
        for (let k = 0; k < coef.length; k++) p += coef[k] * a[P + n - 1 - k];
        const b = bitsFor(a[P + n] - p);
        if (b > m) m = b;
      }
      w[n] = m;
    }
    return w;
  });

  const blocks: Uint8Array[] = [];
  const levels: number[] = [];
  const starts: number[] = [];
  const widths: number[] = [];
  const orders: number[] = [];
  const runMax = new Uint8Array(maxOwn + BLOCK_OVERLAP);
  let t = 0;
  while (t < target) {
    let best = { order: 0, width: 0 };
    for (let o = 0; o < PREDICTORS.length; o++) {
      const nd = need[o];
      let m = 0;
      for (let k = 0; k < runMax.length; k++) { if (nd[t + k] > m) m = nd[t + k]; runMax[k] = m; }
      for (let w = 1; w <= MAX_WIDTH && (!best.width || w < best.width); w++) {
        const own = framesPerBlock(blockWords, w, channels);
        if (own > 0 && runMax[own + BLOCK_OVERLAP - 1] <= w) { best = { order: o, width: w }; break; }
      }
    }
    if (!best.width) throw new Error(`no residual width ≤ ${MAX_WIDTH} fits the block at frame ${t}`);
    const { order, width } = best;
    const own = framesPerBlock(blockWords, width, channels);
    const span = own + BLOCK_OVERLAP;
    let peak = 0;
    for (let c = 0; c < channels; c++) for (let n = t; n < t + span; n++) peak = Math.max(peak, Math.abs(x[c][P + n]));
    const words = new Uint16Array(blockWords);
    words[0] = width | (order << 5);
    levels.push(blockLevel(peak));
    const coef = PREDICTORS[order];
    const mod = 2 ** width;
    let bit = 0;
    for (let n = t; n < t + span; n++) {
      for (let c = 0; c < channels; c++) {
        const a = x[c];
        let p = 0;
        for (let k = 0; k < coef.length; k++) p += coef[k] * a[P + n - 1 - k];
        let v = ((a[P + n] - p) % mod + mod) % mod; // w-bit two's complement
        for (let got = 0; got < width;) {
          const offs = bit & 15;
          const take = Math.min(16 - offs, width - got);
          words[1 + (bit >> 4)] |= (v & ((1 << take) - 1)) << offs;
          v = Math.floor(v / 2 ** take);
          got += take;
          bit += take;
        }
      }
    }
    const bytes = new Uint8Array(blockWords * 2);
    for (let i = 0; i < blockWords; i++) be16(bytes, i * 2, words[i]);
    blocks.push(bytes);
    starts.push(t);
    widths.push(width);
    orders.push(order);
    t += own;
  }

  const keep = s.levels && s.levels.length === blocks.length ? s.levels : undefined;
  const data = new Uint8Array(blocks.length * blockWords * 2);
  blocks.forEach((b, i) => {
    b[0] = keep ? keep[i] : levels[i]; // level byte = high byte of the big-endian header word
    data.set(b, i * blockWords * 2);
  });
  let loopBlock: EncodedStroke['loopBlock'];
  if (loop) {
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= loop.start) i++;
    loopBlock = { index: i, first: starts[i], next: i + 1 < starts.length ? starts[i + 1] : t };
  }
  return { data, frames: t, blocks: blocks.length, loopBlock, widths, orders, seamForced };
}

// ── The container writer ────────────────────────────────────────────────────────────────────

/** First block offset: the smallest ≥ `end` on the factory files' block grid. */
function firstBlockOffset(end: number, channels: 1 | 2): number {
  const step = BLOCK_WORDS_PER_CHANNEL * 2; // 1022 bytes
  const phase = BLOCK_GRID + (channels === 2 ? step : 0);
  const period = step * channels;
  const k = Math.max(0, Math.ceil((end - phase) / period));
  return phase + k * period;
}

/** Write a CNSP image to a complete `.npno` file. */
export function writeNpnoImage(img: NpnoImage): NpnoWriteResult {
  const { channels, strokes } = img;
  if (channels !== 1 && channels !== 2) throw new Error('channels must be 1 or 2');
  if (img.header.length !== NPNO_HEADER_SIZE) throw new Error(`header must be ${NPNO_HEADER_SIZE} bytes`);
  if (strokes.length === 0 || strokes.length > 0xffff) throw new Error('a piano needs 1–65535 strokes');
  const layers = new Array<number>(128).fill(0);
  let lastRoot = -1;
  for (const s of strokes) {
    if (s.record.length !== NPNO_RECORD_SIZE) throw new Error(`stroke record must be ${NPNO_RECORD_SIZE} bytes`);
    if (s.rootNote < 0 || s.rootNote > 127) throw new Error(`root note ${s.rootNote} out of range`);
    if (s.rootNote < lastRoot) throw new Error('strokes must be grouped by zone, lowest root first');
    if (s.rootNote !== lastRoot && layers[s.rootNote]) throw new Error(`zone ${s.rootNote} is not contiguous`);
    if (s.pcm.length !== channels) throw new Error(`stroke has ${s.pcm.length} channels, piano has ${channels}`);
    layers[s.rootNote]++;
    lastRoot = s.rootNote;
  }

  const notes: string[] = [];
  const encoded = strokes.map((s, i) => {
    const e = encodeNpnoStroke(s, channels);
    if (e.seamForced) notes.push(`stroke ${i}: copied the 4 frames before the loop start over the 4 before the loop end (predictor seam)`);
    return e;
  });

  const recordsEnd = NPNO_HEADER_SIZE + strokes.length * NPNO_RECORD_SIZE;
  const first = firstBlockOffset(recordsEnd, channels);
  const bodyLen = encoded.reduce((a, e) => a + e.data.length, 0);
  const streamLen = first + bodyLen;
  const pre = img.envelope === 'v6' ? CBIN_V6_SIZE : CBIN_V5_SIZE;
  const trailer = img.envelope === 'v6' ? 0 : 2;
  const out = new Uint8Array(pre + streamLen + trailer);
  const cnsp = out.subarray(pre, pre + streamLen);

  // Header: as given, then the fields the encoder owns.
  cnsp.set(img.header, 0);
  ascii(cnsp, 0, 'CNSP');
  const version = (cnsp[4] << 8) | cnsp[5];
  be16(cnsp, 0x61c, version);
  be16(cnsp, 0x61e, channels);
  be16(cnsp, 0x620, strokes.length);
  for (let n = 0; n < 128; n++) be16(cnsp, 0x622 + n * 2, layers[n]);

  let at = first;
  strokes.forEach((s, i) => {
    const e = encoded[i];
    const r = NPNO_HEADER_SIZE + i * NPNO_RECORD_SIZE;
    cnsp.set(s.record, r);
    be32(cnsp, r + 0x00, at);
    be32(cnsp, r + 0x06, e.frames);
    be16(cnsp, r + 0x0a, e.blocks);
    for (let c = 0; c < 2; c++) {
      for (let k = 0; k < 4; k++) be16(cnsp, r + 0x0c + c * 8 + k * 2, c < channels ? (s.preroll[c]?.[k] ?? 0) & 0xffff : 0);
    }
    be32(cnsp, r + 0x1c, s.loop?.length ? s.loop.start : 0);
    be32(cnsp, r + 0x20, s.loop?.length ?? 0);
    be32(cnsp, r + 0x24, e.loopBlock?.first ?? 0);
    be32(cnsp, r + 0x28, e.loopBlock?.next ?? 0);
    be16(cnsp, r + 0x2c, e.loopBlock?.index ?? 0);
    cnsp.set(e.data, at);
    at += e.data.length;
  });

  // CNSP checksum: byte sum of everything after the 22-byte CNSP header
  // (NSM CNSPFileInputStream ctor @0x100040254 → Zevs::Checksum::Get32).
  let sum = 0;
  for (let i = 0x16; i < cnsp.length; i++) sum = (sum + cnsp[i]) >>> 0;
  be32(cnsp, 0x06, sum);

  // CBIN envelope.
  ascii(out, 0, 'CBIN');
  out[4] = img.envelope === 'v6' ? 1 : 0;
  ascii(out, 8, 'npno');
  out.fill(0xff, 0x0c, 0x14);
  out[0x14] = img.cbinVersion & 0xff;
  out[0x15] = (img.cbinVersion >>> 8) & 0xff;
  if (img.envelope === 'v6') {
    const crc = computeNs4Checksum(out); // CRC-32 over bytes[0x2C:], LE at 0x18
    out[0x18] = crc & 0xff; out[0x19] = (crc >>> 8) & 0xff; out[0x1a] = (crc >>> 16) & 0xff; out[0x1b] = (crc >>> 24) & 0xff;
  } else {
    const crc = crc16ccitt(out.subarray(0, out.length - 2)); // legacy LE CRC-16 trailer
    out[out.length - 2] = crc & 0xff;
    out[out.length - 1] = crc >>> 8;
  }
  return {
    bytes: out, notes,
    stats: encoded.map((e) => ({ blocks: e.blocks, frames: e.frames, widths: e.widths, orders: e.orders })),
  };
}

/**
 * Read a `.npno` back into an image: header bytes, every record, and each stroke's decoded
 * PCM (local use only — factory pianos are Clavia's audio). `writeNpnoImage` of the result
 * reproduces the decoded audio exactly.
 */
export function readNpnoImage(bytes: Uint8Array): NpnoImage {
  const base = findCnsp(bytes);
  const dir = readNspDirectory(bytes);
  if (base < 0 || !dir) throw new Error('not a readable CNSP piano');
  const header = bytes.slice(base, base + NPNO_HEADER_SIZE);
  const roots: number[] = [];
  for (let n = 0; n < 128; n++) {
    const c = (bytes[base + 0x622 + n * 2] << 8) | bytes[base + 0x623 + n * 2];
    for (let k = 0; k < c; k++) roots.push(n);
  }
  if (roots.length !== dir.strokes.length) throw new Error('layers-per-root table does not match the stroke count');
  const strokes = dir.strokes.map((s, i) => ({
    rootNote: roots[i],
    pcm: decodeNspStroke(bytes, dir, s),
    preroll: s.history.map((h) => [...h].reverse()),
    loop: s.loop,
    record: bytes.slice(base + NPNO_HEADER_SIZE + i * NPNO_RECORD_SIZE, base + NPNO_HEADER_SIZE + (i + 1) * NPNO_RECORD_SIZE),
    levels: Uint8Array.from({ length: s.blocks }, (_, b) => bytes[s.offset + b * dir.blockWords * 2]),
  }));
  return {
    envelope: base === CBIN_V6_SIZE ? 'v6' : 'v5',
    cbinVersion: bytes[0x14] | (bytes[0x15] << 8),
    channels: dir.channels,
    header,
    strokes,
  };
}

// ── The musician-facing builder ─────────────────────────────────────────────────────────────

/** Piano type byte (CNSP+0x18; NSM `SetBank`/`S_GetMainType`). 1/3/4 seen in factory files. */
export const NPNO_PIANO_TYPE = {
  /** 1 — seen on Electric Grand 1 CP80. */
  grand: 1,
  /** 2 — inferred (not seen in a file). */
  upright: 2,
  /** 3 — seen on Wurlitzer 1 200A. */
  electric: 3,
  /** 4 — seen on Clavinet D6. */
  clav: 4,
  /** 5 — inferred. */
  digital: 5,
  /** 6 — inferred. */
  misc: 6,
} as const;

export interface NpnoLayerInput {
  /** PCM per channel, int16 range. The stroke should start at the attack (no lead-in silence needed). */
  pcm: ArrayLike<number>[];
  /** Lowest velocity (0–127) this layer plays from; the first layer of a zone must be 0. */
  velocityFrom: number;
  /** Optional sustain loop in frames (`start + length` ≤ PCM length). */
  loop?: { start: number; length: number };
  /** Override the stored level word (+0x34) directly; see {@link buildNpno} for the default. */
  levelWord?: number;
}

export interface NpnoZoneInput {
  /** MIDI note the samples were recorded at. Must be unique per zone. */
  rootNote: number;
  /** Key range (inclusive) that plays this zone. Ranges must not overlap. */
  lowNote: number;
  highNote: number;
  /** Velocity layers, softest first. */
  layers: NpnoLayerInput[];
}

export interface NpnoInput {
  /** Display name (≤ 31 ASCII chars incl. any variant). */
  name: string;
  /** Optional model/variant shown after the `#` (e.g. "CP80"). */
  variant?: string;
  /** Minor version digit: the file is version 6.<minor> (CNSP+0x1A; NSM version = 600 + 10·minor). */
  minor?: number;
  /** {@link NPNO_PIANO_TYPE} value (default `grand`). */
  pianoType?: number;
  channels: 1 | 2;
  zones: NpnoZoneInput[];
  /**
   * Scale every stroke so its peak is {@link NPNO_PEAK} (as all factory strokes are), and fold
   * the gain into the level word so relative loudness is kept. Default true.
   */
  normalize?: boolean;
}

/** Level word baseline (0.1 dB attenuation, hypothesis — see docs/NPNO-WRITE.md). */
const LEVEL_BASE = 125;

/** Default Q23 coefficient at +0x2E: 2^23 − 146·2^((root−25)/24), through the Clavinet's end points. */
export function defaultDecayCoefficient(root: number): number {
  return 0x800000 - Math.round(146 * 2 ** ((Math.max(0, Math.min(127, root)) - 25) / 24));
}

function defaultHeader(input: NpnoInput): Uint8Array {
  const h = new Uint8Array(NPNO_HEADER_SIZE);
  const minor = input.minor ?? 0;
  be16(h, 0x04, CNSP_V6);
  // +0x16 metadata block (NSM reads 0x67 bytes; Stage 4 ARM 0xC00B84CC reads to +0x61C).
  be16(h, 0x16, CNSP_V6); // meta version (gated like the header version)
  h[0x18] = input.pianoType ?? NPNO_PIANO_TYPE.grand;
  h[0x19] = 1; // unknown (Clavinet 1, CP80 3, Wurlitzer 2); ARM overwrites it at load
  h[0x1a] = minor; // version minor digit (NSM S_GetVersion: format·100 + this·10)
  h[0x1b] = 2; // unknown, 2 in all three factory files
  const display = input.variant ? `${input.name}#${input.variant}` : `${input.name}#`;
  ascii(h, 0x1c, display); // name#variant, 32-byte field
  ascii(h, 0x3c, input.name); // plain name, 32-byte field (v6)
  // +0x5C: third 32-byte string, zero in every factory file.
  h[0x8b] = 2; // unknown byte (2 in the v6 Clavinet, 0 in both v5 files)
  // +0x8C key map: root note per MIDI key, 0xFF = unmapped.
  h.fill(0xff, 0x8c, 0x10c);
  for (const z of input.zones) for (let n = z.lowNote; n <= z.highNote; n++) h[0x8c + n] = z.rootNote;
  // Per-note tables read by the ARM loader (meaning unknown). Zero where a factory file is
  // zero; the constants below are identical in all three factory files unless noted.
  for (let n = 0; n < 128; n++) h[0x20c + n] = n <= 108 ? 0x0d : 0x39; // 0x0d: Clavinet value; 0x39 above key 108 in all
  h.fill(0x80, 0x41c, 0x49c);
  h[0x49c] = 2; // Clavinet 2, v5 files 0
  h.fill(0x1e, 0x49d, 0x51d);
  h[0x51d] = 2; // Clavinet 2 (not read by the loader)
  // +0x40C…+0x410: Clavinet 28 (6d) 0d 6c 01; +0x40D is overwritten at load, +0x40F/+0x410 = 0x6c/1 in all.
  h[0x40c] = 0x28; h[0x40e] = 0x0d; h[0x40f] = 0x6c; h[0x410] = 0x01;
  return h;
}

function defaultRecord(opts: { velocity: number; prevVelocity: number | undefined; level: number; root: number; id: number }): Uint8Array {
  const r = new Uint8Array(NPNO_RECORD_SIZE);
  r[0x04] = 0; // flags: normal stroke
  r[0x05] = opts.velocity;
  be32(r, 0x2e, defaultDecayCoefficient(opts.root));
  r[0x32] = 0;
  r[0x33] = opts.velocity; // copy of the velocity floor (as in every factory v6 record)
  be16(r, 0x34, opts.level);
  for (let k = 0; k < 13; k++) be32(r, 0x36 + k * 4, 0x800000); // 13 × 1.0 (Q23), as in every v6 record
  // +0x6A: 14th coefficient, 0. +0x6E: u32 whose low 14 bits the loader keeps (factory values
  // look like take numbers) — we write a unique id.
  be32(r, 0x6e, opts.id & 0x3fff);
  r[0x72] = 0x0d; // unknown; equals the +0x20C table value in the Clavinet
  r[0x73] = 33; // unknown; Clavinet 36 → 28 with pitch
  // Crossfade start: the loader computes vel − (vel − previous layer's vel)/2 for v5 files.
  r[0x74] = opts.prevVelocity === undefined ? 0 : opts.velocity - Math.trunc((opts.velocity - opts.prevVelocity) / 2);
  return r;
}

/** Validate the zone layout; throws with a musician-readable message. */
function validateZones(input: NpnoInput): void {
  if (!input.zones.length) throw new Error('A piano needs at least one key zone.');
  const owner = new Array<number>(128).fill(-1);
  const roots = new Set<number>();
  input.zones.forEach((z, i) => {
    if (!(z.lowNote >= 0 && z.highNote <= 127 && z.lowNote <= z.highNote)) throw new Error(`Zone ${i}: key range ${z.lowNote}–${z.highNote} is invalid.`);
    if (roots.has(z.rootNote)) throw new Error(`Two zones share root note ${z.rootNote}.`);
    roots.add(z.rootNote);
    for (let n = z.lowNote; n <= z.highNote; n++) {
      if (owner[n] >= 0) throw new Error(`Key ${n} is in zones ${owner[n]} and ${i}.`);
      owner[n] = i;
    }
    if (!z.layers.length) throw new Error(`Zone ${i} has no velocity layers.`);
    z.layers.forEach((l, k) => {
      if (k === 0 && l.velocityFrom !== 0) throw new Error(`Zone ${i}: the softest layer must start at velocity 0.`);
      if (k > 0 && !(l.velocityFrom > z.layers[k - 1].velocityFrom && l.velocityFrom <= 127)) {
        throw new Error(`Zone ${i}: layer velocities must rise and stay ≤ 127.`);
      }
      if (l.pcm.length !== input.channels) throw new Error(`Zone ${i} layer ${k}: expected ${input.channels} channel(s).`);
    });
  });
  const display = input.variant ? `${input.name}#${input.variant}` : `${input.name}#`;
  if (!/^[\x20-\x7e]+$/.test(display) || display.length > 31 || input.name.includes('#')) {
    throw new Error('The name (plus variant) must be ≤ 30 plain ASCII characters, without "#".');
  }
}

export interface NpnoBuildResult extends NpnoWriteResult {
  /** Suggested file name (NSM shows the part before the version tag). */
  fileName: string;
}

/**
 * Build a user piano from multisampled recordings. Defaults (each documented in
 * docs/NPNO-WRITE.md): v6 format, CBIN version 6.<minor>, strokes normalized to the factory
 * peak with the gain folded into the level word, header/record constants from the factory
 * v6 reference. ⚠ Hardware-untested.
 */
export function buildNpno(input: NpnoInput): NpnoBuildResult {
  validateZones(input);
  const header = defaultHeader(input);
  const normalize = input.normalize ?? true;
  const zones = [...input.zones].sort((a, b) => a.rootNote - b.rootNote);
  const strokes: NpnoStrokeImage[] = [];
  for (const z of zones) {
    z.layers.forEach((l, k) => {
      const end = l.loop?.length ? l.loop.start + l.loop.length : l.pcm[0].length;
      let peak = 0;
      for (const ch of l.pcm) for (let n = 0; n < end; n++) peak = Math.max(peak, Math.abs(ch[n]));
      const gain = normalize && peak > 0 ? NPNO_PEAK / peak : 1;
      const pcm = l.pcm.map((ch) => {
        const a = new Int32Array(ch.length);
        for (let n = 0; n < ch.length; n++) a[n] = Math.max(-32768, Math.min(32767, Math.round(ch[n] * gain)));
        return a;
      });
      const level = l.levelWord ?? Math.max(0, Math.min(0x7fff, Math.round(LEVEL_BASE + 200 * Math.log10(gain))));
      strokes.push({
        rootNote: z.rootNote,
        pcm,
        preroll: pcm.map(() => [0, 0, 0, 0]),
        loop: l.loop,
        record: defaultRecord({
          velocity: l.velocityFrom,
          prevVelocity: k > 0 ? z.layers[k - 1].velocityFrom : undefined,
          level, root: z.rootNote, id: strokes.length + 1,
        }),
      });
    });
  }
  const minor = input.minor ?? 0;
  const result = writeNpnoImage({ envelope: 'v6', cbinVersion: 600 + 10 * minor, channels: input.channels, header, strokes });
  const safe = input.name.replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/ +/g, '_') || 'Piano';
  return { ...result, fileName: `${safe}_6.${minor}.npno` };
}
