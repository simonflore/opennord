import { describe, it, expect } from 'vitest';
import { resampleForExport } from './nse-resample';

/** RMS over the interior (skip filter warm-up at both edges). */
function rms(a: ArrayLike<number>, skip = 400): number {
  let s = 0, n = 0;
  for (let i = skip; i < a.length - skip; i++) { s += a[i] * a[i]; n++; }
  return Math.sqrt(s / n);
}
function tone(freq: number, rate: number, n: number, amp = 10000): Int32Array {
  const ch = new Int32Array(n);
  for (let i = 0; i < n; i++) ch[i] = Math.round(amp * Math.sin((2 * Math.PI * freq * i) / rate));
  return ch;
}
const gainDb = (out: ArrayLike<number>, inp: ArrayLike<number>) => 20 * Math.log10(rms(out) / rms(inp));

describe('resampleForExport', () => {
  it('outputs round(inLen * dst/src) frames per channel', () => {
    const src = 35002, dst = 44100;
    const inp = tone(1000, src, 4000);
    const [out] = resampleForExport([inp], src, dst);
    expect(out.length).toBe(Math.round((inp.length * dst) / src));
  });

  it('preserves a DC offset (unity passband gain, edge-safe normalisation)', () => {
    const inp = new Int32Array(2000).fill(1234);
    const [out] = resampleForExport([inp], 35002, 44100);
    // Interior is the constant (float, so within FP epsilon); edges stay close too.
    expect(out[out.length >> 1]).toBeCloseTo(1234, 6);
    expect(Math.abs(out[5] - 1234)).toBeLessThan(5);
  });

  it('keeps the low/mid band flat on a 35 kHz→44.1 kHz upsample', () => {
    const src = 35002, dst = 44100, n = 8000;
    for (const f of [1000, 8000, 12000]) {
      const inp = tone(f, src, n);
      const [out] = resampleForExport([inp], src, dst);
      expect(Math.abs(gainDb(out, inp))).toBeLessThan(0.2); // < 0.2 dB deviation
    }
  });

  it('preserves the top octave an upsample should keep — where the import kernel would not', () => {
    // The import downsample kernel drops ~-3.4 dB @14 kHz / -10 @15 / -23 @16; the
    // ratio-aware export filter cuts at ~source Nyquist, so it stays ~flat well up.
    const src = 35002, dst = 44100, n = 8000;
    for (const [f, floor] of [[14000, -0.3], [15000, -0.3], [16000, -1.0]] as const) {
      expect(gainDb(resampleForExport([tone(f, src, n)], src, dst)[0], tone(f, src, n)))
        .toBeGreaterThan(floor);
    }
  });

  it('keeps convolution results floating-point (no premature integer quantisation)', () => {
    // Rounding to Int32 before the downstream peak auto-gain would staircase a quiet
    // stroke; the resampler must return fractional values.
    const src = 35002, dst = 44100, n = 2000;
    const out = resampleForExport([tone(8000, src, n)], src, dst)[0];
    const someFractional = Array.from(out.subarray(500, 1500)).some((v) => !Number.isInteger(v));
    expect(someFractional).toBe(true);
  });

  it('anti-aliases on a (fine-tuned) downsample: a tone above the destination Nyquist is suppressed', () => {
    // 45000 → 44100 (dst Nyquist 22050); a 23 kHz tone would alias if not filtered.
    const inp = tone(23000, 45000, 8000);
    const [out] = resampleForExport([inp], 45000, 44100);
    expect(gainDb(out, inp)).toBeLessThan(-40);
  });

  it('resamples each channel independently', () => {
    const src = 35002, dst = 44100, n = 4000;
    const l = tone(1000, src, n);
    const r = tone(4000, src, n);
    const [ol, or_] = resampleForExport([l, r], src, dst);
    expect(ol.length).toBe(or_.length);
    // Different inputs → different outputs (not accidentally sharing a buffer).
    expect(ol.some((v, i) => v !== or_[i])).toBe(true);
  });
});
