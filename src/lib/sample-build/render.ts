/** A take's audio as the writers want it: cut, gain applied, 16-bit range (spec §9). */
import { clamp16 } from '../ns4/nw1-resample';
import type { Take } from './model';

/** A clip's audio at its own rate, −1…1 per channel. */
export interface ClipAudio { sampleRate: number; channels: Float32Array[] }
export type ReadAudio = (clipId: string) => ClipAudio | undefined;

export interface RenderedTake {
  channels: Int32Array[];
  sampleRate: number;
  /** Loop start in frames of the cut; null for a one-shot. */
  loopStart: number | null;
}

const pcmCache = new WeakMap<ClipAudio, Int32Array>();

/** A clip's first channel as 16-bit PCM numbers, for drawing (WaveCanvas); made once per clip audio. */
export function toPcm16(audio: ClipAudio): Int32Array {
  let pcm = pcmCache.get(audio);
  if (!pcm) {
    const ch = audio.channels[0];
    pcm = new Int32Array(ch.length);
    for (let i = 0; i < ch.length; i++) pcm[i] = clamp16(Math.round(ch[i] * 32767));
    pcmCache.set(audio, pcm);
  }
  return pcm;
}

/**
 * How many frames of a take's loop crossfade fit: no more than the loop is long, nor than there
 * is take before the loop start (the fade reads that far back).
 */
export function crossfadeFrames(take: Take, sampleRate: number): number {
  if (!take.loop || !take.loopCrossfadeMs) return 0;
  const want = Math.round((take.loopCrossfadeMs / 1000) * sampleRate);
  return Math.max(0, Math.min(want, take.end - take.loop.start, take.loop.start - take.start));
}

export function renderTake(take: Take, audio: ClipAudio): RenderedTake {
  const g = 10 ** (take.gainDb / 20) * 32767;
  const x = crossfadeFrames(take, audio.sampleRate);
  const channels = audio.channels.map((ch) => {
    const out = new Int32Array(take.end - take.start);
    for (let i = 0; i < out.length; i++) out[i] = clamp16(Math.round(ch[take.start + i] * g));
    // The join: the last x frames before End fade over to the x frames before the loop start, so
    // the frame played before the jump is the one that came before the loop start. Linear (equal
    // gain): the two sides are alike at a good loop, and an equal-power fade would swell there.
    if (take.loop && x > 0) {
      const from = take.end - x, pre = take.loop.start - x;
      for (let i = 0; i < x; i++) {
        const w = (i + 1) / x;
        out[from - take.start + i] = clamp16(Math.round((ch[from + i] * (1 - w) + ch[pre + i] * w) * g));
      }
    }
    return out;
  });
  return { channels, sampleRate: audio.sampleRate, loopStart: take.loop ? take.loop.start - take.start : null };
}
