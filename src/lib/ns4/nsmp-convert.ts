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

export interface ConvertResult {
  bytes: Uint8Array;
  /** Suggested filename extension for the target generation. */
  extension: string;
  warnings: string[];
}

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
