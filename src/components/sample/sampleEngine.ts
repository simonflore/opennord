/**
 * Polyphonic sample player. The pure helpers below decide each voice's zone,
 * pitch, and gain; createSampler wires them to Web Audio. Plays the SAMPLE only
 * — pitch + velocity, no program filters/FX.
 *
 * Audition looping is decided per-sample by stationarity, not by the stored loop
 * flag alone (RE session 2026-07-01). Every `.nsmp` stroke carries hardware loop
 * points (`stroke.loop`) so a held key can sustain past the recording — but
 * applying them blindly makes *decaying* instruments (piano, guitar, vibes)
 * flutter: their loop window is still decaying, so each ~0.3s wrap is an audible
 * repeat that no seam crossfade / phase-align / decay envelope removes (the
 * flutter *is* the repeat). *Sustaining* instruments (strings, organ, pad) sit
 * flat in their loop window and loop seamlessly. Window length can't tell them
 * apart (organ loops are as short as CP80's), but the loop-window RMS decay can:
 * see {@link sampleShouldLoop}. Decaying samples ring out on their natural decay;
 * steady samples sustain by looping. The loop metadata itself stays decoded,
 * shown, and editable elsewhere regardless — this only gates preview playback.
 */
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';
import { normalizeChannels, toAudioBuffer } from '../../lib/ns4/nsmp-audio';
import { SAMPLE_RATE, getSharedCtx } from './audioPlayer';

/** Loop region of a stroke in seconds (for AudioBufferSourceNode loop points). */
export function loopSeconds(stroke: DecodedStrokeResult): { loop: boolean; start: number; end: number } {
  const l = stroke.loop;
  if (!l || !l.loops) return { loop: false, start: 0, end: 0 };
  return { loop: true, start: l.loopStart / SAMPLE_RATE, end: l.loopEnd / SAMPLE_RATE };
}

/** Crossfade length (per-channel samples) for a loop window. Capped at ~40 ms, a
 *  quarter of the loop window, and the pre-loop headroom (`loopStart`) — so there
 *  is always real audio before the loop to blend the tail into. */
export function loopXfadeLen(loopStart: number, loopEnd: number): number {
  const win = loopEnd - loopStart;
  return Math.max(0, Math.min(Math.floor(win / 4), Math.floor(0.04 * SAMPLE_RATE), loopStart));
}

/**
 * Bake an equal-power crossfade into a channel's loop seam, in place. The loop
 * tail `[loopEnd-xf, loopEnd)` is faded from the original tail toward the pre-loop
 * audio `[loopStart-xf, loopStart)`, so when the native AudioBufferSource loop
 * wraps loopEnd→loopStart the join is continuous. No-op without headroom.
 */
export function crossfadeLoop(ch: Float32Array, loopStart: number, loopEnd: number, xfade: number): void {
  if (xfade < 2 || loopStart < xfade || loopEnd - loopStart < xfade || loopEnd > ch.length) return;
  for (let k = 0; k < xfade; k++) {
    const t = k / (xfade - 1);
    const wOut = Math.cos((t * Math.PI) / 2); // tail fades out 1→0
    const wIn = Math.sin((t * Math.PI) / 2);  // pre-loop fades in 0→1
    ch[loopEnd - xfade + k] = ch[loopEnd - xfade + k] * wOut + ch[loopStart - xfade + k] * wIn;
  }
}

/** RMS decay in dB across a stroke's loop window (loud start → quieter end):
 *  positive = the loop region is still decaying, ~0 = steady/sustaining, negative
 *  = swelling. Null when the stroke has no loop. Uses up to a third of the window
 *  (capped 1024 samples) at each edge. Channel 0 is representative for the decay. */
export function loopWindowDecayDb(stroke: DecodedStrokeResult): number | null {
  const l = stroke.loop;
  if (!l || !l.loops) return null;
  const ch = stroke.channels[0];
  if (!ch || ch.length === 0) return null;
  const w = Math.min(1024, Math.floor((l.loopEnd - l.loopStart) / 3));
  if (w < 1) return null;
  const rms = (s: number, e: number): number => {
    let x = 0, n = 0;
    for (let i = s; i < e; i++) if (i >= 0 && i < ch.length) { x += ch[i] * ch[i]; n++; }
    return Math.sqrt(x / Math.max(1, n));
  };
  const rStart = rms(l.loopStart, l.loopStart + w);
  const rEnd = rms(l.loopEnd - w, l.loopEnd);
  return 20 * Math.log10(rStart / Math.max(1e-9, rEnd));
}

/** dB decay at or below which a sample's loops are considered steady enough to
 *  sustain seamlessly. Above it the loop region is still decaying and looping
 *  flutters, so the sample rings out instead. Tuned 2026-07-01 against the local
 *  corpus: strings/violins/pad/organ ≤0.7 dB (loop); CP80/vibes/12-string/rain-
 *  piano ≥2.0 dB (ring out). See docs/… / the [[audition-does-not-loop]] note. */
export const LOOP_MAX_DECAY_DB = 1.2;

/**
 * Whether a sample should apply its loops in audition, decided once per sample by
 * the median loop-window decay across its looping strokes (per-sample so a patch
 * is consistent — no mix of sustaining and ringing-out notes). False when nothing
 * loops. Steady instruments (low decay) sustain; decaying ones ring out.
 */
export function sampleShouldLoop(strokes: Iterable<DecodedStrokeResult>, maxDecayDb = LOOP_MAX_DECAY_DB): boolean {
  const decays: number[] = [];
  for (const s of strokes) { const d = loopWindowDecayDb(s); if (d !== null) decays.push(d); }
  if (decays.length === 0) return false;
  decays.sort((a, b) => a - b);
  const median = decays[Math.floor(decays.length / 2)];
  return median <= maxDecayDb;
}

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

/**
 * Optional amp envelope for the "synth playground" — a configurable ADSR layered
 * over playback for auditioning a sample before transfer. It is NOT decoded from
 * or stored in the `.nsmp` (the real amp env lives in the `.ns4` program); it's a
 * pure synth layer. `attack`/`decay`/`release` are seconds, `sustain` is 0..1.
 */
export interface AmpEnvelope { attack: number; decay: number; sustain: number; release: number }

/** Neutral playground default: near-instant attack, full sustain, smooth release —
 *  ≈ flat playback but without an on/off click. */
export const DEFAULT_ENVELOPE: AmpEnvelope = { attack: 0.005, decay: 0, sustain: 1, release: 0.15 };

/**
 * Gain at time `t` (seconds since note-on) for an ADSR scaled to `peak` (the
 * velocity gain). `releaseAt` is the seconds-since-note-on when the key was
 * released, or null while still held. Mirrors the Web-Audio schedule in `noteOn`/
 * `noteOff` so the envelope is unit-testable without an AudioContext.
 */
export function envGainAt(env: AmpEnvelope, peak: number, t: number, releaseAt: number | null): number {
  const { attack, decay, sustain, release } = env;
  const held = (x: number): number => {
    if (attack > 0 && x < attack) return peak * (x / attack);
    if (decay > 0 && x < attack + decay) return peak * (1 - (1 - sustain) * ((x - attack) / decay));
    return peak * sustain;
  };
  if (releaseAt == null || t <= releaseAt) return held(t);
  if (release <= 0) return 0;
  const dt = t - releaseAt;
  return dt >= release ? 0 : held(releaseAt) * (1 - dt / release);
}

/** The slice of AudioParam the envelope schedule needs — lets the schedule be
 *  unit-tested with a recorder instead of a live AudioContext. */
export interface GainSchedule {
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
}

/**
 * Schedule the attack→decay→sustain automation at `t0` (the release fires on
 * note-off). Kept in lockstep with {@link envGainAt}, the unit-tested reference:
 * in particular, zero attack starts AT `peak` — not at 0 with the decay ramping
 * up from silence.
 */
export function scheduleAttackDecay(g: GainSchedule, e: AmpEnvelope, peak: number, t0: number): void {
  const aEnd = t0 + e.attack;
  if (e.attack > 0) {
    g.setValueAtTime(0, t0);
    g.linearRampToValueAtTime(peak, aEnd);
  } else {
    g.setValueAtTime(peak, t0); // instant punch, matching envGainAt(…, 0, null)
  }
  if (e.decay > 0 && e.sustain < 1) g.linearRampToValueAtTime(peak * e.sustain, aEnd + e.decay);
  else g.setValueAtTime(peak * e.sustain, aEnd); // no decay → step to sustain
}

export interface Voice { midi: number; globalID: number; startedAt: number; rate: number }

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
  /** Optional synth-playground envelope, read at each note-on. Returns null (or is
   *  omitted) when the playground is off → flat gain + short anti-click release. */
  env?: () => AmpEnvelope | null,
): Sampler {
  const buffers = new Map<number, AudioBuffer>(); // globalID → decoded audio (lazy)
  const live = new Map<number, { src: AudioBufferSourceNode; gain: GainNode; voice: Voice; release: number }>();
  // Decide once per sample: sustain steady loops, ring out decaying ones (see
  // sampleShouldLoop). Gates both the seam crossfade and the source loop below.
  const loopSample = sampleShouldLoop(strokesByGlobalID.values());

  function bufferFor(ctx: AudioContext, globalID: number): AudioBuffer | null {
    const cached = buffers.get(globalID);
    if (cached) return cached;
    const stroke = strokesByGlobalID.get(globalID);
    if (!stroke || stroke.channels[0]?.length === 0) return null;
    const norm = normalizeChannels(stroke.channels);
    // Only crossfade the seam of loops we'll actually play (steady samples); a
    // ringing-out sample plays straight through, so its buffer is left untouched.
    if (loopSample && stroke.loop?.loops) {
      const { loopStart, loopEnd } = stroke.loop;
      const xf = loopXfadeLen(loopStart, loopEnd);
      for (const ch of norm) crossfadeLoop(ch, loopStart, loopEnd, xf);
    }
    const buf = toAudioBuffer(ctx, norm, SAMPLE_RATE);
    buffers.set(globalID, buf);
    return buf;
  }

  function noteOff(midi: number): void {
    const v = live.get(midi);
    if (!v) return;
    live.delete(midi);
    const ctx = getSharedCtx();
    const now = ctx.currentTime;
    // Linear release from the current level to silence — works for both the flat
    // path (release = RELEASE) and a scheduled ADSR (release = env.release).
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.linearRampToValueAtTime(0, now + v.release);
    try { v.src.stop(now + v.release); } catch { /* already stopped */ }
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
      const rate = playbackRate(zone.rootKey, midi);
      src.playbackRate.value = rate;
      // Steady samples sustain by looping their region (the buffer already carries
      // a crossfaded seam); decaying samples leave `src.loop` false and ring out on
      // the recorded decay. Per-sample decision — see sampleShouldLoop / module header.
      if (loopSample) {
        const ls = loopSeconds(stroke);
        if (ls.loop) { src.loop = true; src.loopStart = ls.start; src.loopEnd = ls.end; }
      }
      const gain = ctx.createGain();
      const peak = velocityGain(velocity);
      const e = env?.() ?? null;
      const t0 = ctx.currentTime;
      let release = RELEASE;
      if (e) {
        scheduleAttackDecay(gain.gain, e, peak, t0);
        release = e.release;
      } else {
        gain.gain.value = peak; // playground off → flat gain (today's behavior)
      }
      src.connect(gain).connect(ctx.destination);
      const voice: Voice = { midi, globalID: zone.globalID, startedAt: t0, rate };
      src.onended = () => { if (live.get(midi)?.src === src) live.delete(midi); };
      src.start();
      live.set(midi, { src, gain, voice, release });
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
