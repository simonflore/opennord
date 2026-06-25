/**
 * Polyphonic sample player. The pure helpers below decide each voice's zone,
 * pitch, gain, and loop; createSampler (added next) wires them to Web Audio.
 * Plays the SAMPLE only — pitch + loop + velocity, no program filters/FX.
 */
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';
import { SAMPLE_RATE } from './audioPlayer';

/** The zone a note plays: the one covering `midi`; among overlaps, the one whose
 *  velocity range fits, else the first. Null when no zone covers the key. */
export function resolveZone(zones: PlayableZone[], midi: number, velocity: number): PlayableZone | null {
  const covering = zones.filter((z) => midi >= z.keyLow && midi <= z.keyHigh);
  if (covering.length === 0) return null;
  if (covering.length === 1) return covering[0];
  return covering.find((z) => velocity >= z.velLow && velocity <= z.velTop) ?? covering[0];
}

/** Resampling pitch ratio for a note played `midi - rootKey` semitones from root. */
export function playbackRate(rootKey: number, midi: number): number {
  return 2 ** ((midi - rootKey) / 12);
}

/** MIDI velocity → linear gain, clamped to 0..1. */
export function velocityGain(velocity: number): number {
  return Math.max(0, Math.min(1, velocity / 127));
}

/** Loop region of a stroke in seconds (for AudioBufferSourceNode loop points). */
export function loopSeconds(stroke: DecodedStrokeResult): { loop: boolean; start: number; end: number } {
  const l = stroke.loop;
  if (!l || !l.loops) return { loop: false, start: 0, end: 0 };
  return { loop: true, start: l.loopStart / SAMPLE_RATE, end: l.loopEnd / SAMPLE_RATE };
}
