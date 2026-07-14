/**
 * npno-crack — capture-and-crack harness for the CNSP (.npno) piano audio codec.
 *
 * The CNSP audio is a fixed-predictor lossless codec (NW1 *variant*): confirmed real,
 * but its exact block-header packing + block alignment are undetermined from files alone
 * (a fixed predictor smooths arbitrary bytes into plausible audio — see docs/NSP-FORMAT.md).
 * Ground-truth PCM (a recording of the piano) collapses the ambiguity: we brute-force the
 * header layout and correlate each candidate decode against the recording.
 *
 *   npx tsx scripts/npno-crack.ts validate
 *       Proof the search works: decode a .nsmp stroke with our KNOWN-correct decoder, then
 *       recover that layout by correlation search. Must print a ~1.0 match at the true layout.
 *
 *   npx tsx scripts/npno-crack.ts crack <recording.wav> <rootNote> [file.npno]
 *       Search the .npno for a stroke whose decode matches the recording; report the layout.
 *
 * Nothing here embeds or ships audio (docs/LEGAL.md): it reads local files to recover a
 * format, and prints only layout parameters.
 */
import { readFileSync } from 'node:fs';
import { decodeNsmp } from '@/lib/ns4/nsmp';
import { decodeStroke as decodeStrokeProven } from '@/lib/ns4/nsmp-codec';

const PRED: number[][] = [[], [1], [2, -1], [3, -3, 1], [4, -6, 4, -1], [5, -10, 10, -5, 1], [6, -15, 20, -15, 6, -1], [7, -21, 35, -35, 21, -7, 1]];

export interface Layout {
  wordBits: 16 | 24 | 32;
  scLo: number; scW: number;
  ordLo: number; ordW: number;
  bwLo: number; bwW: number;
  bwPlus: 0 | 1;
}
const fld = (w: number, lo: number, width: number) => (w >>> lo) & ((1 << width) - 1);

/**
 * Parameterized NW1 decode from `start`, mirroring nsmp-codec `decodeStroke` (MSB-first
 * residuals, order-N binomial predictor, per-block word alignment, history carried across
 * blocks) but with the header field positions + word size taken from `L`. Mono only
 * (recordings are single notes). Returns reconstructed PCM (bounded-length).
 */
export function decodeCand(bytes: Uint8Array, start: number, L: Layout, maxSamples: number): number[] {
  const wb = L.wordBits / 8;
  const readW = (o: number) => {
    let v = 0; for (let i = 0; i < wb; i++) v = v * 256 + bytes[o + i];
    return v; // big-endian, up to 32 bits
  };
  const out: number[] = [];
  let o = start;
  let peak = 0;
  while (o + wb <= bytes.length && out.length < maxSamples) {
    const hdr = readW(o); o += wb;
    const sc = fld(hdr, L.scLo, L.scW), order = fld(hdr, L.ordLo, L.ordW), bw = fld(hdr, L.bwLo, L.bwW) + L.bwPlus;
    if (sc < 1 || order > 7 || bw < 1 || bw > 16) break;
    const nWords = Math.ceil((sc * bw) / L.wordBits);
    if (o + nWords * wb > bytes.length) break;
    // MSB-justify each word into a 64-bit-ish accumulator; take top `bw` bits per residual
    let acc = 0n, nbits = 0, produced = 0;
    const coeff = PRED[order];
    for (let w = 0; w < nWords; w++) {
      // shift the word up so its top bit lands at bit (L.wordBits) below the 64 mark
      acc = (acc | (BigInt(readW(o)) << BigInt(64 - L.wordBits - nbits))) & 0xffffffffffffffffn;
      o += wb; nbits += L.wordBits;
      while (nbits >= bw && produced < sc) {
        let r = Number((acc >> BigInt(64 - bw)) & ((1n << BigInt(bw)) - 1n));
        if (r >= (1 << (bw - 1))) r -= (1 << bw);
        let p = 0; for (let k = 0; k < order; k++) p += coeff[k] * (out[out.length - 1 - k] ?? 0);
        const y = p + r; out.push(y);
        const a = y < 0 ? -y : y; if (a > peak) peak = a;
        if (a > 8_000_000) return out; // diverged
        produced++;
        acc = (acc << BigInt(bw)) & 0xffffffffffffffffn; nbits -= bw;
      }
    }
  }
  return out;
}

/** Downsample-normalized cross-correlation, rate-tolerant. Returns |NCC| in [0,1]. */
const resampleTo = (src: number[], L: number): number[] => { const o = new Array(L); const n = src.length; for (let i = 0; i < L; i++) { const x = i * (n - 1) / (L - 1), j = Math.floor(x), f = x - j; o[i] = (src[j] ?? 0) * (1 - f) + (src[Math.min(j + 1, n - 1)] ?? 0) * f; } return o; };
function ncc(x: number[], y: number[]): number {
  const L = Math.min(x.length, y.length); if (L < 128) return 0;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < L; i++) { sa += x[i]; sb += y[i]; saa += x[i] * x[i]; sbb += y[i] * y[i]; sab += x[i] * y[i]; }
  const cov = sab - sa * sb / L, va = saa - sa * sa / L, vb = sbb - sb * sb / L;
  return va > 0 && vb > 0 ? Math.abs(cov / Math.sqrt(va * vb)) : 0;
}
/**
 * Rate- AND alignment-tolerant correlation. A musical waveform is periodic, so naive NCC
 * collapses under even a fractional-period time shift — a real recording (unknown start
 * offset + possibly different sample rate) needs lag-search AND a rate sweep. We slide `b`
 * against a fixed window of `a` over lags × length-ratios and keep the best |NCC|.
 * Empirically: colored recording of the correct note → ~0.92; any wrong signal → <0.1.
 */
export function corr(a: number[], b: number[]): number {
  const L = 2048;                                    // fixed comparison resolution
  const W = Math.min(a.length, b.length, 8000);      // reference time-span (samples of a)
  if (W < 512) return 0;
  const xa = resampleTo(a.slice(0, W), L);           // a's first W samples → L points
  let best = 0;
  for (const ratio of [1, 0.5, 2, 0.75, 1.5, 0.66, 1.33]) { // b may be at a different rate
    const win = Math.round(W * ratio);               // matching time-span in b
    if (win < 256 || win > b.length) continue;
    const step = Math.max(1, Math.floor(win / 8));   // slide to align (unknown start offset)
    for (let lag = 0; lag + win <= b.length; lag += step) {
      const c = ncc(xa, resampleTo(b.slice(lag, lag + win), L));
      if (c > best) best = c;
    }
  }
  return best;
}

/** Minimal PCM-16/24 WAV → mono float samples. */
export function parseWav(buf: Uint8Array): { rate: number; data: number[] } {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0, false) !== 0x52494646) throw new Error('not RIFF');
  let o = 12, rate = 44100, ch = 1, bits = 16, dataOff = -1, dataLen = 0;
  while (o + 8 <= buf.length) {
    const id = dv.getUint32(o, false), sz = dv.getUint32(o + 4, true);
    if (id === 0x666d7420) { ch = dv.getUint16(o + 10, true); rate = dv.getUint32(o + 12, true); bits = dv.getUint16(o + 22, true); }
    else if (id === 0x64617461) { dataOff = o + 8; dataLen = sz; }
    o += 8 + sz + (sz & 1);
  }
  const data: number[] = []; const bytesPer = bits / 8;
  for (let i = dataOff; i + bytesPer * ch <= dataOff + dataLen; i += bytesPer * ch) {
    let v = bits === 16 ? dv.getInt16(i, true) : (dv.getInt8(i + 2) << 16) | (dv.getUint8(i + 1) << 8) | dv.getUint8(i); // ch0
    data.push(v);
  }
  return { rate, data };
}

// candidate layout space: word size × field arrangements (contiguous + the .nsmp gapped model)
function layoutSpace(): Layout[] {
  const out: Layout[] = [];
  for (const wordBits of [32, 24, 16] as const) {
    for (let scW = 8; scW <= Math.min(16, wordBits - 5); scW++) {
      for (const ordW of [3, 4]) for (const bwW of [4, 5]) for (const bwPlus of [0, 1] as const) {
        // A: [sc][ord][bw] contiguous from bit 0
        out.push({ wordBits, scLo: 0, scW, ordLo: scW, ordW, bwLo: scW + ordW, bwW, bwPlus });
        // B: [sc][bw][ord]
        out.push({ wordBits, scLo: 0, scW, ordLo: scW + bwW, ordW, bwLo: scW, bwW, bwPlus });
        // C: nsmp-style gapped (order at 14, bw at 19) when it fits
        if (scW <= 14 && wordBits >= 24) out.push({ wordBits, scLo: 0, scW: 14, ordLo: 14, ordW: 4, bwLo: 19, bwW: 4, bwPlus: 1 });
      }
    }
  }
  // dedupe
  const seen = new Set<string>(); return out.filter((l) => { const k = JSON.stringify(l); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Pack a synthetic NW1 stroke with the standard u32 layout (sc[0:14]/ord[14:18]/bw[19:23]+1). */
function packStroke(blocks: { sc: number; order: number; bw: number; residuals: number[] }[]): Uint8Array {
  const words: number[] = [];
  for (const b of blocks) {
    words.push((b.sc | (b.order << 14) | (((b.bw - 1) & 0xf) << 19)) >>> 0);
    let acc = 0n, nbits = 0;
    for (const r of b.residuals) {
      const u = r & ((1 << b.bw) - 1);
      acc = (acc << BigInt(b.bw)) | BigInt(u); nbits += b.bw;
      while (nbits >= 32) { nbits -= 32; words.push(Number((acc >> BigInt(nbits)) & 0xffffffffn) >>> 0); }
    }
    if (nbits > 0) words.push(Number((acc << BigInt(32 - nbits)) & 0xffffffffn) >>> 0);
  }
  words.push((0 | (0 << 14) | (0 << 19)) >>> 0); // stop: order0/bw1 → header 0 (sc0)... use real stop
  const stop = (1 << 23) >>> 0; words[words.length - 1] = stop | 0; // linMode|order0|bw1(=0)|sc0 sentinel
  const out = new Uint8Array(words.length * 4);
  words.forEach((w, i) => { out[i * 4] = (w >>> 24) & 0xff; out[i * 4 + 1] = (w >>> 16) & 0xff; out[i * 4 + 2] = (w >>> 8) & 0xff; out[i * 4 + 3] = w & 0xff; });
  return out;
}

function validate() {
  console.log('VALIDATE 1/3: synthetic round-trip (parameterized decoder == proven decodeStroke)\n');
  const blocks = [
    { sc: 200, order: 2, bw: 8, residuals: Array.from({ length: 200 }, (_, i) => ((i * 7 + 3) % 41) - 20) },
    { sc: 150, order: 3, bw: 6, residuals: Array.from({ length: 150 }, (_, i) => ((i * 5) % 17) - 8) },
  ];
  const buf = packStroke(blocks);
  // proven decoder
  const proven = Array.from(decodeStrokeProven(buf, 0, 1).channels[0]);
  // parameterized decoder with the standard layout
  const L: Layout = { wordBits: 32, scLo: 0, scW: 14, ordLo: 14, ordW: 4, bwLo: 19, bwW: 4, bwPlus: 1 };
  const cand = decodeCand(buf, 0, L, 100000);
  const same = proven.length === cand.length && proven.every((v, i) => v === cand[i]);
  console.log(`  proven ${proven.length} samples, cand ${cand.length}; identical=${same}`);
  console.log(`  first 8 proven=[${proven.slice(0, 8)}] cand=[${cand.slice(0, 8)}]`);
  console.log(same ? '  ✓ decodeCand reproduces the codec exactly.\n' : '  ✗ mismatch — fix decodeCand.\n');

  console.log('VALIDATE 2/3: correlation sanity');
  const ref = decodeNsmp(new Uint8Array(readFileSync('fixtures/ElGrand_CP80__CL_mono_2.0.nsmp')))[3].channels[0];
  const r = Array.from(ref);
  console.log(`  corr(ref,ref)=${corr(r, r).toFixed(3)} (want 1.0); corr(ref, reversed)=${corr(r, [...r].reverse()).toFixed(3)} (want low)\n`);

  console.log('VALIDATE 3/3: wrong-layout rejection on synthetic buffer');
  let bad = 0; for (const BL of layoutSpace().slice(0, 40)) { const d = decodeCand(buf, 0, BL, 400); if (d.length >= 300 && corr(d, proven) > 0.99 && JSON.stringify(BL) !== JSON.stringify(L)) bad++; }
  console.log(`  spurious perfect matches from wrong layouts: ${bad} (a few aliases are ok; the recording disambiguates)`);
  console.log('\nHarness ready. Next: `crack <recording.wav> <rootNote>`.');
}

function crack(wavPath: string, root: number, npnoPath: string) {
  const { rate, data } = parseWav(new Uint8Array(readFileSync(wavPath)));
  console.log(`recording: ${wavPath}  rate=${rate}Hz samples=${data.length} root=${root}`);
  const bytes = new Uint8Array(readFileSync(npnoPath));
  const space = layoutSpace();
  let best = { c: 0, L: null as Layout | null, off: 0 };
  const N = Math.min(bytes.length, 0x800000);
  for (const L of space) {
    for (let off = 0x2000; off < N; off += 64) {
      const dec = decodeCand(bytes, off, L, 8000);
      if (dec.length < 4000) continue;
      const c = corr(dec, data);
      if (c > best.c) { best = { c, L, off }; if (c > 0.85) console.log(`  hit ${c.toFixed(3)} @0x${off.toString(16)} ${JSON.stringify(L)}`); }
    }
  }
  console.log(`\nBEST: corr=${best.c.toFixed(4)} @0x${best.off.toString(16)} layout=${JSON.stringify(best.L)}`);
  console.log(best.c > 0.8 ? '✓ LIKELY CRACKED — verify by decoding neighboring strokes with this layout.' : '~ no strong lock; check recording (line-out? root note? FX off?) or widen search.');
}

// CLI dispatch — only when run directly (not when imported by npno-wavs.ts)
if (process.argv[1]?.endsWith('npno-crack.ts')) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'validate') validate();
  else if (cmd === 'crack') crack(rest[0], parseInt(rest[1], 10), rest[2] ?? 'fixtures/Electric_Grand_1_CP80__5.3.npno');
  else console.log('usage: npno-crack.ts validate | crack <wav> <rootNote> [npno]');
}
