/**
 * Polyphonic sample player. The pure helpers below decide each voice's zone,
 * pitch, and gain; createSampler wires them to Web Audio. Plays the SAMPLE only
 * — pitch + velocity, no program filters/FX.
 *
 * A held key sustains the way the instrument's sample DSP does it
 * (`docs/SAMPLE-ENGINE.md` §1): playback runs to the end of the stroke, jumps back
 * to the loop begin with no crossfade (the stream is cut so the join is continuous),
 * and from the moment it enters the loop the voice loses level at the stroke's stored
 * decay rate. Sustaining instruments (strings, organ, pad) carry a loop of a second or
 * more and no decay; decaying ones (piano, guitar, vibes) loop a few cycles and decay.
 */
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult, SampleUnison } from '../../lib/ns4/nsmp';
import { normalizeChannels, toAudioBuffer } from '../../lib/ns4/nsmp-audio';
import { NSMP_SAMPLE_RATE } from '../../lib/ns4/nsmp';
import { getSharedCtx } from './audioPlayer';

/** Loop region of a stroke in seconds (for AudioBufferSourceNode loop points).
 *  Uses the stroke's own replay rate so the seconds match the buffer built at that
 *  same rate ({@link createSampler}) — a rate mismatch would drift the loop points. */
export function loopSeconds(stroke: DecodedStrokeResult): { loop: boolean; start: number; end: number } {
  const l = stroke.loop;
  if (!l || !l.loops) return { loop: false, start: 0, end: 0 };
  const sr = stroke.sampleRate || NSMP_SAMPLE_RATE;
  return { loop: true, start: l.loopStart / sr, end: l.loopEnd / sr };
}

/** When and how fast a voice decays inside its loop. */
export interface LoopDecay {
  /** Seconds after note-on at which playback enters the loop. */
  at: number;
  /** Time constant of the exponential fall, in seconds (level × 1/e per constant). */
  timeConstant: number;
}

/** dB per neper: a level falling 1/e per time constant loses this many dB per constant. */
const DB_PER_NEPER = 20 / Math.LN10;

/**
 * The loop decay of a stroke played at `rate` (the resampling ratio), or null when the
 * stroke holds its level or doesn't loop. The loop is reached sooner at a higher pitch,
 * but the decay itself runs on the clock: the DSP multiplies the voice's gain once per
 * envelope update, whatever the pitch.
 */
export function loopDecay(stroke: DecodedStrokeResult, rate: number): LoopDecay | null {
  const l = stroke.loop;
  if (!l || !l.loops || !(l.decayDbPerSecond > 0)) return null;
  const sr = stroke.sampleRate || NSMP_SAMPLE_RATE;
  return { at: l.loopStart / sr / rate, timeConstant: DB_PER_NEPER / l.decayDbPerSecond };
}

/** Linear gain of a {@link LoopDecay} at `t` seconds after note-on — the unit-testable
 *  mirror of the `setTargetAtTime` schedule in `noteOn`. */
export function loopDecayGainAt(d: LoopDecay, t: number): number {
  return t <= d.at ? 1 : Math.exp(-(t - d.at) / d.timeConstant);
}

/** A decayed voice is stopped once it has lost this much: far below audibility, and it
 *  frees the source instead of looping silence for as long as the key is held. */
const DECAY_STOP_DB = 100;

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

  function bufferFor(ctx: AudioContext, globalID: number): AudioBuffer | null {
    const cached = buffers.get(globalID);
    if (cached) return cached;
    const stroke = strokesByGlobalID.get(globalID);
    if (!stroke || stroke.channels[0]?.length === 0) return null;
    const buf = toAudioBuffer(ctx, normalizeChannels(stroke.channels), stroke.sampleRate);
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
      const ls = loopSeconds(stroke);

      // Build the voice stack: one centered voice normally, or the unison spread
      // (detuned + panned copies) when the sample has unison engaged.
      const srcs = stack.map((uv) => {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const rate = baseRate * detuneRatio(uv.detuneCents);
        src.playbackRate.value = rate;
        if (ls.loop) { src.loop = true; src.loopStart = ls.start; src.loopEnd = ls.end; }
        const gain = ctx.createGain();
        const vpeak = peak * uv.gain;
        if (e) scheduleAttackDecay(gain.gain, e, vpeak, t0);
        else gain.gain.value = vpeak; // playground off → flat gain
        // The loop decay gets a gain stage of its own, so the key-up release (which
        // reschedules `gain`) fades whatever level the decay has reached.
        const decay = loopDecay(stroke, rate);
        if (decay) {
          const fall = ctx.createGain();
          fall.gain.setValueAtTime(1, t0);
          fall.gain.setTargetAtTime(0, t0 + decay.at, decay.timeConstant);
          src.connect(fall).connect(gain);
        } else {
          src.connect(gain);
        }
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
        if (decay) src.stop(t0 + decay.at + (DECAY_STOP_DB / DB_PER_NEPER) * decay.timeConstant);
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
