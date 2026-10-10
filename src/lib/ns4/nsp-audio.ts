/**
 * Decoding the **audio** of a Nord Piano library (`.npno` / `CNSP`) — the stroke directory
 * and the piano block codec. Recovered from the Stage 4 firmware's piano DSP (DSP 4,
 * ADSP-214xx) and verified bit-exact on v5 (mono) and v6 (stereo) factory files; see
 * the maintainers’ notes ("CNSP audio decoded") and the reference the maintainers’ tools.
 *
 * Local use only: a factory piano is Clavia's audio. OpenNord decodes it on the user's own
 * machine (audition, inspection) and never uploads or shares it (`docs/LEGAL.md`).
 *
 * Layout (offsets from the `CNSP` tag — 0x2C in v6 files, 0x18 in v5; big-endian):
 *   +0x61C  u16 version, u16 channels (1 | 2), u16 stroke count
 *   +0x72C  stroke records, 0x76 bytes each (fields in `readStroke`)
 *   blocks  fixed size, 511 words mono / 1022 stereo; a stroke's blocks are contiguous.
 *           word 0: bits 0-4 residual width, 5-7 predictor order (0-4), 8-15 block level
 *           (dB below the stroke peak; the PCM is not rescaled by it). Then residuals,
 *           LSB-first over the 16-bit words, L/R interleaved per frame. The last 64 frames
 *           a block holds repeat the next block's first 64 (DSP slack) and are skipped.
 */

/** Playback rate of piano strokes (the CP80's A4 stroke measures 440.4 Hz at this rate). */
export const NSP_SAMPLE_RATE = 44100;

const DIR_OFFSET = 0x61c;
const RECORDS_OFFSET = 0x72c;
const RECORD_SIZE = 0x76;
const BLOCK_OVERLAP = 64;
/** Binomial predictors by order, newest history sample first. */
const PREDICTORS: readonly (readonly number[])[] = [[], [1], [2, -1], [3, -3, 1], [4, -6, 4, -1]];

/** One recorded note (a dynamic layer of one key zone). */
export interface NspStroke {
  /** Position in the directory. */
  index: number;
  /** Key zone, counting from the lowest (`NspFile.zones` order). */
  zone: number;
  /**
   * The layer's **attenuation floor**, in 0.2 dB steps, 0 = the hardest hit (historical
   * name). The instrument maps velocity through the Touch curve
   * to an attenuation and plays the last layer whose floor is at or below it, so a zone's
   * layers run loudest (0) first. Use `strokeFor` to pick by velocity.
   */
  velocityFrom: number;
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

function readStroke(view: DataView, at: number, base: number, index: number, channels: number): Omit<NspStroke, 'zone'> {
  const history = [0x12, 0x1a].slice(0, channels).map((h) => {
    const oldestFirst = [0, 2, 4, 6].map((k) => view.getInt16(at + h + k));
    return oldestFirst.reverse();
  });
  const loopStart = view.getUint32(at + 0x22);
  const loopLength = view.getUint32(at + 0x26);
  // +0x2A/+0x2E: first frames of the loop-start block and of the block after it;
  // +0x32: that block's index (the DSP's loop re-entry point). Derivable, so not exposed.
  return {
    index,
    offset: base + view.getUint32(at + 0x06),
    velocityFrom: view.getUint16(at + 0x0a),
    frames: view.getUint32(at + 0x0c),
    blocks: view.getUint16(at + 0x10),
    history,
    loop: loopLength ? { start: loopStart, length: loopLength } : undefined,
  };
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
    readStroke(view, base + RECORDS_OFFSET + i * RECORD_SIZE, base, i, channels));
  // A zone's layers are consecutive, loudest (attenuation floor 0) first.
  let zone = -1;
  const strokes = raw.map((s) => ({ ...s, zone: s.velocityFrom === 0 || zone < 0 ? ++zone : zone }));
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
  return Math.max(0, -200 * Math.log10(v / 127)); // max: no -0 at v = 127
}

/**
 * The stroke a key zone plays at `velocity` (1–127), the way the instrument picks it: the
 * velocity's attenuation selects the last (softest) layer whose floor is at or below it.
 * One stroke plays; there is no crossfade between layers.
 */
export function strokeFor(dir: NspDirectory, zone: number, velocity: number): NspStroke | undefined {
  const att = touchAttenuation(velocity);
  let pick: NspStroke | undefined;
  for (const s of dir.strokes) {
    if (s.zone === zone && s.velocityFrom <= att && (!pick || s.velocityFrom >= pick.velocityFrom)) pick = s;
  }
  return pick;
}
