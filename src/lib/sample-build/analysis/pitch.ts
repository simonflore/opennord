/**
 * A take's pitch (spec §6), by the McLeod estimator the hardware-test tools already use
 * (`estimateF0`). Reads ~200 ms after the attack (50 ms in), mono. Below
 * {@link PITCH_CONFIDENCE_FLOOR} clarity it says nothing: the player picks the key.
 */
import { centsBetween, estimateF0, noteToHz } from '../../hwtest/analysis';
import type { ClipAudio } from '../render';

export const PITCH_CONFIDENCE_FLOOR = 0.8;

export function estimatePitch(audio: ClipAudio, start: number, end: number): { midi: number; cents: number; confidence: number } | null {
  const sr = audio.sampleRate;
  const from = Math.min(end, start + Math.round(0.05 * sr));
  const to = Math.min(end, from + Math.round(0.2 * sr));
  if (to - from < Math.round(0.03 * sr)) return null;
  const x = new Float64Array(to - from);
  for (const ch of audio.channels) for (let i = 0; i < x.length; i++) x[i] += ch[from + i]; // mono sum; the scale doesn't change the pitch
  const f = estimateF0(x, sr, { minHz: 25, maxHz: 4500 });
  if (!f || f.clarity < PITCH_CONFIDENCE_FLOOR) return null;
  const midi = Math.round(69 + centsBetween(f.hz, 440) / 100);
  return { midi, cents: Math.round(centsBetween(f.hz, noteToHz(midi)) * 10) / 10, confidence: f.clarity };
}
