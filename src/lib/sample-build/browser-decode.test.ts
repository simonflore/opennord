import { describe, it, expect } from 'vitest';
import { sourceSampleRate } from './browser-decode';

const bytes = (...parts: (string | number[])[]) => Uint8Array.from(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)));
const u32le = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];

describe('sourceSampleRate', () => {
  it('reads FLAC\'s STREAMINFO', () => {
    // 44100 Hz = 0xAC44, as the top 20 bits of bytes 18–20.
    const head = bytes('fLaC', [0, 0, 0, 34], new Array(10).fill(0), [0x0a, 0xc4, 0x40]);
    expect(sourceSampleRate(head)).toBe(44100);
  });

  it('reads an Ogg Vorbis identification header, and knows Opus is 48 kHz', () => {
    expect(sourceSampleRate(bytes('OggS', new Array(24).fill(0), '\x01vorbis', u32le(0), [2], u32le(22050)))).toBe(22050);
    expect(sourceSampleRate(bytes('OggS', new Array(24).fill(0), 'OpusHead', [1, 2]))).toBe(48000);
  });

  it('reads the first MP3 frame, past an ID3 tag', () => {
    const frame = [0xff, 0xfb, 0x90, 0x00]; // MPEG-1 layer III, 128 kbit/s, 44.1 kHz
    expect(sourceSampleRate(bytes(frame))).toBe(44100);
    expect(sourceSampleRate(bytes('ID3', [4, 0, 0, 0, 0, 0, 4], [0, 0, 0, 0], frame))).toBe(44100);
    expect(sourceSampleRate(bytes([0xff, 0xf3, 0x94, 0x00]))).toBe(24000); // MPEG-2 layer III
  });

  it('says nothing for what it can\'t read', () => {
    expect(sourceSampleRate(bytes('RIFF'))).toBeUndefined();
    expect(sourceSampleRate(new Uint8Array(0))).toBeUndefined();
  });
});
