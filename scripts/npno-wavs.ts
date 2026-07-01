/**
 * npno-wavs — render reference + candidate decodes to WAV for human A/B evaluation.
 * The ear is the oracle the algorithms can't be: real piano note vs. noise is obvious.
 * Outputs to ~/Downloads/npno-eval/. (Local eval only; audio is never shipped — docs/LEGAL.md.)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { decodeNsmp } from '@/lib/ns4/nsmp';
import { decodeCand, type Layout } from './npno-crack';

const OUT = join(homedir(), 'Downloads', 'npno-eval');
mkdirSync(OUT, { recursive: true });
const RATE = 44100;

/** Write mono int samples as 16-bit PCM WAV, peak-normalized; clamps runaway to keep it audible. */
function writeWav(name: string, samples: number[]): void {
  // clip at a sane bound, then normalize to 90% full-scale
  const clipped = samples.map((v) => Math.max(-2_000_000, Math.min(2_000_000, v)));
  let pk = 1; for (const v of clipped) pk = Math.max(pk, Math.abs(v));
  const n = clipped.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round((clipped[i] / pk) * 30000), 44 + i * 2);
  writeFileSync(join(OUT, name), buf);
  console.log(`  ${name}  (${(n / RATE).toFixed(2)}s)`);
}

console.log('REFERENCE — real CP80, decoded from the .nsmp twin (this is the target sound):');
const gt = decodeNsmp(new Uint8Array(readFileSync('fixtures/ElGrand_CP80__CL_mono_2.0.nsmp')));
for (const i of [1, 4, 9, 13]) writeWav(`REFERENCE_nsmp_stroke${i}.wav`, Array.from(gt[i].channels[0]).slice(0, RATE * 3));

// candidates: SEARCH each source for the longest BOUNDED decodes (most likely to contain
// real audio if a layout is close) across a layout set × offset scan. Export the top few.
function layoutSet(): Layout[] {
  const A: Layout[] = [];
  for (const wordBits of [32, 24] as const)
    for (let scW = 11; scW <= 14; scW++) for (const ordW of [3, 4] as const) for (const bwW of [4, 5] as const) for (const bwPlus of [0, 1] as const) {
      if (scW + ordW + bwW > wordBits) continue;
      A.push({ wordBits, scLo: 0, scW, ordLo: scW, ordW, bwLo: scW + ordW, bwW, bwPlus });
      A.push({ wordBits, scLo: 0, scW, ordLo: scW + bwW, ordW, bwLo: scW, bwW, bwPlus });
      if (wordBits >= 24) A.push({ wordBits, scLo: 0, scW: 14, ordLo: 14, ordW: 4, bwLo: 19, bwW: 4, bwPlus: 1 });
    }
  return A;
}
// memory-light: during scan keep only (off, L, boundedLen); re-decode winners at the end.
function boundedLen(dec: number[]): number { let e = dec.length; for (let i = 0; i < dec.length; i++) if (Math.abs(dec[i]) > 400000) { e = i; break; } return e; }
function longestBounded(bytes: Uint8Array, from: number, to: number, step: number, top: number) {
  let hits: { L: Layout; off: number; len: number }[] = [];
  const set = layoutSet();
  for (let off = from; off < to; off += step) for (const L of set) {
    const len = boundedLen(decodeCand(bytes, off, L, 40000)); // 0.9s cap is enough to rank
    if (len > RATE * 0.3) hits.push({ L, off, len });
    if (hits.length > 4000) { hits.sort((a, b) => b.len - a.len); hits = hits.slice(0, 200); } // trim
  }
  hits.sort((a, b) => b.len - a.len);
  const kept: { L: Layout; off: number; dec: number[] }[] = [];
  for (const h of hits) { if (kept.length >= top) break; if (!kept.some((k) => Math.abs(k.off - h.off) < 0x2000)) kept.push({ L: h.L, off: h.off, dec: decodeCand(bytes, h.off, h.L, RATE * 2).slice(0, boundedLen(decodeCand(bytes, h.off, h.L, RATE * 2))) }); }
  return kept;
}

console.log('\nCANDIDATES — longest BOUNDED CP80 .npno decodes found (listen for tonality vs noise):');
const np = new Uint8Array(readFileSync('fixtures/Electric_Grand_1_CP80__5.3.npno'));
longestBounded(np, 0x2000, Math.min(np.length, 0x400000), 512, 6).forEach((f, i) =>
  writeWav(`cand_cp80_${i}_off${f.off.toString(16)}_w${f.L.wordBits}sc${f.L.scW}o${f.L.ordLo}b${f.L.bwLo}.wav`, f.dec));

console.log('\nWHITE-GRAND-BLOB — confirmed-real audio bytes, longest bounded decodes:');
const wg = new Uint8Array(readFileSync('fixtures/variants/White_Grand_Sml_6.3.npno'));
longestBounded(wg, 0x3faf8f0 - 0x8000, 0x3faf8f0 + 0x100, 256, 6).forEach((f, i) =>
  writeWav(`wgblob_${i}_off${f.off.toString(16)}_w${f.L.wordBits}sc${f.L.scW}o${f.L.ordLo}b${f.L.bwLo}.wav`, f.dec));
console.log(`\nDone → ${OUT}`);
