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

import { readNsmp, decodeNsmp, readNsmpZones } from './nsmp';
import { writeNsmpMulti, type WriteZone } from './nsmp-write';
import { writeOgNsmp, type OgWriteZone } from './nsmp-og';
import { parseWav } from './wav';
import { resampleNW1 } from './nw1-resample';

export interface ConvertResult {
  bytes: Uint8Array;
  /** Suggested filename extension for the target generation. */
  extension: string;
  warnings: string[];
}

export interface ImportWavOptions {
  /** Target codec: 2 = OG `.nsmp`, 3 = `.nsmp3`, 4 = `.nsmp4` (default 4). */
  codec?: 2 | 3 | 4;
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
 * Convert a `.nsmp*` to the target codec generation (3 → `.nsmp3`, 4 → `.nsmp4`).
 * Audio is preserved exactly; zone mapping is carried over when the source map is
 * readable (codec-3 maps today), else each stroke spans the keyboard by default.
 */
export function convertNsmp(bytes: Uint8Array, targetCodec: 2 | 3 | 4): ConvertResult {
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
  if (zones.length === 0 && strokes.length > 1) {
    warnings.push('Source zone map not read — placing each stroke across the full keyboard.');
  }
  const name = file.name ?? 'Converted';

  // OG / Stage-2 (codec 1) target — the downconvert the official editor refuses.
  if (targetCodec === 2) {
    const ogZones: OgWriteZone[] = strokes.map((s, i) => {
      const z = zones.find((z) => z.globalID === s.globalID) ?? zones[i];
      return {
        channels: s.channels,
        globalID: s.globalID || i + 1,
        rootKey: z?.rootKey ?? 60,
        keyHigh: z?.keyHigh ?? 127,
        segmentsInterleaved: s.segments, // carry loop/region structure from the source
      };
    });
    const out = writeOgNsmp({ name, zones: ogZones });
    warnings.push(
      'OG (.nsmp) output is EXPERIMENTAL: audio + zones are preserved exactly and the ' +
        'file round-trips, but the stroke-header loop pointers / normalize gain are ' +
        'best-effort and not hardware-validated (docs/NSMP-CODEC.md).',
    );
    return { bytes: out, extension: '.nsmp', warnings };
  }

  const writeZones: WriteZone[] = strokes.map((s, i) => {
    // Zones reference strokes by global id (not position); fall back to index order.
    const z = zones.find((z) => z.globalID === s.globalID) ?? zones[i];
    return {
      channels: s.channels,
      keyHigh: z?.keyHigh ?? 127,
      rootKey: z?.rootKey ?? 60,
      velTop: z?.velTop ?? 127,
    };
  });

  const out = writeNsmpMulti({ name, codec: targetCodec, zones: writeZones });
  warnings.push('Audio is preserved exactly; keyboard acceptance of the written file is pending hardware validation (docs/NSMP-CODEC.md).');
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
 * container and codec are otherwise correct. See `docs/NSMP-CODEC.md`, docs/LEGAL.md.
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
    bytes = writeOgNsmp({ name, zones: [{ channels, globalID: 1, rootKey, keyHigh }] });
  } else {
    bytes = writeNsmpMulti({ name, codec, zones: [{ channels, rootKey, keyHigh, velTop: 127 }] });
  }
  warnings.push(
    'WAV import is EXPERIMENTAL: audio is a faithful resample (not byte-exact vs the ' +
      'Nord editor) and the storage-rate/pitch model is not hardware-validated (docs/NSMP-CODEC.md).',
  );
  return { bytes, extension: EXT[codec], warnings };
}
