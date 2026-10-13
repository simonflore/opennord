/**
 * Does converting a sample to another generation keep what the sample holds? Converts in
 * memory, reads the result back and compares it with the source, part by part. Used by
 * the corpus scan (`npm run fixtures:scan` with `NORD_CHECK_CONVERSIONS=1`) to hold
 * {@link convertNsmp} to every sample on hand, not just the ones in the tests.
 *
 * Key ranges and velocity layers are left out: the oldest format can't hold layers, and a
 * few samples share one recording between several key ranges, which the converter doesn't
 * write yet.
 */
import { decodeNsmp, readGlobalLevelDetuneBytes, readNsmp, readPerNoteRows, type DecodedStrokeResult } from './nsmp';
import { convertNsmp, type TargetCodec } from './nsmp-convert';

export interface ConversionCheck {
  /** Generation converted to: 2 = `.nsmp`, 3 = `.nsmp3`, 4 = `.nsmp4`. */
  target: TargetCodec;
  /** What the converted file no longer has, in a player's words; empty when all is kept. */
  lost: string[];
}

const sameBytes = (a: Uint8Array | null | undefined, b: Uint8Array | null | undefined) =>
  !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

function sameAudio(a: DecodedStrokeResult, b: DecodedStrokeResult): boolean {
  return a.channels.length === b.channels.length
    && a.channels.every((c, k) => c.length === b.channels[k].length && c.every((v, n) => v === b.channels[k][n]));
}

/** Convert `bytes` to each other generation and say what each result lost. */
export function checkSampleConversions(bytes: Uint8Array): ConversionCheck[] {
  const file = readNsmp(bytes);
  const own = file.legacy ? 2 : file.codec;
  const src = decodeNsmp(bytes);
  if (src.length === 0) return [];
  const rows = readPerNoteRows(bytes);
  const out: ConversionCheck[] = [];
  for (const target of [2, 3, 4] as const) {
    if (target === own) continue;
    const lost: string[] = [];
    try {
      const converted = convertNsmp(bytes, target).bytes;
      const dst = decodeNsmp(converted);
      const every = (ok: (a: DecodedStrokeResult, b: DecodedStrokeResult) => boolean) =>
        dst.length === src.length && src.every((s, i) => ok(s, dst[i]));
      if (!every(sameAudio)) lost.push('audio');
      // A source without readable loop points has none to keep.
      if (!every((a, b) => !a.loop || (!!b.loop && a.loop.loops === b.loop.loops
        && a.loop.loopStart === b.loop.loopStart && a.loop.loopEnd === b.loop.loopEnd && a.loop.altStart === b.loop.altStart))) lost.push('loop points');
      if (!every((a, b) => !a.loop || Math.abs(a.loop.decayDbPerSecond - (b.loop?.decayDbPerSecond ?? 0)) < 1e-9)) lost.push('loop decay');
      if (!every((a, b) => a.sampleRate === b.sampleRate)) lost.push('tuning of a note');
      if (!sameBytes(readGlobalLevelDetuneBytes(bytes), readGlobalLevelDetuneBytes(converted))) lost.push('overall level and tuning');
      const rows2 = readPerNoteRows(converted);
      if (rows && !(rows2 && rows.every((r, i) => sameBytes(r, rows2[i])))) lost.push('per-key level and tuning');
    } catch (e) {
      lost.push(`could not be converted (${(e as Error).message})`);
    }
    out.push({ target, lost });
  }
  return out;
}
