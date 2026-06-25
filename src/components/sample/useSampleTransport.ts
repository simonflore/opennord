// src/components/sample/useSampleTransport.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { SAMPLE_RATE, getSharedCtx } from './audioPlayer';
import type { Sampler, Voice } from './sampleEngine';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';

/** Normalized 0..1 playhead for a sounding voice. One-shots advance and clamp at
 *  1; looping strokes wrap within [loopStart, loopEnd]. `now`/`startedAt` are
 *  AudioContext seconds; `rate` is the voice's playbackRate. */
export function playheadFraction(
  voice: Voice, stroke: DecodedStrokeResult, now: number, rate: number,
): number {
  const len = stroke.channels[0]?.length ?? 0;
  if (len === 0) return 0;
  let posSamples = (now - voice.startedAt) * rate * SAMPLE_RATE;
  const l = stroke.loop;
  if (l && l.loops && l.loopEnd > l.loopStart && posSamples > l.loopEnd) {
    const span = l.loopEnd - l.loopStart;
    posSamples = l.loopStart + ((posSamples - l.loopStart) % span);
  }
  return Math.max(0, Math.min(1, posSamples / len));
}

/** Polls the sampler each frame while anything sounds, exposing the sounding map
 *  (for the keyboard) and a per-stroke playhead (for the waveform). */
export function useSampleTransport(sampler: Sampler | null) {
  const [sounding, setSounding] = useState<Map<number, number>>(new Map());
  const raf = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (!sampler) return;
    setSounding(sampler.sounding());
    raf.current = requestAnimationFrame(tick);
  }, [sampler]);

  const refresh = useCallback(() => {
    if (raf.current == null) raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => { if (raf.current != null) cancelAnimationFrame(raf.current); }, []);

  const playheadFor = useCallback((globalID: number, stroke: DecodedStrokeResult): number | null => {
    if (!sampler) return null;
    const v = sampler.voiceAt(globalID);
    if (!v) return null;
    return playheadFraction(v, stroke, getSharedCtx().currentTime, v.rate);
  }, [sampler]);

  return { sounding, playheadFor, refresh };
}
