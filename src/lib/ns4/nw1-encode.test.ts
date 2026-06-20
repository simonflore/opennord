import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNsmpSections } from './nsmp';
import { decodeStroke } from './nsmp-codec';
import { encodeStrokeNW1 } from './nw1-encode';
import { hasGt } from './gt-fixtures';

const GT = resolve(__dirname, '../../../research/nsmp/ground-truth');
const GT_FILES = ['impulse_24.nsmp4', 'ramp_24.nsmp4', 'sine_24.nsmp4'];
const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

/** Locate a codec-4 stroke's block stream (first real block .. stop inclusive). */
function gtStream(name: string): { bytes: Uint8Array; nCh: number; channels: Int32Array[] } {
  const bytes = new Uint8Array(readFileSync(resolve(GT, name)));
  const sec = parseNsmpSections(bytes).find((s) => s.tag.endsWith('stk'))!;
  const nCh = bytes[sec.payloadOffset + 8] || 1;
  const end = sec.endOffset;
  let o = sec.payloadOffset + 0x60;
  while (o + 4 <= end && u32be(bytes, o) === 0) o += 4; // skip stroke-header zero pad
  const start = o;
  const channels = decodeStroke(bytes.subarray(0, end), start, nCh, { wordInterleaved: true }).channels;
  return { bytes: bytes.subarray(start, end), nCh, channels };
}

/** First mismatching byte index (or -1), for diagnostics. */
function firstDiff(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

// secondStart in the editor's internal (resampled) domain, interleaved samples.
// Measured from ground truth (seg0 = 88 + 67*64 = 4376); identical across the
// three files since they share the same .nsmpproj (secondStart=3000, end=24000).
const SECOND_START_INTERLEAVED = 4376;

describe.skipIf(!hasGt(...GT_FILES.map((f) => `research/nsmp/ground-truth/${f}`)))('encodeStrokeNW1 — byte-exact vs editor ground truth', () => {
  for (const name of GT_FILES) {
    it(name, () => {
      const { bytes: expected, channels } = gtStream(name);
      const got = encodeStrokeNW1(channels, {
        wordInterleaved: true,
        segmentsInterleaved: [SECOND_START_INTERLEAVED],
      });
      const d = firstDiff(got, expected);
      expect(
        d,
        `${name}: first byte diff at 0x${d.toString(16)} (got ${got.length}B, expect ${expected.length}B)` +
          (d >= 0 ? ` got=0x${(got[d] ?? 0).toString(16)} exp=0x${(expected[d] ?? 0).toString(16)}` : ''),
      ).toBe(-1);
      expect(got.length).toBe(expected.length);
    });
  }
});
