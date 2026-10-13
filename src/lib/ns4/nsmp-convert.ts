/**
 * Cross-generation Nord Sample conversion — the community's headline ask
 * ("convert my samples between keyboards", esp. **downward** `.nsmp4 → .nsmp3`,
 * which the official editor won't do).
 *
 * Decodes every stroke's audio from the source, then re-encodes into the target
 * generation's container (codec 3 sample-interleaved ↔ codec 4 word-interleaved),
 * preserving the zone map (splits/velocity layers) when readable. Lossless on the
 * audio: `decodeNsmp(convertNsmp(x, t))` returns the same PCM as `decodeNsmp(x)`.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own samples only.
 */

import { readNsmp, decodeNsmp, readNsmpZones, readStrokeRegions, readGlobalLevelDetuneBytes, readPerNoteRows } from './nsmp';
import { writeNsmpMulti, type WriteStrokeMeta, type WriteZone } from './nsmp-write';
import { writeCodec2Nsmp, type Codec2WriteZone } from './nsmp-codec2-write';
import { parseWav } from './wav';
import { resampleNW1 } from './nw1-resample';

/**
 * Evenly split the 128-key range into `n` contiguous bands — the default keymap
 * used when the source zone map can't be read. Each stroke gets its own slice
 * (rooted at the slice centre) instead of every stroke stacking on middle C, so
 * a keymap-less source spreads across the keyboard and each wave is playable.
 */
function spreadKeyRanges(n: number): Array<{ keyLow: number; keyHigh: number; rootKey: number }> {
  return Array.from({ length: n }, (_, i) => {
    const keyLow = Math.round((i * 128) / n);
    const keyHigh = Math.round(((i + 1) * 128) / n) - 1; // last band ends at 127
    return { keyLow, keyHigh, rootKey: Math.round((keyLow + keyHigh) / 2) };
  });
}

/**
 * Target generation for {@link convertNsmp}: `2` = original `.nsmp` (OG `NWS`
 * container), `3` = `.nsmp3`, `4` = `.nsmp4`. Any source generation converts to
 * any of these.
 */
/**
 * Target generation, numbered as **Nord names it** in the Sample Editor export
 * menu: `2` = "NSMP 2" (`.nsmp`), `3` = "NSMP 3" (`.nsmp3`), `4` = "NSMP 4"
 * (`.nsmp4`). This matches the Nord Sample Library version (1 & 2 both ship as
 * `.nsmp`; we write the broadly-compatible v8 variant). See the maintainers’ notes.
 */
export type TargetCodec = 2 | 3 | 4;

export interface ConvertResult {
  bytes: Uint8Array;
  /** Suggested filename extension for the target generation. */
  extension: string;
  warnings: string[];
}

export interface ImportWavOptions {
  /** Target: 2 = "NSMP 2" (`.nsmp`), 3 = `.nsmp3`, 4 = `.nsmp4` (default 4). */
  codec?: TargetCodec;
  /** Sample name stored in the file. Default "Imported". */
  name?: string;
  /** Root key the sample is pitched for (default 60 = C4). */
  rootKey?: number;
  /** Zone top key / split point (default 127 — whole keyboard). */
  keyHigh?: number;
  /**
   * Resample the source to this rate before encoding (Hz). Omit to store at the
   * WAV's own rate (no resample). The Nord's internal storage rate was observed
   * ≈ 35256 Hz but is **not verified** — set this only if you know the target.
   */
  targetRate?: number;
}

const EXT: Record<number, string> = { 2: '.nsmp', 3: '.nsmp3', 4: '.nsmp4' };

/**
 * Convert a `.nsmp*` to the target generation (2 → `.nsmp`, 3 → `.nsmp3`, 4 → `.nsmp4`).
 * The audio is written exactly, and with it what each stroke and the key map hold
 * besides audio: loop points, alternate start and loop decay, each stroke's pitch base and
 * gain bytes, the overall level and detune and the per-key ones (the maintainers’ notes,
 * "What conversion carries"). Key ranges are carried over when the source map is readable,
 * else each stroke gets an even share of the keyboard. Not carried: velocity layers into
 * `.nsmp` (it has none).
 */
export function convertNsmp(bytes: Uint8Array, targetCodec: TargetCodec): ConvertResult {
  const file = readNsmp(bytes);
  const warnings: string[] = [...file.warnings];
  if (!file.recognized) {
    throw new Error('convertNsmp: not a recognized Nord Sample file');
  }
  if ((targetCodec === 2 && file.legacy) || file.codec === targetCodec) {
    warnings.push(`Source is already the target generation.`);
  }

  const strokes = decodeNsmp(bytes);
  if (strokes.length === 0) {
    throw new Error(`convertNsmp: could not decode any strokes (codec ${file.codec})`);
  }
  const zones = readNsmpZones(bytes); // [] when the source map isn't parseable yet
  // No readable source map + multiple strokes → give each stroke its own even
  // slice of the keyboard rather than stacking them all on middle C.
  const spread = zones.length === 0 && strokes.length > 1 ? spreadKeyRanges(strokes.length) : null;
  if (spread) {
    warnings.push('Source zone map not read — spreading each stroke across an even key range.');
  }
  const name = file.name ?? 'Converted';

  // "NSMP 2" (`.nsmp`) target — the downconvert the official editor refuses. We
  // emit the **codec-2 / Library-2.0 (`NWS` v11)** variant: the newest `.nsmp`,
  // which (unlike v8) preserves the sample name + zone map. Needs Library-2.0-capable
  // firmware (the assumption: keyboards are updated). See the maintainers’ notes.
  const stks = file.sections.filter((x) => x.tag.endsWith('stk'));
  // The stroke header has one layout in every generation, so what isn't audio is carried
  // as the source has it: root, pitch base and gain bytes, the loop and its decay.
  // The gain bytes (+0x09…+0x11: a u24 gain, an exponent byte, a 24-bit peak value) mean
  // the same in every generation: the same sound released as `.nsmp` and `.nsmp3` carries
  // the same gain and exponent and the same peak magnitude (388 strokes of 10 local pairs).
  // Only the peak's sign differs: `.nsmp` stores the magnitude, `.nsmp3`/`.nsmp4` give it the
  // sign of the stroke's loudest sample (1,042 of 1,062 strokes). the maintainers’ notes.
  const sameFamily = !file.legacy && targetCodec !== 2;
  const headerFieldsFor = (s: (typeof strokes)[number], p: number): Uint8Array => {
    const f = bytes.slice(p + 0x04, p + 0x12);
    if (sameFamily) return f;
    const raw = (f[9] << 16) | (f[10] << 8) | f[11];
    const magnitude = Math.abs(raw >= 0x800000 ? raw - 0x1000000 : raw);
    let loudest = 0;
    for (const ch of s.channels) for (let n = 0; n < ch.length; n++) if (Math.abs(ch[n]) > Math.abs(loudest)) loudest = ch[n];
    const peak = (targetCodec !== 2 && loudest < 0 ? -magnitude : magnitude) & 0xffffff;
    f[9] = (peak >>> 16) & 0xff; f[10] = (peak >>> 8) & 0xff; f[11] = peak & 0xff;
    return f;
  };
  const strokeMeta = (s: (typeof strokes)[number], rootKey: number): WriteStrokeMeta | undefined => {
    const p = stks[s.index]?.payloadOffset;
    if (p === undefined) return undefined;
    return {
      headerFields: headerFieldsFor(s, p),
      pitchBase: s.sampleRate,
      rootKey,
      headerTail: sameFamily ? bytes.slice(p + 0x34, p + 0x60) : undefined,
      segmentsInterleaved: s.segments,
      loop: s.loop ?? undefined,
      decayRaw: readStrokeRegions(bytes, p)?.decayRaw,
    };
  };
  const perNote = readPerNoteRows(bytes) ?? undefined;
  const global = readGlobalLevelDetuneBytes(bytes) ?? undefined;
  if (!perNote) warnings.push("This sample's per-key level and tuning could not be read, so they are not carried over.");

  if (targetCodec === 2) {
    // A legacy id is one byte and names one stroke. Sources whose ids repeat once read as a
    // byte (some `.nsmp4`) get new ones, so no two strokes share a map record's id.
    const idsUnique = new Set(strokes.map((s) => s.globalID)).size === strokes.length && strokes.every((s) => s.globalID > 0 && s.globalID <= 0xff);
    const c2Zones: Codec2WriteZone[] = strokes.map((s, i) => {
      const z = zones.find((z) => z.globalID === s.globalID) ?? zones[i];
      const d = spread?.[i];
      const rootKey = z?.rootKey ?? d?.rootKey ?? 60;
      return {
        channels: s.channels,
        globalID: idsUnique ? s.globalID : i + 1,
        rootKey,
        keyHigh: z?.keyHigh ?? d?.keyHigh ?? 127, // ascending tops = contiguous splits
        stroke: strokeMeta(s, rootKey),
      };
    });
    const out = writeCodec2Nsmp({ name, zones: c2Zones, levels: { global, perNote } });
    warnings.push(
      'This older format (.nsmp, Library 2.0) holds one sample per key range: velocity layers and ' +
        'key ranges that overlap are not carried over. Not yet tested on a keyboard, and it needs ' +
        'a keyboard OS that reads Library 2.0 samples.',
    );
    return { bytes: out, extension: '.nsmp', warnings };
  }

  const writeZones: WriteZone[] = strokes.map((s, i) => {
    // Zones reference strokes by global id (not position); fall back to index order.
    const z = zones.find((z) => z.globalID === s.globalID) ?? zones[i];
    const d = spread?.[i];
    const rootKey = z?.rootKey ?? d?.rootKey ?? 60;
    return {
      channels: s.channels,
      keyLow: z?.keyLow ?? d?.keyLow,
      keyHigh: z?.keyHigh ?? d?.keyHigh ?? 127,
      rootKey,
      velTop: z?.velTop ?? 127,
      velLow: z?.velLow,
      zoneMode: z?.zoneMode,
      zonePlayback: z?.zonePlayback,
      zoneIsOneShot: z?.zoneIsOneShot,
      stroke: strokeMeta(s, rootKey),
    };
  });

  const out = writeNsmpMulti({ name, codec: targetCodec, zones: writeZones, globalLevelDetune: global, perNote });
  warnings.push('Not yet tested on a keyboard.');
  return { bytes: out, extension: targetCodec === 4 ? '.nsmp4' : '.nsmp3', warnings };
}

/**
 * Create a Nord `.nsmp*` from a user's WAV file. Parses the WAV, optionally
 * resamples it (faithful windowed-sinc, {@link resampleNW1}) to `targetRate`, then
 * encodes it as a single-zone sample in the target generation. The round-trip
 * `decodeNsmp(importWavToNsmp(wav).bytes)` returns the (resampled) PCM.
 *
 * ⚠️ EXPERIMENTAL: the resample is faithful but not byte-exact vs Nord's editor,
 * and the internal storage rate / pitch model isn't hardware-verified — set
 * `targetRate` only if you know it (else the WAV's own rate is kept). Audio,
 * container and codec are otherwise correct. See the maintainers’ notes, docs/LEGAL.md.
 */
export function importWavToNsmp(wavBytes: Uint8Array, opts: ImportWavOptions = {}): ConvertResult {
  const codec = opts.codec ?? 4;
  const wav = parseWav(wavBytes);
  const warnings: string[] = [];

  let channels: ArrayLike<number>[] = wav.channels;
  if (opts.targetRate && opts.targetRate !== wav.sampleRate) {
    channels = resampleNW1(wav.channels, { ratio: wav.sampleRate / opts.targetRate });
    warnings.push(`Resampled ${wav.sampleRate} → ${opts.targetRate} Hz (faithful windowed-sinc, not byte-exact).`);
  }
  if (channels[0].length === 0) throw new Error('importWavToNsmp: empty audio');

  const name = opts.name ?? 'Imported';
  const rootKey = opts.rootKey ?? 60;
  const keyHigh = opts.keyHigh ?? 127;

  let bytes: Uint8Array;
  if (codec === 2) {
    bytes = writeCodec2Nsmp({ name, zones: [{ channels, globalID: 1, rootKey, keyHigh }] });
  } else {
    bytes = writeNsmpMulti({ name, codec, zones: [{ channels, rootKey, keyHigh, velTop: 127 }] });
  }
  warnings.push(
    'WAV import is EXPERIMENTAL: audio is a faithful resample (not byte-exact vs the ' +
      'Nord editor) and the storage-rate/pitch model is not hardware-validated.',
  );
  return { bytes, extension: EXT[codec], warnings };
}
