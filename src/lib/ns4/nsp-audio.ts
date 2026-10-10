/**
 * Decoding the **audio** of a Nord Piano library (`.npno` / `CNSP`) — the stroke directory
 * and the piano block codec. Recovered from the Stage 4 firmware's piano DSP (DSP 4,
 * ADSP-214xx) and verified bit-exact on v5 (mono) and v6 (stereo) factory files; see
 * `docs/NSP-FORMAT.md` ("CNSP audio decoded") and the reference `scripts/npno-decode.py`.
 *
 * Local use only: a factory piano is Clavia's audio. OpenNord decodes it on the user's own
 * machine (audition, inspection) and never uploads or shares it (`docs/LEGAL.md`).
 *
 * Layout (offsets from the `CNSP` tag — 0x2C in v6 files, 0x18 in v5; big-endian):
 *   +0x61C  u16 version, u16 channels (1 | 2), u16 stroke count, then u16[128]: the number of
 *           strokes (velocity layers) of the zone rooted at each MIDI note (0 = no zone there)
 *   +0x732  stroke records, 0x76 bytes each (fields in `readStroke`). The Stage 4 ARM loader
 *           reads them at file+0xC+0x732 (`0xC00B47B8`); earlier notes counted from +0x72C.
 *   blocks  fixed size, 511 words mono / 1022 stereo; a stroke's blocks are contiguous.
 *           word 0: bits 0-4 residual width, 5-7 predictor order (0-4), 8-15 block level
 *           (dB below the stroke peak; the PCM is not rescaled by it). Then residuals,
 *           LSB-first over the 16-bit words, L/R interleaved per frame. The last 64 frames
 *           a block holds repeat the next block's first 64 (DSP slack) and are skipped.
 */

/** Playback rate of piano strokes (the CP80's A4 stroke measures 440.4 Hz at this rate). */
export const NSP_SAMPLE_RATE = 44100;

const DIR_OFFSET = 0x61c;
/** u16[128] layers-per-root-note table, right after version/channels/count. */
const LAYER_TABLE_OFFSET = 0x622;
const RECORDS_OFFSET = 0x732;
const RECORD_SIZE = 0x76;
/** The last 64 frames of a block repeat the next block's first 64 (DSP read-ahead slack). */
export const BLOCK_OVERLAP = 64;
/** CNSP format code of v6 files; older (v5, 0x450) files store floors in 1 dB steps, not 0.2 dB. */
const CNSP_V6 = 0x464;
/** Binomial predictors by order, newest history sample first. */
export const PREDICTORS: readonly (readonly number[])[] = [[], [1], [2, -1], [3, -3, 1], [4, -6, 4, -1]];

/** One recorded note (a dynamic layer of one key zone). */
export interface NspStroke {
  /** Position in the directory. */
  index: number;
  /** Key zone, counting from the lowest (`NspFile.zones` order). */
  zone: number;
  /**
   * The layer's **attenuation floor**, in 0.2 dB steps, 0 = the hardest hit (historical
   * name; see `docs/NSP-FORMAT.md`); v5 files store it in 1 dB steps, scaled ×5 here. The
   * instrument maps velocity through the Touch curve to an attenuation and picks a layer by
   * it, so a zone's layers run loudest (0) first. Use `strokeFor` to pick by velocity.
   */
  velocityFrom: number;
  /** Record flag bits (+0x04 & 3): 0 = a normal stroke, 1 = an alternative list, 2 = a key-release sound. */
  flags: number;
  /** A key-release sound (played on note-off), not a dynamic layer. */
  release: boolean;
  /** Length in sample frames. */
  frames: number;
  /** Byte offset of the first block in the file. */
  offset: number;
  blocks: number;
  /** Predictor history each channel starts from, newest first. */
  history: number[][];
  /** Sustain loop in frames (`end = start + length`); absent when the stroke doesn't loop. */
  loop?: { start: number; length: number };
}

export interface NspDirectory {
  version: number;
  channels: 1 | 2;
  /** Block size in 16-bit words. */
  blockWords: number;
  strokes: NspStroke[];
}

/** Offset of the `CNSP` tag, or -1. */
export function findCnsp(bytes: Uint8Array): number {
  for (let i = 0; i + 4 <= Math.min(bytes.length, 0x80); i++) {
    if (bytes[i] === 0x43 && bytes[i + 1] === 0x4e && bytes[i + 2] === 0x53 && bytes[i + 3] === 0x50) return i;
  }
  return -1;
}

function readStroke(view: DataView, at: number, base: number, index: number, channels: number, floorScale: number): Omit<NspStroke, 'zone'> {
  // Record layout (from the record's own start, CNSP+0x732+i*0x76; field use per the ARM
  // loader 0xC00AB028, see docs/NSP-FORMAT.md): +0x00 u32 first block offset, +0x04 u8 flags,
  // +0x05 u8 attenuation floor, +0x06 u32 frames, +0x0A u16 blocks, +0x0C/+0x14 4×i16 history
  // per channel (oldest first), +0x1C u32 loop start, +0x20 u32 loop length.
  const history = [0x0c, 0x14].slice(0, channels).map((h) => {
    const oldestFirst = [0, 2, 4, 6].map((k) => view.getInt16(at + h + k));
    return oldestFirst.reverse();
  });
  const loopStart = view.getUint32(at + 0x1c);
  const loopLength = view.getUint32(at + 0x20);
  // +0x24/+0x28: first frames of the loop-start block and of the block after it;
  // +0x2C: that block's index (the DSP's loop re-entry point). Derivable, so not exposed.
  const flags = view.getUint8(at + 0x04) & 3;
  return {
    index,
    offset: base + view.getUint32(at),
    velocityFrom: view.getUint8(at + 0x05) * floorScale,
    flags,
    release: flags === 2,
    frames: view.getUint32(at + 0x06),
    blocks: view.getUint16(at + 0x0a),
    history,
    loop: loopLength ? { start: loopStart, length: loopLength } : undefined,
  };
}

/** The u16[128] layers-per-root-note table: how many strokes the zone rooted at each MIDI note has. */
export function readLayerTable(bytes: Uint8Array, base: number): number[] {
  const at = base + LAYER_TABLE_OFFSET;
  return Array.from({ length: 128 }, (_, n) => (bytes[at + n * 2] << 8) | bytes[at + n * 2 + 1]);
}

/** Zone index of each stroke, from the layers-per-root table (falls back to "a layer with
 *  attenuation floor 0 opens a zone" when the table doesn't account for every stroke). */
function zoneOf(table: number[], raw: Omit<NspStroke, 'zone'>[]): number[] {
  const counts = table.filter((c) => c > 0);
  if (counts.reduce((a, b) => a + b, 0) === raw.length) {
    return counts.flatMap((c, z) => new Array<number>(c).fill(z));
  }
  let zone = -1;
  return raw.map((s) => (s.velocityFrom === 0 && !s.release) || zone < 0 ? ++zone : zone);
}

/** Read the stroke directory; `undefined` if the file has no readable CNSP directory. */
export function readNspDirectory(bytes: Uint8Array): NspDirectory | undefined {
  const base = findCnsp(bytes);
  if (base < 0 || base + RECORDS_OFFSET > bytes.length) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = view.getUint16(base + DIR_OFFSET);
  const channels = view.getUint16(base + DIR_OFFSET + 2);
  const count = view.getUint16(base + DIR_OFFSET + 4);
  if ((channels !== 1 && channels !== 2) || count === 0 || base + RECORDS_OFFSET + count * RECORD_SIZE > bytes.length) {
    return undefined;
  }
  const raw = Array.from({ length: count }, (_, i) =>
    readStroke(view, base + RECORDS_OFFSET + i * RECORD_SIZE, base, i, channels, version < CNSP_V6 ? 5 : 1));
  // A zone's strokes are consecutive (lowest root first), loudest layer first.
  const zones = zoneOf(readLayerTable(bytes, base), raw);
  const strokes = raw.map((s, i) => ({ ...s, zone: zones[i] }));
  // Strokes are stored back to back, so the block size falls out of any two neighbours.
  const blockWords = strokes.length > 1 && strokes[0].blocks
    ? (strokes[1].offset - strokes[0].offset) / strokes[0].blocks / 2
    : 511 * channels;
  if (!Number.isInteger(blockWords) || blockWords < 2) return undefined;
  for (const s of strokes) {
    if (s.offset + s.blocks * blockWords * 2 > bytes.length) return undefined;
  }
  return { version, channels, blockWords, strokes };
}

/** Frames a block of `blockWords` words holds at width `w` (its own, without the overlap). */
export function framesPerBlock(blockWords: number, width: number, channels: number): number {
  return Math.floor(((blockWords - 1) * 16) / (width * channels)) - BLOCK_OVERLAP;
}

/**
 * Decode one stroke to integer PCM, one array per channel. Throws on a malformed stroke
 * (bad block header, or a frame count that disagrees with the directory).
 */
export function decodeNspStroke(bytes: Uint8Array, dir: NspDirectory, stroke: NspStroke): Int32Array[] {
  const { channels, blockWords } = dir;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out = Array.from({ length: channels }, () => new Int32Array(stroke.frames));
  const hist = stroke.history.map((h) => [...h]);
  let t = 0;
  for (let b = 0; b < stroke.blocks; b++) {
    const at = stroke.offset + b * blockWords * 2;
    const header = view.getUint16(at);
    const width = header & 0x1f;
    const order = (header >> 5) & 7;
    if (width === 0 || order >= PREDICTORS.length) {
      throw new Error(`piano stroke ${stroke.index}: bad block header 0x${header.toString(16)} in block ${b}`);
    }
    const coef = PREDICTORS[order];
    const own = framesPerBlock(blockWords, width, channels);
    const half = 2 ** (width - 1);
    const full = 2 ** width;
    let bit = 0; // bit position in the residual area (words 1..)
    for (let n = 0; n < own; n++) {
      if (t >= stroke.frames) throw new Error(`piano stroke ${stroke.index}: more frames than the directory's ${stroke.frames}`);
      for (let c = 0; c < channels; c++) {
        // w bits, LSB-first across consecutive 16-bit words
        let v = 0;
        for (let got = 0; got < width;) {
          const word = view.getUint16(at + 2 + (bit >> 4) * 2);
          const offs = bit & 15;
          const take = Math.min(16 - offs, width - got);
          v += ((word >> offs) & ((1 << take) - 1)) * 2 ** got;
          got += take;
          bit += take;
        }
        const r = v >= half ? v - full : v;
        const h = hist[c];
        let x = r;
        for (let k = 0; k < coef.length; k++) x += coef[k] * h[k];
        h.pop();
        h.unshift(x);
        out[c][t] = x;
      }
      t++;
    }
  }
  if (t !== stroke.frames) {
    throw new Error(`piano stroke ${stroke.index}: decoded ${t} frames, directory says ${stroke.frames}`);
  }
  return out;
}

/**
 * Velocity (1–127) → attenuation in the stroke records' 0.2 dB units (0 = the hardest hit).
 * An approximation of the Stage 4's Touch curve — a 40·log10(v/127) dB law — until the
 * exact curves per Touch setting are extracted.
 */
export function touchAttenuation(velocity: number): number {
  const v = Math.min(127, Math.max(1, velocity));
  return Math.min(200, Math.max(0, -200 * Math.log10(v / 127))); // 0…40 dB, as the instrument clamps; max: no -0
}

/**
 * The stroke a key zone plays at `velocity` (1–127), the way the instrument picks it: layers
 * switch halfway between neighbouring floors (`floor − trunc((floor − previous) / 2)`, the
 * value factory records keep at +0x74), and the velocity's attenuation plays the last layer
 * whose switch point it reaches. One stroke plays; there is no crossfade between layers.
 * `selectOffset` (0.2 dB steps) is added to the attenuation before the pick; the Stage 4's
 * note-on path adds 20 (`docs/PIANO-ENGINE.md` §2.1), the in-app audition uses 0.
 */
export function strokeFor(dir: NspDirectory, zone: number, velocity: number, selectOffset = 0): NspStroke | undefined {
  const att = touchAttenuation(velocity) + selectOffset;
  // Normal strokes only: release sounds (and the alternative type-1 list) are picked separately.
  const layers = dir.strokes.filter((s) => s.zone === zone && s.flags === 0); // loudest first
  let pick = layers[0];
  for (let i = 1; i < layers.length; i++) {
    const floor = layers[i].velocityFrom;
    if (floor - Math.trunc((floor - layers[i - 1].velocityFrom) / 2) <= att) pick = layers[i];
  }
  return pick;
}
