import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readNsmp, decodeNsmp, parseNsmpSections } from './nsmp';
import { decodeStroke } from './nsmp-codec';
import { encodeStrokeNW1, BLOCK_PER_CH, BLOCK_PER_CH_OG } from './nw1-encode';
import { writeOgStrokeHeader, parseOgStrokeHeader } from './nsmp-og';
import { hasGt } from './gt-fixtures';

/**
 * Broad real-corpus regression for the Nord Sample codec, across **every
 * generation we read** (OG `NWS` v8 / codec-1, plus codec-4 `.nsmp4`). The files
 * are git-ignored (see `gt-fixtures.ts` / `docs/LEGAL.md`) so this suite skips in
 * CI and runs only where the corpus is present.
 *
 * It pins three guarantees per file, the strongest hardware-free statements we can
 * make about the codec (the remaining unknown — a real keyboard accepting a
 * *generated* OG file — needs a Stage 2; see `docs/NSMP-CODEC.md`):
 *
 *  1. **Decode** — every `stk` section decodes to bounded PCM with a sane channel
 *     count (the structure + predictor are correct).
 *  2. **Lossless re-encode round-trip** — `decode → encode → decode` is identical,
 *     proving the encoder is an exact inverse of the decoder on real audio.
 *  3. **OG header byte-exactness** — for OG (codec-1) files, every `stk` header
 *     `parse → write` reproduces the original bytes exactly.
 *
 * Earlier suites validated (2) on the codec-4 ground-truth files and (3) on 17
 * strokes across 2 OG files. This widens the bar to the broader local corpus
 * (5 OG files, 75 OG strokes + a 41-stroke codec-4 instrument).
 */

interface CorpusFile {
  /** Repo-root-relative path (git-ignored). */
  rel: string;
  /** Expected generation. */
  legacy: boolean;
  codec?: number;
  /** Lower bound on stroke (zone) count — guards against silent under-decode. */
  minStrokes: number;
}

const CORPUS: CorpusFile[] = [
  { rel: 'research/nsmp/ABBA Gimme Gimme Flute.nsmp', legacy: true, minStrokes: 29 },
  { rel: 'research/nsmp/DX7IIC Crystal BR.nsmp', legacy: true, minStrokes: 23 },
  { rel: 'research/nsmp/Stereophonic Motif.nsmp', legacy: true, minStrokes: 5 },
  { rel: 'research/nsmp/SynthPad2__ste CLv4.nsmp', legacy: true, minStrokes: 9 },
  { rel: 'research/nsmp/TAKE ON ME.nsmp', legacy: true, minStrokes: 9 },
  { rel: 'research/nsmp/VibesNoVibrato Mellotron_M300A 4.1.nsmp4', legacy: false, codec: 4, minStrokes: 41 },
];

const REPO_ROOT = resolve(__dirname, '../../..');
const BOUND = 1 << 26; // raw 16-bit reconstructions stay well under this

function eqInt(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function firstDiff(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) return -2;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i;
  return -1;
}

for (const cf of CORPUS) {
  describe.skipIf(!hasGt(cf.rel))(`corpus: ${cf.rel.split('/').pop()}`, () => {
    const bytes = hasGt(cf.rel) ? new Uint8Array(readFileSync(resolve(REPO_ROOT, cf.rel))) : new Uint8Array();

    it('identifies the generation', () => {
      const file = readNsmp(bytes);
      expect(file.recognized).toBe(true);
      expect(file.legacy).toBe(cf.legacy);
      if (cf.codec !== undefined) expect(file.codec).toBe(cf.codec);
    });

    // Decoding a whole multi-MB instrument (ABBA = 29 large strokes) is heavy and
    // can exceed the 30s default under full-suite parallelism — give it room.
    it(`decodes ≥${cf.minStrokes} strokes to bounded PCM`, () => {
      const strokes = decodeNsmp(bytes);
      expect(strokes.length).toBeGreaterThanOrEqual(cf.minStrokes);
      for (const s of strokes) {
        expect([1, 2]).toContain(s.channels.length);
        const len = s.channels[0]?.length ?? 0;
        expect(len).toBeGreaterThan(0);
        for (const ch of s.channels) {
          expect(ch.length).toBe(len); // equal-length channels
          for (const v of ch) expect(Math.abs(v)).toBeLessThan(BOUND);
        }
      }
    }, 120_000);

    it('re-encodes every stroke losslessly (decode → encode → decode)', () => {
      const file = readNsmp(bytes);
      const u24 = file.legacy;
      const wordInterleaved = file.codec === 4;
      const blockPerCh = u24 ? BLOCK_PER_CH_OG : BLOCK_PER_CH;
      const strokes = decodeNsmp(bytes);
      for (const s of strokes) {
        const enc = encodeStrokeNW1(s.channels as ArrayLike<number>[], {
          u24, blockPerCh, wordInterleaved, segmentsInterleaved: s.segments,
        });
        const re = decodeStroke(enc, 0, s.channels.length, { u24, wordInterleaved });
        expect(re.channels.length).toBe(s.channels.length);
        for (let c = 0; c < s.channels.length; c++) {
          expect(eqInt(s.channels[c], re.channels[c])).toBe(true);
        }
      }
    }, 180_000);

    if (cf.legacy) {
      it('re-serializes every OG stk header byte-exact (parse → write)', () => {
        const stk = parseNsmpSections(bytes).filter((s) => s.tag.endsWith('stk'));
        expect(stk.length).toBeGreaterThanOrEqual(cf.minStrokes);
        for (const sec of stk) {
          const re = writeOgStrokeHeader(parseOgStrokeHeader(bytes, sec.payloadOffset));
          const orig = bytes.subarray(sec.payloadOffset, sec.payloadOffset + re.length);
          expect(firstDiff(re, orig)).toBe(-1);
        }
      });
    }
  });
}
