/**
 * Split one recording into notes on silence (spec §6; NSE: "Threshold Level used to detect
 * silence between Samples in Audio File"). RMS in 10 ms frames against `thresholdDb`; loud
 * stretches closer than `minPauseMs` merge; each note keeps `preRollMs` before its onset so the
 * attack is whole, and runs to where the sound falls below the threshold.
 */
import type { ClipAudio } from '../render';

export interface SplitOptions { thresholdDb: number; minPauseMs: number; preRollMs?: number; minNoteMs?: number }
export interface Region { start: number; end: number }

export function splitOnSilence(audio: ClipAudio, opts: SplitOptions): Region[] {
  const sr = audio.sampleRate;
  const total = audio.channels[0]?.length ?? 0;
  const hop = Math.max(1, Math.round(0.01 * sr));
  const frames = Math.ceil(total / hop);
  const floorSquared = 10 ** (opts.thresholdDb / 10); // compare mean squares, no square root per frame
  const loud: boolean[] = [];
  for (let f = 0; f < frames; f++) {
    const from = f * hop, to = Math.min(total, from + hop);
    let sum = 0;
    for (const ch of audio.channels) for (let i = from; i < to; i++) sum += ch[i] * ch[i];
    const n = (to - from) * audio.channels.length;
    loud.push(n > 0 && sum / n > floorSquared);
  }
  const pause = Math.ceil(opts.minPauseMs / 10);
  const runs: { a: number; b: number }[] = []; // loud frames [a, b)
  for (let f = 0; f < frames; f++) {
    if (!loud[f]) continue;
    const last = runs.at(-1);
    if (last && f - last.b < pause) last.b = f + 1;
    else runs.push({ a: f, b: f + 1 });
  }
  const pre = Math.round(((opts.preRollMs ?? 10) / 1000) * sr);
  const minLen = Math.round(((opts.minNoteMs ?? 50) / 1000) * sr);
  // A note's length is measured from its onset, not from the pre-roll kept before it.
  return runs
    .filter((r) => Math.min(total, r.b * hop) - r.a * hop >= minLen)
    .map((r) => ({ start: Math.max(0, r.a * hop - pre), end: Math.min(total, r.b * hop) }));
}
