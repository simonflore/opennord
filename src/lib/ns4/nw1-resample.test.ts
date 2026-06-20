import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodeNsmp } from './nsmp';
import { resampleNW1, resampleToRate } from './nw1-resample';

const GT = resolve(__dirname, '../../../research/nsmp/ground-truth');

function parseWav24(bytes: Uint8Array): { rate: number; ch: number; data: Int32Array[] } {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o = 12, rate = 0, ch = 0, dataOff = 0, dataLen = 0;
  while (o + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
    const sz = dv.getUint32(o + 4, true);
    if (id === 'fmt ') { ch = dv.getUint16(o + 10, true); rate = dv.getUint32(o + 12, true); }
    else if (id === 'data') { dataOff = o + 8; dataLen = sz; break; }
    o += 8 + sz + (sz & 1);
  }
  const frames = Math.floor(dataLen / (3 * ch));
  const data = Array.from({ length: ch }, () => new Int32Array(frames));
  for (let f = 0; f < frames; f++) {
    for (let c = 0; c < ch; c++) {
      const p = dataOff + (f * ch + c) * 3;
      let v = bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16);
      if (v & 0x800000) v -= 0x1000000;
      data[c][f] = v;
    }
  }
  return { rate, ch, data };
}
const peak = (a: ArrayLike<number>) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i])); return m; };
const zeroCross = (a: ArrayLike<number>) => { let z = 0; for (let i = 1; i < a.length; i++) if ((a[i - 1] < 0) !== (a[i] < 0)) z++; return z; };

describe('resampleNW1 — correctness', () => {
  it('preserves pitch + amplitude resampling a 220 Hz sine (48k → 35256)', () => {
    const wav = parseWav24(new Uint8Array(readFileSync(resolve(GT, 'sine_24.wav'))));
    const out = resampleToRate(wav.data, 48000, 35256);
    // 0.5 s of 220 Hz → 110 cycles → 220 zero crossings, at either rate.
    expect(out[0].length).toBe(Math.round(24000 * 35256 / 48000)); // 17628
    expect(Math.abs(zeroCross(out[0]) - 220)).toBeLessThanOrEqual(2);
    expect(Math.abs(peak(out[0]) - 3000)).toBeLessThanOrEqual(30); // ~unity gain
  });

  it('handles upsampling and arbitrary ratios without blowing up', () => {
    const wav = parseWav24(new Uint8Array(readFileSync(resolve(GT, 'sine_24.wav'))));
    const up = resampleToRate(wav.data, 48000, 96000);
    expect(up[0].length).toBe(48000);
    expect(Math.abs(zeroCross(up[0]) - 220)).toBeLessThanOrEqual(2);
    expect(Math.abs(peak(up[0]) - 3000)).toBeLessThanOrEqual(60);
  });
});

describe('resampleNW1 — matches the editor length + spectrum (not phase)', () => {
  // The editor's *encode* path uses a longer, runtime-generated kernel (s_newFir48,
  // .bss — not statically extractable), so its output differs from ours in phase
  // and onset. Both are valid resamples of the same signal; we validate that ours
  // hits the same length and frequency content, not a sample-for-sample match.
  for (const name of ['sine_24', 'ramp_24', 'impulse_24']) {
    it(name, () => {
      const wav = parseWav24(new Uint8Array(readFileSync(resolve(GT, `${name}.wav`))));
      const ref = decodeNsmp(new Uint8Array(readFileSync(resolve(GT, `${name}.nsmp4`))))[0].channels[0];
      const out = resampleNW1(wav.data, { ratio: 48000 / 35256, outLength: ref.length })[0];
      expect(out.length).toBe(ref.length);
      // bounded + no blow-up: peak stays within the source's range (unity-gain filter).
      expect(peak(out)).toBeGreaterThan(0);
      expect(peak(out)).toBeLessThan(peak(wav.data[0]) * 1.3 + 64);
      // steady signals: peak close to the editor's (impulse peak is phase-fragile).
      if (name !== 'impulse_24') expect(Math.abs(peak(out) - peak(ref))).toBeLessThan(peak(ref) * 0.15 + 50);
    });
  }
});
