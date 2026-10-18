/**
 * Audio a WAV reader can't read (FLAC, Ogg, MP3), decoded by the browser. Kept apart from the
 * pure import code, which takes it as a parameter. A browser decodes into the rate of the
 * context it is given, so the context is made at the file's own rate, read from its header:
 * the SFZ's start, end and loop points are frames of the file as it is, and stay right.
 */
import type { ClipAudio } from './render';

const ascii = (bytes: Uint8Array, at: number, text: string) => [...text].every((c, i) => bytes[at + i] === c.charCodeAt(0));
const find = (bytes: Uint8Array, text: string, within: number) => {
  for (let at = 0; at + text.length <= Math.min(bytes.length, within); at++) if (ascii(bytes, at, text)) return at;
  return -1;
};

/** MPEG audio sample rates by version bits (3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5) and rate index. */
const MPEG_RATES: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/**
 * The sample rate a compressed audio file was made at, from its header: FLAC (STREAMINFO),
 * Ogg Vorbis (identification header), Opus (always decoded at 48 kHz), MP3 (first frame).
 * Undefined for anything else.
 */
export function sourceSampleRate(bytes: Uint8Array): number | undefined {
  if (ascii(bytes, 0, 'fLaC') && bytes.length >= 21) {
    const rate = (bytes[18] << 12) | (bytes[19] << 4) | (bytes[20] >> 4);
    return rate > 0 ? rate : undefined;
  }
  if (ascii(bytes, 0, 'OggS')) {
    if (find(bytes, 'OpusHead', 256) >= 0) return 48000;
    const at = find(bytes, '\x01vorbis', 256);
    if (at >= 0 && at + 16 <= bytes.length) {
      const rate = new DataView(bytes.buffer, bytes.byteOffset + at + 12, 4).getUint32(0, true);
      return rate > 0 ? rate : undefined;
    }
    return undefined;
  }
  // MP3: skip an ID3v2 tag (10 bytes + a syncsafe size), then read the first frame header.
  let at = 0;
  if (ascii(bytes, 0, 'ID3') && bytes.length >= 10) {
    at = 10 + ((bytes[6] & 0x7f) << 21 | (bytes[7] & 0x7f) << 14 | (bytes[8] & 0x7f) << 7 | (bytes[9] & 0x7f)) + (bytes[5] & 0x10 ? 10 : 0);
  }
  for (const end = Math.min(bytes.length - 3, at + 65536); at < end; at++) {
    if (bytes[at] !== 0xff || (bytes[at + 1] & 0xe0) !== 0xe0) continue;
    const version = (bytes[at + 1] >> 3) & 3, layer = (bytes[at + 1] >> 1) & 3;
    const bitrate = bytes[at + 2] >> 4, rateIndex = (bytes[at + 2] >> 2) & 3;
    if (version === 1 || layer === 0 || bitrate === 15 || rateIndex === 3) continue;
    return MPEG_RATES[version][rateIndex];
  }
  return undefined;
}

export async function decodeWithBrowser(bytes: Uint8Array): Promise<ClipAudio> {
  const Offline = (globalThis as { OfflineAudioContext?: typeof OfflineAudioContext }).OfflineAudioContext;
  if (!Offline) throw new Error('This browser can’t read this kind of audio file; convert it to WAV.');
  const rate = sourceSampleRate(bytes);
  if (!rate) throw new Error('OpenNord can’t tell this audio file’s sample rate, so its loop points would land wrong; convert it to WAV.');
  const ctx = new Offline(1, 1, rate);
  let buffer: AudioBuffer;
  try {
    // The bytes are read for this decode alone, so their own buffer can be handed over (and detached).
    const whole = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength;
    buffer = await ctx.decodeAudioData((whole ? bytes : bytes.slice()).buffer as ArrayBuffer);
  } catch {
    throw new Error('This audio file couldn’t be read; convert it to WAV.');
  }
  const channels = Array.from({ length: Math.min(2, buffer.numberOfChannels) }, (_, c) => buffer.getChannelData(c));
  return { sampleRate: buffer.sampleRate, channels };
}
