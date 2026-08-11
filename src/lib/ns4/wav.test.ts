import { describe, it, expect } from 'vitest';
import { encodeWav, parseWav, nseExportRate, encodeStrokeWav, NSE_SAMPLE_RATES, NSE_EXPORT_SAMPLE_RATE } from './wav';
import { NSMP_SAMPLE_RATE } from './nsmp';

/** Read a little-endian uint at byte offset. */
function u32(b: Uint8Array, o: number) { return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24); }
function u16(b: Uint8Array, o: number) { return b[o] | (b[o + 1] << 8); }
function ascii(b: Uint8Array, o: number, n: number) { return String.fromCharCode(...b.slice(o, o + n)); }
function i16(b: Uint8Array, o: number) { const v = u16(b, o); return v >= 0x8000 ? v - 0x10000 : v; }

describe('encodeWav', () => {
  it('writes a canonical mono 16-bit PCM WAV header', () => {
    const wav = encodeWav([new Float32Array([0, 0, 0, 0])], 44100);
    expect(ascii(wav, 0, 4)).toBe('RIFF');
    expect(ascii(wav, 8, 4)).toBe('WAVE');
    expect(ascii(wav, 12, 4)).toBe('fmt ');
    expect(u32(wav, 16)).toBe(16);        // PCM fmt chunk size
    expect(u16(wav, 20)).toBe(1);         // audio format = PCM
    expect(u16(wav, 22)).toBe(1);         // channels
    expect(u32(wav, 24)).toBe(44100);     // sample rate
    expect(u16(wav, 32)).toBe(2);         // block align = channels * 2
    expect(u16(wav, 34)).toBe(16);        // bits per sample
    expect(ascii(wav, 36, 4)).toBe('data');
    expect(u32(wav, 40)).toBe(4 * 2);     // data bytes = frames * channels * 2
    expect(wav.length).toBe(44 + 4 * 2);
  });

  it('full-scale samples clamp to int16 extremes; zero stays zero', () => {
    const wav = encodeWav([new Float32Array([1, -1, 0, 2, -2])], 48000);
    expect(i16(wav, 44)).toBe(32767);     // +1.0
    expect(i16(wav, 46)).toBe(-32768);    // -1.0
    expect(i16(wav, 48)).toBe(0);
    expect(i16(wav, 50)).toBe(32767);     // +2.0 clamped
    expect(i16(wav, 52)).toBe(-32768);    // -2.0 clamped
    expect(u32(wav, 24)).toBe(48000);
  });

  it('interleaves stereo frames L,R,L,R…', () => {
    const L = new Float32Array([1, 0]);
    const R = new Float32Array([0, -1]);
    const wav = encodeWav([L, R], 44100);
    expect(u16(wav, 22)).toBe(2);         // channels
    expect(u16(wav, 32)).toBe(4);         // block align
    expect(i16(wav, 44)).toBe(32767);     // frame0 L = +1
    expect(i16(wav, 46)).toBe(0);         // frame0 R = 0
    expect(i16(wav, 48)).toBe(0);         // frame1 L = 0
    expect(i16(wav, 50)).toBe(-32768);    // frame1 R = -1
    expect(wav.length).toBe(44 + 2 * 2 * 2);
  });

  it('appends a smpl loop chunk with start/end/unity-note when a loop is given', () => {
    const wav = encodeWav([new Float32Array([0, 0, 0, 0])], 44100, { start: 1, end: 3, unityNote: 62 });
    const smpl = 44 + 4 * 2;              // after data chunk
    expect(ascii(wav, smpl, 4)).toBe('smpl');
    expect(u32(wav, smpl + 4)).toBe(60);  // chunk body = 36 fields + 24 loop
    expect(u32(wav, smpl + 20)).toBe(62); // dwMIDIUnityNote
    expect(u32(wav, smpl + 36)).toBe(1);  // cSampleLoops
    expect(u32(wav, smpl + 52)).toBe(1);  // loop start frame
    expect(u32(wav, smpl + 56)).toBe(3);  // loop end frame
    expect(u32(wav, 4)).toBe(36 + 4 * 2 + 68); // RIFF size includes the smpl chunk
    expect(wav.length).toBe(44 + 4 * 2 + 68);
  });

  it('defaults the unity note to 60 and stays parseable with a smpl chunk present', () => {
    const wav = encodeWav([new Float32Array([1, -1, 0, 0])], 44100, { start: 0, end: 2 });
    const smpl = 44 + 4 * 2;
    expect(u32(wav, smpl + 20)).toBe(60); // default C4
    const parsed = parseWav(wav);         // parser skips the unknown chunk
    expect(parsed.channelCount).toBe(1);
    expect(parsed.channels[0].length).toBe(4);
  });
});

describe('nseExportRate', () => {
  it('keeps an NSE-legal rate and upsamples anything else to 44.1 kHz', () => {
    expect(nseExportRate(44100)).toBe(44100);
    expect(nseExportRate(48000)).toBe(48000);
    expect(nseExportRate(96000)).toBe(96000);
    // the native storage rate (~35 kHz) is exactly what NSE rejects → the default
    expect(NSMP_SAMPLE_RATE).not.toBe(44100);              // guard: really a non-NSE rate
    expect(nseExportRate(NSMP_SAMPLE_RATE)).toBe(44100);
    expect(nseExportRate(22050)).toBe(NSE_EXPORT_SAMPLE_RATE);
    expect(NSE_SAMPLE_RATES).toContain(NSE_EXPORT_SAMPLE_RATE);
  });
});

describe('encodeStrokeWav', () => {
  it('resamples a native-rate stroke to 44.1 kHz and writes that rate (not the +4-semitone relabel)', () => {
    const frames = 100;
    const src = new Int32Array(frames);
    for (let i = 0; i < frames; i++) src[i] = Math.round(1000 * Math.sin((2 * Math.PI * 8 * i) / frames));
    const { bytes, sampleRate } = encodeStrokeWav([src], NSMP_SAMPLE_RATE);
    expect(sampleRate).toBe(44100);
    expect(u32(bytes, 24)).toBe(44100);                    // header rate is standard → NSE-importable
    const outFrames = u32(bytes, 40) / 2;                  // mono 16-bit → 2 bytes/frame
    // Duration is preserved, so pitch stays correct: out/dstRate ≈ in/srcRate.
    expect(outFrames).toBe(Math.round((frames * 44100) / NSMP_SAMPLE_RATE));
    expect(Math.abs(outFrames / 44100 - frames / NSMP_SAMPLE_RATE)).toBeLessThan(1e-4);
  });

  it('rescales loop points into the resampled timebase', () => {
    const frames = 200;
    const src = new Int32Array(frames);
    for (let i = 0; i < frames; i++) src[i] = (i % 20) - 10;
    const { bytes } = encodeStrokeWav([src], NSMP_SAMPLE_RATE, { start: 35, end: 175, unityNote: 60 });
    const outFrames = u32(bytes, 40) / 2;
    const smpl = 44 + outFrames * 2;
    expect(ascii(bytes, smpl, 4)).toBe('smpl');
    const scale = 44100 / NSMP_SAMPLE_RATE;
    expect(u32(bytes, smpl + 52)).toBe(Math.round(35 * scale));   // loop start, scaled
    expect(u32(bytes, smpl + 56)).toBe(Math.round(175 * scale));  // loop end, scaled
    expect(u32(bytes, smpl + 20)).toBe(60);                       // unity note unchanged (pitch preserved)
  });

  it('encodes an already-NSE-rate stroke without resampling (frame count unchanged)', () => {
    const src = new Int32Array([0, 500, -500, 1000, -1000, 0]);
    const { bytes, sampleRate } = encodeStrokeWav([src], 48000);
    expect(sampleRate).toBe(48000);
    expect(u32(bytes, 24)).toBe(48000);
    expect(u32(bytes, 40) / 2).toBe(src.length);            // no resample → same frame count
  });
});
