import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNsmpSections } from './nsmp';
import { decodeStroke } from './nsmp-codec';
import { encodeStrokeNW1, BLOCK_PER_CH_OG } from './nw1-encode';
import { hasGt } from './gt-fixtures';

const u24be = (b: Uint8Array, o: number) => ((b[o] << 16) | (b[o + 1] << 8) | b[o + 2]) >>> 0;

/** Locate an OG (u24) stroke's block stream: first offset that walks valid u24
 *  block headers to a stop sentinel at the section end. */
function findStart(bytes: Uint8Array, p: number, end: number): number {
  for (let s = p + 0x36; s < p + 0x400 && s < end; s++) {
    let o = s, ok = true, blocks = 0;
    while (o + 3 <= end) {
      const w = u24be(bytes, o);
      const sc = w & 0x3fff, fo = (w >>> 14) & 0xf, bw = ((w >>> 19) & 0xf) + 1;
      if (fo === 0 && bw === 1) { o += 3; break; }
      if (fo > 7 || sc === 0) { ok = false; break; }
      o += 3 + Math.ceil((sc * bw) / 24) * 3; blocks++;
    }
    if (ok && blocks > 20 && Math.abs(o - end) <= 3) return s;
  }
  return -1;
}

/** Segment boundaries (interleaved) = the `lin=1` block positions (excl. stop). */
function recoverSegments(bytes: Uint8Array, start: number, end: number): number[] {
  let o = start, cum = 0; const segs: number[] = [];
  while (o + 3 <= end) {
    const w = u24be(bytes, o);
    const sc = w & 0x3fff, fo = (w >>> 14) & 0xf, bw = ((w >>> 19) & 0xf) + 1, lin = (w >>> 23) & 1;
    if (fo === 0 && bw === 1 && lin === 1) break;
    if (lin === 1 && cum > 0) segs.push(cum);
    o += 3 + Math.ceil((sc * bw) / 24) * 3; cum += sc;
  }
  return segs;
}

function ogStrokes(file: string) {
  const bytes = new Uint8Array(readFileSync(resolve(__dirname, '../../..', file)));
  const stks = parseNsmpSections(bytes).filter((s) => s.tag.endsWith('stk'));
  return stks.map((sec) => {
    const p = sec.payloadOffset, end = sec.endOffset, nCh = bytes[p + 8] || 2;
    const start = findStart(bytes, p, end);
    const segments = recoverSegments(bytes, start, end);
    const dec = decodeStroke(bytes.subarray(0, end), start, nCh, { u24: true });
    const expected = bytes.subarray(start, end);
    return { nCh, segments, channels: dec.channels, expected };
  });
}

const eq = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * The OG (codec-1) encoder path: `encodeStrokeNW1({ u24, blockPerCh: 24 })` with
 * the source stroke's recovered segment boundaries. Validated two ways:
 *  - **Byte-exact** reproduction of real OG strokes the editor's *current* Phase1
 *    matches (a documented subset — some old OG files used an older Phase1 merge
 *    rule that over-/under-merges loop-heavy regions; see docs/NSMP-CODEC.md).
 *  - **Lossless round-trip** for every stroke (`decode(encode(pcm)) === pcm`).
 */
const OG_TEST_FILES = ['research/nsmp/TAKE ON ME.nsmp', 'nsmp conversion demo files/BrassAlesis 2.nsmp'];

describe.skipIf(!hasGt(...OG_TEST_FILES))('encodeStrokeNW1 OG (codec-1) — vs real .nsmp strokes', () => {
  const files = OG_TEST_FILES;

  it('byte-exact on the strokes the current Phase1 reproduces', () => {
    let exact = 0, total = 0;
    for (const f of files) {
      for (const s of ogStrokes(f)) {
        total++;
        const got = encodeStrokeNW1(s.channels, { u24: true, blockPerCh: BLOCK_PER_CH_OG, segmentsInterleaved: s.segments });
        if (eq(got, s.expected)) exact++;
      }
    }
    // TAKE ON ME stk1–4 + stk8 reproduce byte-for-byte (5); lock that in.
    expect(exact, `byte-exact ${exact}/${total} OG strokes`).toBeGreaterThanOrEqual(5);
  });

  it('lossless round-trip for every OG stroke (decode∘encode === pcm)', () => {
    for (const f of files) {
      for (const s of ogStrokes(f)) {
        const got = encodeStrokeNW1(s.channels, { u24: true, blockPerCh: BLOCK_PER_CH_OG, segmentsInterleaved: s.segments });
        // decode our own stream back; it must equal the source PCM exactly.
        const back = decodeStroke(got, 0, s.nCh, { u24: true });
        for (let ch = 0; ch < s.nCh; ch++) {
          const a = back.channels[ch], b = s.channels[ch];
          expect(a.length).toBe(b.length);
          let same = true;
          for (let k = 0; k < b.length; k++) if (a[k] !== b[k]) { same = false; break; }
          expect(same, `round-trip mismatch ch${ch}`).toBe(true);
        }
      }
    }
  });
});
