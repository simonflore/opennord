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
import type { DecodedStrokeResult, SampleUnison } from '../../lib/ns4/nsmp';
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

/** Pitch ratio for a detune in cents (100 cents = one semitone). The sample's
 *  stored global detune (`DSP2Detune` scale) shifts every voice by this factor so
 *  audition plays at the authored pitch, not just the zone root. */
export function detuneRatio(cents: number): number {
  return 2 ** (cents / 1200);
}

/** One voice of a unison stack: its detune (cents), stereo pan (−1..+1) and gain. */
export interface UnisonVoice { detuneCents: number; pan: number; gain: number }

/** Outer-voice detune for the audition unison stack, in cents. The unison block's
 *  detune-spread SCALE isn't pinned yet (the known corpus stores detune 0), so the
 *  stack choruses with a small musical default rather than a raw value — swap this
 *  for the real scale once a min/max unison export pins it. */
const UNISON_AUDITION_DETUNE = 8;

/** Max per-note detune jitter (± cents) for round-robin audition — small enough to
 *  read as human variation, not a tuning error. */
const ROUND_ROBIN_JITTER = 4;

/**
 * Voice spreads for a unison stack, or a single centered voice when unison is off.
 * Voice count and pan% come from the decoded {@link SampleUnison}; the detune
 * spread is an audition approximation ({@link UNISON_AUDITION_DETUNE}) and gains are
 * 1/√n so the stack stays level. APPROXIMATE — an audition aid, not a faithful
 * reproduction of the Nord's unison engine (which we can't fully decode yet).
 */
export function unisonVoices(u: SampleUnison | null): UnisonVoice[] {
  if (!u || !u.active) return [{ detuneCents: 0, pan: 0, gain: 1 }];
  const n = Math.max(2, Math.min(4, u.numVoiceSame || 2));
  const panW = Math.min(1, Math.max(0, u.panMax, u.panMax2, u.panMax3) / 100);
  const g = 1 / Math.sqrt(n);
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * 2 - 1; // −1..+1 across the stack
    return { detuneCents: t * UNISON_AUDITION_DETUNE, pan: t * panW, gain: g };
  });
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
  /** Sample-level voicing. `detuneCents` shifts pitch to the sample's stored global
   *  detune; `unison` (when active) stacks detuned/panned voices ({@link unisonVoices});
   *  `roundRobin` applies a subtle per-note detune jitter so repeated notes aren't
   *  identical (these libraries are single-sample-per-key, so there are no recorded
   *  takes to cycle — this is the audition analogue of the Nord's DSP-side variation). */
  opts?: { detuneCents?: number; unison?: SampleUnison | null; roundRobin?: boolean },
): Sampler {
  const detuneMul = detuneRatio(opts?.detuneCents ?? 0);
  const stack = unisonVoices(opts?.unison ?? null); // 1 centered voice when unison is off
  const roundRobin = opts?.roundRobin ?? false;
  const buffers = new Map<number, AudioBuffer>(); // globalID → decoded audio (lazy)
  const live = new Map<number, { srcs: { src: AudioBufferSourceNode; gain: GainNode }[]; voice: Voice; release: number }>();
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
    // Linear release from the current level to silence, on every voice of the stack
    // — works for both the flat path (release = RELEASE) and a scheduled ADSR.
    for (const { src, gain } of v.srcs) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + v.release);
      try { src.stop(now + v.release); } catch { /* already stopped */ }
    }
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
      // Round-robin: nudge the whole note by a fresh random detune so repeats vary.
      const rrCents = roundRobin ? (Math.random() * 2 - 1) * ROUND_ROBIN_JITTER : 0;
      const baseRate = playbackRate(zone.rootKey, midi) * detuneMul * detuneRatio(rrCents);
      const peak = velocityGain(velocity);
      const e = env?.() ?? null;
      const t0 = ctx.currentTime;
      const release = e ? e.release : RELEASE;
      const ls = loopSample ? loopSeconds(stroke) : null;

      // Build the voice stack: one centered voice normally, or the unison spread
      // (detuned + panned copies) when the sample has unison engaged.
      const srcs = stack.map((uv) => {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = baseRate * detuneRatio(uv.detuneCents);
        // Steady samples sustain by looping (the buffer carries a crossfaded seam);
        // decaying samples leave loop false and ring out. See sampleShouldLoop.
        if (ls?.loop) { src.loop = true; src.loopStart = ls.start; src.loopEnd = ls.end; }
        const gain = ctx.createGain();
        const vpeak = peak * uv.gain;
        if (e) scheduleAttackDecay(gain.gain, e, vpeak, t0);
        else gain.gain.value = vpeak; // playground off → flat gain
        src.connect(gain);
        // Pan the copy only when the stack spreads; a single centered voice keeps
        // the original gain→destination path (and mono/stereo passthrough) exactly.
        if (uv.pan !== 0 && ctx.createStereoPanner) {
          const panner = ctx.createStereoPanner();
          panner.pan.value = uv.pan;
          gain.connect(panner).connect(ctx.destination);
        } else {
          gain.connect(ctx.destination);
        }
        src.start();
        return { src, gain };
      });

      const voice: Voice = { midi, globalID: zone.globalID, startedAt: t0, rate: baseRate };
      // Clean up the key when the primary (center) source ends, if it's still ours.
      srcs[0].src.onended = () => { if (live.get(midi)?.srcs[0]?.src === srcs[0].src) live.delete(midi); };
      live.set(midi, { srcs, voice, release });
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
