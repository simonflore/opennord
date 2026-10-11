/**
 * Polyphonic sample player. The pure helpers below decide each voice's zone,
 * pitch, and gain; createSampler wires them to Web Audio. Plays the SAMPLE only
 * — pitch + velocity, no program filters/FX.
 *
 * A held key sustains the way the instrument's sample DSP does it
 *: playback runs to the end of the stroke, jumps back
 * to the loop begin with no crossfade (the stream is cut so the join is continuous),
 * and from the moment it enters the loop the voice loses level at the stroke's stored
 * decay rate. Sustaining instruments (strings, organ, pad) carry a loop of a second or
 * more and no decay; decaying ones (piano, guitar, vibes) loop a few cycles and decay.
 */
import type { PlayableZone } from '../../lib/ns4/playable-zones';
import type { DecodedStrokeResult, NoteAlternates, SampleUnison } from '../../lib/ns4/nsmp';
import { normalizeChannels, toAudioBuffer } from '../../lib/ns4/nsmp-audio';
import { NSMP_SAMPLE_RATE, unisonDetuneRawToCents } from '../../lib/ns4/nsmp';
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

/** One voice of a note: whose recording it plays, its detune, and its left/right gains. */
export interface UnisonVoice {
  /** The key whose recording sounds (the played key, or a neighbour repitched to it). */
  sourceKey: number;
  detuneCents: number;
  gainL: number;
  gainR: number;
}

/** Cents per unit of the instrument's pitch sum (1/65536 of a semitone). */
const CENTS_PER_PITCH_UNIT = 100 / 65536;

/** Left/right gains of a unison voice when the sample has no values of its own. */
const BUILT_IN_UNISON_PAN: readonly [number, number] = [0.9327, 0.3606];

/**
 * Detune of the outer voices of a unison stack, in cents (one goes up, the other down).
 * A sample with its own values stores one per Unison setting, raw·25 pitch units; without
 * them the instrument uses 512 units per setting at middle C, doubling every 20 keys down
 * and capped at 2560.
 */
export function unisonDetuneCents(level: number, key: number, u: SampleUnison | null): number {
  if (level <= 0) return 0;
  if (u?.custom) return unisonDetuneRawToCents([u.detuneMax, u.detuneMax2, u.detuneMax3][Math.min(level, 3) - 1]);
  return Math.min(512 * level * 2 ** ((60 - key) / 20), 2560) * CENTS_PER_PITCH_UNIT;
}

/** Left/right gains of the first outer voice (the second mirrors them): equal-power,
 *  from the sample's width for this Unison setting (0 = centred, 100 = hard left/right). */
function unisonPan(level: number, u: SampleUnison | null): readonly [number, number] {
  if (!u?.custom) return BUILT_IN_UNISON_PAN;
  const p = 0.5 + Math.floor([u.panMax, u.panMax2, u.panMax3][Math.min(level, 3) - 1] / 2) / 100;
  return [Math.sqrt(p), Math.sqrt(Math.max(0, 1 - p))];
}

/**
 * The voices one note starts for a Unison setting (0–3, the program's switch — not stored
 * in the sample). Off is the key's own recording. Unison 1 and 2 add a second voice;
 * Unison 3 adds a centre voice where the key has two neighbours. The extra voices play
 * the recordings of the key's `alternates` (neighbouring keys), repitched to the played
 * key; above the sample's top key, or without alternates, the key's own recording is
 * doubled. Levels are the instrument's own, relative to 1 for a single voice.
 */
export function unisonVoices(level: number, key: number, u: SampleUnison | null, alternates: readonly number[]): UnisonVoice[] {
  if (level <= 0) return [{ sourceKey: key, detuneCents: 0, gainL: 1, gainR: 1 }];
  const alts = u && key > u.topKey ? [] : alternates;
  const [a, b] = unisonPan(level, u);
  let d = unisonDetuneCents(level, key, u);
  if (level >= 3 && alts.length >= 2) {
    const centre = u ? 10 ** (u.gainDb3 / 20) : 1;
    return [
      { sourceKey: key, detuneCents: 0, gainL: centre, gainR: centre },
      { sourceKey: alts[0], detuneCents: d, gainL: a, gainR: b },
      { sourceKey: alts[1], detuneCents: -d, gainL: b, gainR: a },
    ];
  }
  const partner = alts[0] ?? key;
  // Two voices on one recording at Unison 1 take the sample's "same recording" detune.
  if (partner === key && level === 1 && u?.custom) d = unisonDetuneRawToCents(u.sameDetuneMin);
  return [
    { sourceKey: key, detuneCents: d, gainL: a, gainR: b },
    { sourceKey: partner, detuneCents: -d, gainL: b, gainR: a },
  ];
}

/** Order in which repeats of a key with two alternates take their recording: own, first,
 *  second, own, second, first — every recording equally often, never one twice running. */
const REPEAT_ORDER = [0, 1, 2, 0, 2, 1];

/**
 * The key whose recording the `step`-th strike of `key` plays, for a sample that varies
 * repeated notes. With one alternate it alternates strictly; with two it cycles through
 * all three without playing one twice in a row. The instrument follows a longer fixed
 * order with the same property; this is ours.
 */
export function repeatSource(step: number, key: number, alternates: readonly number[]): number {
  const pool = [key, ...alternates.slice(0, 2)];
  if (pool.length === 1) return key;
  return pool.length === 2 ? pool[step % 2] : pool[REPEAT_ORDER[step % REPEAT_ORDER.length]];
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

/** Voice slots of the instrument's sample DSP. Each voice of
 *  a unison stack takes one. */
export const MAX_VOICES = 56;

/** Fade-in of a starting voice: the DSP ramps each new voice in over about 1 ms. */
const START_FADE = 0.001;

/** A stolen voice is multiplied by 0.96525 per envelope update (21,700 a second): a time
 *  constant of 1.3 ms, 60 dB down in 9 ms. */
const STEAL_TIME_CONSTANT = 0.0013;
const STEAL_FADE = 0.009;

export function createSampler(
  zones: PlayableZone[],
  strokesByGlobalID: Map<number, DecodedStrokeResult>,
  /** Optional synth-playground envelope, read at each note-on. Returns null (or is
   *  omitted) when the playground is off → flat gain + short anti-click release. */
  env?: () => AmpEnvelope | null,
  /** Sample-level voicing. `detuneCents` shifts pitch to the sample's stored global
   *  detune. `unisonLevel` is the Unison setting to audition (0–3; a getter is read at
   *  each note-on) and `unison` the sample's own voicing values for it. `alternates`
   *  lists, per key, the neighbouring keys whose recordings a unison voice or a repeated
   *  note may play ({@link unisonVoices}, {@link repeatSource}). */
  opts?: {
    detuneCents?: number;
    unison?: SampleUnison | null;
    unisonLevel?: number | (() => number);
    alternates?: readonly NoteAlternates[] | null;
  },
): Sampler {
  const detuneMul = detuneRatio(opts?.detuneCents ?? 0);
  const unison = opts?.unison ?? null;
  const unisonLevel = (): number => {
    const l = opts?.unisonLevel ?? 0;
    return typeof l === 'function' ? l() : l;
  };
  const alternates = opts?.alternates ?? null;
  // Repeated notes vary only where the sample asks for it, up to its top key.
  const variesRepeats = (unison?.randomStrokeMode ?? 0) !== 0;
  const strikes = new Map<number, number>(); // key → note-ons so far (the repeat step)
  const buffers = new Map<number, AudioBuffer>(); // globalID → decoded audio (lazy)
  type Playing = { src: AudioBufferSourceNode; gain: GainNode };
  /** A held note: its voices, and the level its envelope has reached at a given time
   *  (computed from the schedule — an automated AudioParam's `.value` isn't reliable). */
  const live = new Map<number, { srcs: Playing[]; voice: Voice; release: number; levelAt: (time: number) => number }>();
  /** Voices fading out after key-up or a steal, oldest first; they still hold a slot. */
  const fading: Playing[] = [];

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
    const level = v.levelAt(now);
    for (const p of v.srcs) {
      p.gain.gain.cancelScheduledValues(now);
      p.gain.gain.setValueAtTime(level, now);
      p.gain.gain.linearRampToValueAtTime(0, now + v.release);
      try { p.src.stop(now + v.release); } catch { /* already stopped */ }
      fading.push(p);
    }
  }

  /** Cut a voice short for a new one: the DSP's fast exponential fade. */
  function cut(p: Playing, now: number): void {
    p.gain.gain.cancelScheduledValues(now);
    p.gain.gain.setTargetAtTime(0, now, STEAL_TIME_CONSTANT);
    try { p.src.stop(now + STEAL_FADE); } catch { /* already stopped */ }
  }

  /** A voice ended (played out, decayed away, or finished fading): give its slot back,
   *  and forget the note once its last voice is gone. */
  function ended(midi: number, p: Playing): void {
    const f = fading.indexOf(p);
    if (f >= 0) fading.splice(f, 1);
    const v = live.get(midi);
    if (!v) return;
    const i = v.srcs.indexOf(p);
    if (i < 0) return;
    v.srcs.splice(i, 1);
    if (v.srcs.length === 0) live.delete(midi);
  }

  /** Free `needed` voice slots: voices already fading go first, then the oldest held
   *  note (`live` keeps note-on order). A cut voice keeps its slot only for the 9 ms of
   *  its fade, which the count ignores. */
  function makeRoom(needed: number): void {
    const now = getSharedCtx().currentTime;
    let used = fading.length;
    for (const v of live.values()) used += v.srcs.length;
    while (used + needed > MAX_VOICES && fading.length > 0) {
      cut(fading.shift()!, now);
      used--;
    }
    for (const [midi, v] of [...live]) {
      if (used + needed <= MAX_VOICES) return;
      used -= v.srcs.length;
      live.delete(midi);
      for (const p of v.srcs) cut(p, now);
    }
  }

  /** A voice's output: straight through when centred at unity (keeps a stereo recording
   *  as it is), else its own left and right gains — the DSP scales a stereo voice's two
   *  channels separately and sends a mono voice to both. */
  function connectOut(ctx: AudioContext, gain: GainNode, gainL: number, gainR: number): void {
    if (gainL === 1 && gainR === 1) { gain.connect(ctx.destination); return; }
    gain.channelCount = 2;
    gain.channelCountMode = 'explicit';
    const split = ctx.createChannelSplitter(2);
    const merge = ctx.createChannelMerger(2);
    gain.connect(split);
    [gainL, gainR].forEach((g, ch) => {
      const side = ctx.createGain();
      side.gain.value = g;
      split.connect(side, ch);
      side.connect(merge, 0, ch);
    });
    merge.connect(ctx.destination);
  }

  return {
    noteOn(midi, velocity) {
      const own = resolveZone(zones, midi, velocity);
      if (!own) return;
      const ctx = getSharedCtx();
      // A voice plays the recording of its source key's zone, repitched to the played
      // key; a source without a playable recording falls back to the key's own.
      const sourceFor = (key: number) => {
        const zone = (key === midi ? own : resolveZone(zones, key, velocity)) ?? own;
        const stroke = strokesByGlobalID.get(zone.globalID);
        const buf = stroke ? bufferFor(ctx, zone.globalID) : null;
        return stroke && buf ? { zone, stroke, buf } : null;
      };
      const alts = alternates?.[midi];
      const level = unisonLevel();
      let stack = unisonVoices(level, midi, unison, alts?.unison ?? []);
      // A repeated single voice steps through the neighbouring recordings. (On the
      // instrument the voices of a unison stack rotate too; here the stack stays put.)
      if (level <= 0 && variesRepeats && alts && unison && midi <= unison.topKey) {
        const step = strikes.get(midi) ?? 0;
        strikes.set(midi, step + 1);
        stack = [{ ...stack[0], sourceKey: repeatSource(step, midi, alts.random) }];
      }
      const voices = stack.map((uv) => ({ uv, source: sourceFor(uv.sourceKey) ?? sourceFor(midi) }));
      const first = voices[0].source;
      if (!first) return;
      noteOff(midi); // retrigger: drop any voice already on this key
      makeRoom(voices.length);
      const peak = velocityGain(velocity);
      const e = env?.() ?? null;
      const t0 = ctx.currentTime;
      const release = e ? e.release : RELEASE;
      const baseRate = playbackRate(first.zone.rootKey, midi) * detuneMul;
      // The instrument's unison gains leave no headroom over a single voice, and these
      // buffers are normalised to full scale: scale the stack back so that even voices
      // in phase (one recording doubled) stay within it.
      const headroom = 1 / Math.max(1, ...[0, 1].map((ch) => voices.reduce((sum, { uv }) => sum + (ch ? uv.gainR : uv.gainL), 0)));

      const srcs: Playing[] = voices.flatMap(({ uv, source }) => {
        if (!source) return [];
        const src = ctx.createBufferSource();
        src.buffer = source.buf;
        const rate = playbackRate(source.zone.rootKey, midi) * detuneMul * detuneRatio(uv.detuneCents);
        src.playbackRate.value = rate;
        const ls = loopSeconds(source.stroke);
        if (ls.loop) { src.loop = true; src.loopStart = ls.start; src.loopEnd = ls.end; }
        const gain = ctx.createGain();
        if (e) {
          scheduleAttackDecay(gain.gain, e, peak, t0);
        } else { // playground off → flat gain behind the DSP's start fade
          gain.gain.setValueAtTime(0, t0);
          gain.gain.linearRampToValueAtTime(peak, t0 + START_FADE);
        }
        // The loop decay gets a gain stage of its own, so the key-up release (which
        // reschedules `gain`) fades whatever level the decay has reached.
        const decay = loopDecay(source.stroke, rate);
        if (decay) {
          const fall = ctx.createGain();
          fall.gain.setValueAtTime(1, t0);
          fall.gain.setTargetAtTime(0, t0 + decay.at, decay.timeConstant);
          src.connect(fall).connect(gain);
        } else {
          src.connect(gain);
        }
        connectOut(ctx, gain, uv.gainL * headroom, uv.gainR * headroom);
        src.start();
        if (decay) src.stop(t0 + decay.at + (DECAY_STOP_DB / DB_PER_NEPER) * decay.timeConstant);
        const playing = { src, gain };
        src.onended = () => ended(midi, playing);
        return [playing];
      });

      const voice: Voice = { midi, globalID: first.zone.globalID, startedAt: t0, rate: baseRate };
      const levelAt = (time: number): number =>
        (e ? envGainAt(e, peak, time - t0, null) : peak * Math.min(1, Math.max(0, (time - t0) / START_FADE)));
      live.set(midi, { srcs, voice, release, levelAt });
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
