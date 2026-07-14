import { describe, it, expect } from 'vitest';
import { importWavToNsmp } from './nsmp-convert';
import { encodeWav, parseWav } from './wav';
import { readNsmp, decodeNsmp, readNsmpZones } from './nsmp';

/** A stereo float sine → 16-bit WAV at `rate`. */
function makeWav(rate: number, frames: number, hz: number): Uint8Array {
  const L = new Float32Array(frames), R = new Float32Array(frames);
  for (let i = 0; i < frames; i++) { L[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / rate); R[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / rate + 0.3); }
  return encodeWav([L, R], rate);
}
const peak = (a: ArrayLike<number>) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i])); return m; };

describe('importWavToNsmp', () => {
  for (const codec of [4, 3, 2] as const) {
    it(`codec ${codec}: round-trips a WAV with no resample`, () => {
      const wav = makeWav(48000, 8000, 220);
      const src = parseWav(wav);
      const { bytes, extension, warnings } = importWavToNsmp(wav, { codec, rootKey: 57, keyHigh: 72, name: 'Sine' });

      expect(extension).toBe(codec === 2 ? '.nsmp' : codec === 3 ? '.nsmp3' : '.nsmp4');
      expect(warnings.some((w) => /experimental/i.test(w))).toBe(true);

      const meta = readNsmp(bytes);
      expect(meta.recognized).toBe(true);
      expect(meta.strokeCount).toBe(1);

      // Audio survives parse → encode → decode exactly (no resample).
      const dec = decodeNsmp(bytes);
      expect(dec.length).toBe(1);
      for (let ch = 0; ch < 2; ch++) {
        expect(dec[0].channels[ch].length).toBe(src.channels[ch].length);
        let ok = true;
        for (let i = 0; i < src.channels[ch].length; i++) if (dec[0].channels[ch][i] !== src.channels[ch][i]) { ok = false; break; }
        expect(ok, `codec ${codec} ch ${ch} round-trip`).toBe(true);
      }

      // Zone placement carried (keyHigh).
      const zones = readNsmpZones(bytes);
      expect(zones.length).toBe(1);
      expect(zones[0].keyHigh).toBe(72);
    });
  }

  it('resamples to a target rate (length scales, audio stays sane)', () => {
    const wav = makeWav(48000, 12000, 220); // 0.25 s
    const { bytes } = importWavToNsmp(wav, { codec: 4, targetRate: 35256 });
    const dec = decodeNsmp(bytes);
    expect(dec[0].channels[0].length).toBe(Math.round(12000 * 35256 / 48000)); // 8814
    // ~0.25 s of 220 Hz → ~55 cycles → ~110 zero crossings, peak ~0.5·32767.
    let z = 0; const a = dec[0].channels[0];
    for (let i = 1; i < a.length; i++) if ((a[i - 1] < 0) !== (a[i] < 0)) z++;
    expect(Math.abs(z - 110)).toBeLessThanOrEqual(3);
    expect(Math.abs(peak(a) - 16384)).toBeLessThan(1500);
  });
});
