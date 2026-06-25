/**
 * Polyphonic sample player. The pure helpers below decide each voice's zone,
 * pitch, gain, and loop; createSampler (added next) wires them to Web Audio.
 * Plays the SAMPLE only — pitch + loop + velocity, no program filters/FX.
 */
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';
import { normalizeChannels, toAudioBuffer } from '../../lib/ns4/nsmp-audio';
import { SAMPLE_RATE, getSharedCtx } from './audioPlayer';

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

export interface Voice { midi: number; globalID: number; startedAt: number }

export interface Sampler {
  noteOn(midi: number, velocity: number): void;
  noteOff(midi: number): void;
  stopAll(): void;
  /** Currently-sounding notes: midi → zone globalID (for the keyboard highlight). */
  sounding(): Map<number, number>;
  /** A sounding voice for a given stroke, if any (for the waveform playhead). */
  voiceAt(globalID: number): Voice | undefined;
}

const RELEASE = 0.015; // s — short fade so note-off doesn't click

export function createSampler(
  zones: PlayableZone[],
  strokesByGlobalID: Map<number, DecodedStrokeResult>,
): Sampler {
  const buffers = new Map<number, AudioBuffer>(); // globalID → decoded audio (lazy)
  const live = new Map<number, { src: AudioBufferSourceNode; gain: GainNode; voice: Voice }>();

  function bufferFor(ctx: AudioContext, globalID: number): AudioBuffer | null {
    const cached = buffers.get(globalID);
    if (cached) return cached;
    const stroke = strokesByGlobalID.get(globalID);
    if (!stroke || stroke.channels[0]?.length === 0) return null;
    const buf = toAudioBuffer(ctx, normalizeChannels(stroke.channels), SAMPLE_RATE);
    buffers.set(globalID, buf);
    return buf;
  }

  function noteOff(midi: number): void {
    const v = live.get(midi);
    if (!v) return;
    live.delete(midi);
    const ctx = getSharedCtx();
    v.gain.gain.setTargetAtTime(0, ctx.currentTime, RELEASE / 3);
    try { v.src.stop(ctx.currentTime + RELEASE); } catch { /* already stopped */ }
  }

  return {
    noteOn(midi, velocity) {
      const zone = resolveZone(zones, midi, velocity);
      if (!zone) return;
      const stroke = strokesByGlobalID.get(zone.globalID);
      if (!stroke) return;
      const ctx = getSharedCtx();
      const buf = bufferFor(ctx, zone.globalID);
      if (!buf) return;
      noteOff(midi); // retrigger: drop any voice already on this key
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = playbackRate(zone.rootKey, midi);
      const ls = loopSeconds(stroke);
      if (ls.loop) { src.loop = true; src.loopStart = ls.start; src.loopEnd = ls.end; }
      const gain = ctx.createGain();
      gain.gain.value = velocityGain(velocity);
      src.connect(gain).connect(ctx.destination);
      const voice: Voice = { midi, globalID: zone.globalID, startedAt: ctx.currentTime };
      src.onended = () => { if (live.get(midi)?.src === src) live.delete(midi); };
      src.start();
      live.set(midi, { src, gain, voice });
    },
    noteOff,
    stopAll() { for (const midi of [...live.keys()]) noteOff(midi); },
    sounding() {
      const m = new Map<number, number>();
      for (const [midi, v] of live) m.set(midi, v.voice.globalID);
      return m;
    },
    voiceAt(globalID) {
      for (const v of live.values()) if (v.voice.globalID === globalID) return v.voice;
      return undefined;
    },
  };
}
