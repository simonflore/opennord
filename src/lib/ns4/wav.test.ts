import { describe, it, expect } from 'vitest';
import { encodeWav } from './wav';

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
});
