/**
 * Polyphonic piano player for auditioning a `.npno` on this machine. Every key plays: it
 * takes the recording of its key zone, picked by touch, re-pitched to the note, and several
 * notes sound at once. Recordings are decoded on demand and nothing leaves the device
 * (`docs/LEGAL.md` — local access only).
 *
 * It follows the maintainers’ notes where that is cheap and leaves the rest out:
 *  - pitch: `100·(key − root − 4)` cents from the recording (§2.3), without stretch tuning;
 *  - level: the touch attenuation at 0.2 dB a step (§2.2). A zone's layers peak alike at the
 *    same attenuation, so each recording is brought to full scale and the touch sets the level;
 *  - key-up: one fixed exponential fade, not the per-piano damper rates (§3);
 *  - sustain: a held note stays in the recording's loop and falls at the stored rate (§1.4);
 *  - no release sounds, unison, pedal noise or string resonance.
 */
import { getSharedCtx } from '@/components/sample/audioPlayer';
import { normalizeChannels, toAudioBuffer } from '@/lib/ns4/nsmp-audio';
import { NSP_SAMPLE_RATE, decodeNspStroke, strokeFor, touchAttenuation, type NspDirectory } from '@/lib/ns4/nsp-audio';
import { NSP_ROOT_OFFSET, type NspZone } from '@/lib/ns4/nsp';
import { getErrorMessage } from '@/lib/errors';

/** Notes sounding at once (held or fading). The instrument has 114 piano voices (§5). */
export const MAX_VOICES = 64;

/** Key-up fade: 60 dB down in about a third of a second, a mid-range factory damper (§3.1). */
const RELEASE_TIME_CONSTANT = 0.05;
/** A restruck or stolen voice goes in about 6 ms (§2.5). */
const STEAL_TIME_CONSTANT = 0.001;
/** Time constants until a fading voice is stopped (−60 dB at 6.9). */
const FADE_SPAN = 7;

/** Envelope updates a second on the instrument (§1.3); the loop decay is per update. */
const ENVELOPE_RATE = 22_050;
/** Time constants until a note decaying in its loop is stopped (about −78 dB). */
const LOOP_SPAN = 9;

/** Decoded audio kept ready, in samples (frames × channels): about 96 MB of Float32. */
const CACHE_SAMPLES = 24_000_000;

/** The key zone `midi` plays and the re-pitch from its recording, in semitones; `null` when
 *  no zone covers the key, or the key map doesn't agree with the recordings. */
export function pianoKey(zones: readonly NspZone[], zoneCount: number, midi: number): { zone: number; semitones: number } | null {
  if (zones.length !== zoneCount) return null;
  const zone = zones.findIndex((z) => z.lowNote <= midi && midi <= z.highNote);
  return zone < 0 ? null : { zone, semitones: midi - zones[zone].rootNote - NSP_ROOT_OFFSET };
}

/** Linear gain of a touch: the attenuation `strokeFor` selects by, at 0.2 dB a step. */
export function attenuationGain(velocity: number): number {
  return 10 ** (-touchAttenuation(velocity) / 100);
}

/** Seconds for a looping note's level to fall by 1/e, from the stroke's per-update factor;
 *  `null` when the note holds its level (factor 1) or the value is unusable. */
export function loopDecayTimeConstant(factor: number | undefined): number | null {
  return factor !== undefined && factor > 0 && factor < 1 ? -1 / (ENVELOPE_RATE * Math.log(factor)) : null;
}

export interface PianoEngine {
  noteOn(midi: number, velocity: number): void;
  noteOff(midi: number): void;
  stopAll(): void;
  /** Held notes: midi → key zone (for the keyboard highlight). */
  sounding(): Map<number, number>;
}

export interface PianoEngineEvents {
  /** A recording couldn't be decoded; the key stays silent. */
  onError?: (message: string) => void;
  /** The held notes changed (a key went down or up, or a note rang out). */
  onChange?: () => void;
}

export function createPianoEngine(
  bytes: Uint8Array,
  dir: NspDirectory,
  zones: readonly NspZone[],
  { onError, onChange }: PianoEngineEvents = {},
): PianoEngine {
  const zoneCount = dir.strokes.reduce((n, s) => Math.max(n, s.zone + 1), 0);
  type Voice = { midi: number; zone: number; src: AudioBufferSourceNode; gain: GainNode };
  const held = new Map<number, Voice>(); // insertion order = oldest first
  const fading = new Set<Voice>();
  const buffers = new Map<number, AudioBuffer>(); // stroke index → audio, least recently used first
  let cached = 0;

  function bufferFor(ctx: AudioContext, index: number): AudioBuffer {
    const hit = buffers.get(index);
    if (hit) { buffers.delete(index); buffers.set(index, hit); return hit; }
    const buf = toAudioBuffer(ctx, normalizeChannels(decodeNspStroke(bytes, dir, dir.strokes[index])), NSP_SAMPLE_RATE);
    buffers.set(index, buf);
    cached += buf.length * buf.numberOfChannels;
    for (const [old, b] of buffers) {
      if (cached <= CACHE_SAMPLES || old === index) break;
      buffers.delete(old);
      cached -= b.length * b.numberOfChannels;
    }
    return buf;
  }

  function fade(v: Voice, timeConstant: number): void {
    const now = getSharedCtx().currentTime;
    fading.add(v);
    v.gain.gain.setTargetAtTime(0, now, timeConstant);
    try { v.src.stop(now + timeConstant * FADE_SPAN); } catch { /* already stopped */ }
  }

  function release(midi: number, timeConstant: number): void {
    const v = held.get(midi);
    if (!v) return;
    held.delete(midi);
    fade(v, timeConstant);
    onChange?.();
  }

  return {
    noteOn(midi, velocity) {
      const key = pianoKey(zones, zoneCount, midi);
      const stroke = key && strokeFor(dir, key.zone, velocity);
      if (!key || !stroke) return;
      const ctx = getSharedCtx();
      let buffer: AudioBuffer;
      try {
        buffer = bufferFor(ctx, stroke.index);
      } catch (e) {
        onError?.(`Couldn't play this note: ${getErrorMessage(e)}`);
        return;
      }
      release(midi, STEAL_TIME_CONSTANT); // restrike: the old note makes way
      while (held.size + fading.size >= MAX_VOICES) {
        const oldest = fading.values().next().value ?? held.values().next().value;
        if (!oldest) break;
        if (fading.has(oldest)) {
          fading.delete(oldest);
          try { oldest.src.stop(); } catch { /* already stopped */ }
        } else {
          release(oldest.midi, STEAL_TIME_CONSTANT);
        }
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const rate = 2 ** (key.semitones / 12);
      src.playbackRate.value = rate;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(attenuationGain(velocity), now);
      src.connect(gain);
      // A held note stays in its loop; from there its level falls at the stroke's own rate, on
      // a gain stage of its own so the key-up fade multiplies on top.
      let fadedOutAt: number | null = null;
      const decay = stroke.loop ? loopDecayTimeConstant(stroke.loopDecay) : null;
      if (stroke.loop) {
        src.loop = true;
        src.loopStart = stroke.loop.start / NSP_SAMPLE_RATE;
        src.loopEnd = (stroke.loop.start + stroke.loop.length) / NSP_SAMPLE_RATE;
      }
      if (decay !== null) {
        const entersLoop = now + src.loopStart / rate;
        const fall = ctx.createGain();
        fall.gain.setValueAtTime(1, now);
        fall.gain.setTargetAtTime(0, entersLoop, decay);
        gain.connect(fall);
        fall.connect(ctx.destination);
        fadedOutAt = entersLoop + decay * LOOP_SPAN;
      } else {
        gain.connect(ctx.destination);
      }
      const voice: Voice = { midi, zone: key.zone, src, gain };
      // A note that rings out clears itself; one already replaced on its key leaves the new one alone.
      src.onended = () => {
        fading.delete(voice);
        if (held.get(midi) === voice) { held.delete(midi); onChange?.(); }
      };
      held.set(midi, voice);
      src.start();
      if (fadedOutAt !== null) src.stop(fadedOutAt);
      onChange?.();
    },
    noteOff(midi) { release(midi, RELEASE_TIME_CONSTANT); },
    stopAll() { for (const midi of [...held.keys()]) release(midi, STEAL_TIME_CONSTANT); },
    sounding() { return new Map([...held].map(([midi, v]) => [midi, v.zone])); },
  };
}
