/**
 * Approximate audio preview of one Stage 4 synth layer, rendered from the
 * program's decoded parameters alone.
 *
 * Scope: ANALOG oscillator, PURE category (sine, triangle, saw, square,
 * pulse 33/10, white noise), all six filter types, and the amp/filter
 * envelopes. Other oscillator types (FM-H/FM-I, WAVE, samples, and the other
 * analog categories whose OSC CTRL mapping isn't recovered yet) return `null`
 * from {@link previewParamsFromLayer}.
 *
 * The signal flow follows the voice-engine DSP structure documented in
 * `docs/SYNTH-ENGINE.md`: a polyBLEP oscillator that fades out near Nyquist,
 * a zero-delay-feedback (trapezoidal) state-variable filter (two in series for
 * LP24, a four-stage one-pole ladder with a soft clipper for LPM), and
 * the firmware's envelope segment shapes (linear attack, exponential decay and
 * release that fall 40 dB in the displayed time) and its resonance law
 * (`k = 2·(1 − r/128)²`). Those shapes and formulas are documented in
 * `docs/SYNTH-ENGINE.md` ("Parameter scaling") and implemented once, in
 * `synth-scaling.ts`; no firmware tables or coefficients are copied, and the
 * other constants here are our own choices. The result is a recognisable sketch
 * of the sound, not a bit-exact emulation.
 *
 * Level: a resonant filter is driven with its input scaled down as the resonance
 * rises ({@link resonanceInputGain}), LP24 resonates on its second stage only, the
 * band-pass state saturates softly (which bounds self-oscillation), and the output
 * goes through a soft limiter with headroom ({@link softLimit}) instead of a hard
 * clamp. So even resonance 10 sings rather than square-wave clips.
 */
import type { NS4Layer } from './types';
import { ENV_DISPLAY_DROP, keyTrackFactor, oscTuneSemitones, resonanceDamping } from './synth-scaling';

export { ENV_DISPLAY_DROP };

export type PreviewWave = 'sine' | 'triangle' | 'saw' | 'square' | 'pulse33' | 'pulse10' | 'noise';
export type PreviewFilterType = 'LP12' | 'LP24' | 'LPM' | 'LPHP' | 'BP' | 'HP';

/**
 * Envelope times in seconds, as the panel displays them: attack = time of the
 * linear rise to full level; decay/release = time to fall 40 dB.
 * `decay: Infinity` holds the peak level until release.
 */
export interface PreviewEnv {
  attack: number;
  decay: number;
  release: number;
}

export interface PreviewFilter {
  type: PreviewFilterType;
  cutoffHz: number;
  /** 0..1 (the panel's 0.0–10.0 divided by 10; raw value / 127). Not used by LPHP. */
  resonance: number;
  /** LPHP only: the high-pass corner (the resonance knob sets it in that mode). */
  hpHz?: number;
  /**
   * Filter envelope sweep at full envelope, in octaves. Assumption: the panel's
   * 0.0–10.0 reads as octaves, so full scale sweeps most of the 14 Hz–32 kHz
   * cutoff range. Not confirmed against hardware.
   */
  envOctaves: number;
  env: PreviewEnv;
  /** Keyboard tracking as a fraction: off = 0, 1/3, 2/3, 3/3 = 1 (relative to middle C). */
  track: number;
}

export interface SynthPreviewParams {
  wave: PreviewWave;
  ampEnv: PreviewEnv;
  /** `null` when the layer's filter is switched off. */
  filter: PreviewFilter | null;
  /**
   * The layer's oscillator pitch offset in semitones: octave shift × 12 plus pitch
   * coarse and fine (`oscTuneSemitones`). 0 when absent.
   */
  pitchSemitones?: number;
}

export interface RenderOptions {
  /** MIDI note number (60 = middle C). */
  note: number;
  sampleRate?: number;
  /** How long the key is held before release, in seconds. */
  holdSeconds?: number;
  /**
   * Hard cap on the rendered length (hold + release tail), in seconds. A note still
   * sounding there is released early and faded out over {@link END_FADE_SECONDS}.
   */
  maxSeconds?: number;
}

/** Fade-out at the `maxSeconds` cap, so a long note never ends on a click. */
export const END_FADE_SECONDS = 0.008;

const PURE_WAVES: Record<string, PreviewWave> = {
  'Pure Sine': 'sine',
  'Pure Triangle': 'triangle',
  'Pure Saw': 'saw',
  'Pure Square': 'square',
  'Pure Pulse 33': 'pulse33',
  'Pure Pulse 10': 'pulse10',
  'Pure White Noise': 'noise',
};

const FILTER_TYPES: readonly PreviewFilterType[] = ['LP12', 'LP24', 'LPM', 'LPHP', 'BP', 'HP'];

/** The decoder's "filter track" labels, in raw order (0..3) for {@link keyTrackFactor}. */
const TRACK_LABELS = ['off', '1/3', '2/3', '3/3'];

/** "0.5 ms" → 0.0005, "1.82 s" → 1.82, "inf" → Infinity. */
export function parseSeconds(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const t = s.trim();
  if (t === 'inf') return Infinity;
  const m = /^(\d+(?:\.\d+)?)\s*(ms|s)$/.exec(t);
  if (!m) return undefined;
  const v = Number(m[1]);
  return m[2] === 'ms' ? v / 1000 : v;
}

/** "466 Hz" → 466, "3.7 kHz" → 3700. */
export function parseHz(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const m = /^(\d+(?:\.\d+)?)\s*(Hz|kHz)$/.exec(s.trim());
  if (!m) return undefined;
  const v = Number(m[1]);
  return m[2] === 'kHz' ? v * 1000 : v;
}

/** "+18 cent" / "- 3 semi" / "+ 0 semi" → 18 / −3 / 0. */
function parseSigned(s: string | undefined): number | undefined {
  const m = /^([+-])\s*(\d+(?:\.\d+)?)/.exec(s?.trim() ?? '');
  return m ? (m[1] === '-' ? -1 : 1) * Number(m[2]) : undefined;
}

function parsePlain(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const v = Number(s.trim());
  return Number.isFinite(v) ? v : undefined;
}

/** The label inside a "3 (Pure Saw)"-style display string. */
function label(s: string | undefined): string | undefined {
  return s ? (/\((.*)\)/.exec(s)?.[1] ?? s) : undefined;
}

function env(e: { attack?: string; decay?: string; release?: string } | undefined): PreviewEnv {
  return {
    attack: parseSeconds(e?.attack) ?? 0.0005,
    decay: parseSeconds(e?.decay) ?? Infinity,
    release: parseSeconds(e?.release) ?? 0.003,
  };
}

/**
 * Preview parameters for a decoded synth layer, or `null` when the layer uses
 * an oscillator this preview can't render (see the module comment).
 */
export function previewParamsFromLayer(l: NS4Layer): SynthPreviewParams | null {
  if (l.kind !== 'synth' || l.source !== 'analog') return null;
  if (label(l.oscType) !== 'ANALOG') return null;
  const waveLabel = label(l.oscWave);
  const wave = waveLabel ? PURE_WAVES[waveLabel] : undefined;
  if (!wave) return null;

  const ampEnv = env(l.ampEnv);

  let filter: PreviewFilter | null = null;
  const f = l.filter;
  const type = FILTER_TYPES.find((t) => t === f?.type);
  if (f?.on && type) {
    const resRaw = f.resonance?.value;
    filter = {
      type,
      cutoffHz: parseHz(f.freq?.value) ?? 20000,
      resonance: type === 'LPHP' ? 0 : Math.min(1, Math.max(0, (parsePlain(resRaw) ?? 0) / 10)),
      hpHz: type === 'LPHP' ? (parseHz(resRaw) ?? 20) : undefined,
      envOctaves: parsePlain(f.envAmount?.value) ?? 0,
      env: env(f.env),
      track: keyTrackFactor(Math.max(0, TRACK_LABELS.indexOf(f.track ?? 'off'))),
    };
  }
  const octave = Number.isFinite(l.octaveShift) ? (l.octaveShift ?? 0) : 0;
  const pitchSemitones = 12 * octave + oscTuneSemitones(parseSigned(l.pitchCoarse) ?? 0, parseSigned(l.pitchFine) ?? 0);
  return { wave, ampEnv, filter, pitchSemitones };
}

// ── Building blocks ──────────────────────────────────────────────────────────

/** Two-sample polynomial band-limited step residual at phase t (cycles), step dt. */
function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

function sawAt(t: number, dt: number): number {
  return 2 * t - 1 - polyBlep(t, dt);
}

/**
 * Gain that fades an oscillator out as its pitch approaches Nyquist: 1 up to
 * fs/8, 0 at fs/4 and above.
 */
export function nyquistFade(dt: number): number {
  return Math.min(1, Math.max(0, (0.25 - dt) / 0.125));
}

class Oscillator {
  private phase = 0;
  private seed = 0x1234567;
  private readonly fade: number;

  /** `dt` is the phase increment per sample (frequency / sample rate). */
  constructor(
    private readonly wave: PreviewWave,
    private readonly dt: number,
  ) {
    this.fade = nyquistFade(dt);
  }

  next(): number {
    const { dt } = this;
    const t = this.phase;
    this.phase += dt;
    if (this.phase >= 1) this.phase -= 1;
    let y: number;
    switch (this.wave) {
      case 'sine':
        y = Math.sin(2 * Math.PI * t);
        break;
      case 'triangle':
        y = 1 - 4 * Math.abs(t - 0.5);
        break;
      case 'saw':
        y = sawAt(t, dt);
        break;
      case 'noise':
        this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
        return this.seed / 2147483648 - 1;
      default: {
        // Pulse = difference of two band-limited saws offset by the width w:
        // 2 − 2w while t < w, −2w after, so it is zero-mean with a 2.0 swing.
        const w = this.wave === 'square' ? 0.5 : this.wave === 'pulse33' ? 1 / 3 : 0.1;
        let t2 = t - w;
        if (t2 < 0) t2 += 1;
        y = sawAt(t2, dt) - sawAt(t, dt);
        break;
      }
    }
    return y * this.fade;
  }
}

/**
 * Damping `k` (= 1/Q) of the state-variable filters for a resonance of 0..1
 * (the panel's 0.0–10.0 over 10): the firmware's law for raw 0..127,
 * {@link resonanceDamping}.
 */
export function svfDamping(resonance: number): number {
  return resonanceDamping(resonance * 127);
}

/**
 * Input gain for a resonant state-variable filter of damping `k`: (k/2)^¼, floored
 * at 0.3, so 1 with no resonance, −3 dB at 5.0, −5 dB at 7.0, −9.6 dB at 9.0 and
 * −10.5 dB at most. The resonant peak (≈ 1/k) still rises with the knob, and the
 * band-pass saturation bounds it; the floor keeps a nearly self-oscillating filter
 * from going quiet. Our choice: the LP12 kernel normalises its damping with a
 * reciprocal square root (`RSQRTS`, `docs/SYNTH-ENGINE.md` §4), but the exact law
 * isn't recovered.
 */
export function resonanceInputGain(k: number): number {
  return Math.max(0.3, Math.pow(Math.min(2, Math.max(0, k)) / 2, 0.25));
}

/** Output soft limiter: transparent below ±0.5, a tanh knee towards ±1 above. */
export function softLimit(x: number): number {
  const a = Math.abs(x);
  if (a <= 0.5) return x;
  return Math.sign(x) * (0.5 + 0.5 * Math.tanh((a - 0.5) / 0.5));
}

/** Output gain before the limiter: a full-scale oscillator through an open filter peaks at 0.4. */
const OUTPUT_GAIN = 0.4;

/** An envelope below this (−80 dB) is over: decay and release end there. */
const ENV_FLOOR = 1e-4;

/**
 * Envelope with the firmware's segment shapes: a linear attack ramp that
 * reaches 1.0 in `attack` seconds, then exponential decay and release towards
 * zero that fall {@link ENV_DISPLAY_DROP} (40 dB) in their displayed time.
 * A decay of `Infinity` holds the peak until release (the panel's "inf").
 */
class Envelope {
  private level = 0;
  private stage: 'attack' | 'decay' | 'release' | 'done' = 'attack';
  private readonly attackStep: number;
  private readonly decayCoef: number;
  private readonly releaseCoef: number;
  constructor(e: PreviewEnv, fs: number) {
    // Fraction of the remaining level removed per sample for a 40 dB drop in t.
    const coef = (t: number) => (t <= 0 ? 1 : 1 - Math.exp(-Math.log(ENV_DISPLAY_DROP) / (t * fs)));
    this.attackStep = e.attack <= 0 ? 1 : 1 / (e.attack * fs);
    this.decayCoef = Number.isFinite(e.decay) ? coef(e.decay) : 0;
    this.releaseCoef = coef(e.release);
  }

  gateOff(): void {
    if (this.stage !== 'done') this.stage = 'release';
  }

  get finished(): boolean {
    return this.stage === 'done';
  }

  next(): number {
    switch (this.stage) {
      case 'attack':
        this.level += this.attackStep;
        if (this.level >= 1) {
          this.level = 1;
          this.stage = 'decay';
        }
        break;
      case 'decay':
        this.level -= this.level * this.decayCoef;
        // A finite decay ends at the floor instead of sinking into denormals until release.
        if (this.level < ENV_FLOOR) {
          this.level = 0;
          this.stage = 'done';
        }
        break;
      case 'release':
        this.level -= this.level * this.releaseCoef;
        if (this.level < ENV_FLOOR) {
          this.level = 0;
          this.stage = 'done';
        }
        break;
      case 'done':
        break;
    }
    return this.level;
  }
}

/** Trapezoidal (zero-delay-feedback) state-variable filter. */
class Svf {
  /** Band-pass state saturation level (our choice): bounds a self-oscillating filter near ±1. */
  private static readonly BAND_LIMIT = 2;
  private ic1 = 0;
  private ic2 = 0;
  private a1 = 1;
  private a2 = 0;
  private a3 = 0;
  private k = 2;
  lp = 0;
  bp = 0;
  hp = 0;

  set(g: number, k: number): void {
    this.k = k;
    this.a1 = 1 / (1 + g * (g + k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
  }

  process(x: number): void {
    const v3 = x - this.ic2;
    // The firmware clips the band-pass state, which keeps a near-self-oscillating
    // filter bounded; here it saturates softly, at a level of our choice.
    const L = Svf.BAND_LIMIT;
    const v1 = L * Math.tanh((this.a1 * this.ic1 + this.a2 * v3) / L);
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2;
    this.bp = v1;
    this.hp = x - this.k * v1 - v2;
  }
}

/** Four trapezoidal one-pole stages with resonant feedback through a soft clipper. */
class Ladder {
  private readonly s = [0, 0, 0, 0];
  private G = 0;
  private fb = 0;
  private y = 0;

  set(g: number, resonance: number): void {
    this.G = g / (1 + g);
    this.fb = 4.2 * resonance;
  }

  process(x: number): number {
    let u = Math.tanh(x - this.fb * this.y);
    for (let i = 0; i < 4; i++) {
      const v = (u - this.s[i]) * this.G;
      const out = v + this.s[i];
      this.s[i] = out + v;
      u = out;
    }
    this.y = u;
    return u;
  }
}

/** Control-rate block for cutoff updates, in samples. */
const CONTROL_BLOCK = 16;

/** One filter plus its envelope and key tracking, modulating the cutoff at control rate. */
class Filter {
  private readonly a = new Svf();
  private readonly b = new Svf();
  private readonly ladder = new Ladder();
  private readonly env: Envelope;
  /** Keyboard-tracking offset for the played note, in octaves. */
  private readonly trackOct: number;
  /** Resonance compensation on the input ({@link resonanceInputGain}); 1 for the ladder and LPHP. */
  private readonly inGain: number;
  private n = 0;

  constructor(
    private readonly f: PreviewFilter,
    private readonly fs: number,
    note: number,
  ) {
    this.env = new Envelope(f.env, fs);
    this.trackOct = (f.track * (note - 60)) / 12;
    this.inGain = f.type === 'LPM' || f.type === 'LPHP' ? 1 : resonanceInputGain(svfDamping(f.resonance));
    // The LPHP high-pass corner doesn't move, so it is set once.
    if (f.type === 'LPHP') this.a.set(this.g(f.hpHz ?? 20), Math.SQRT2);
  }

  gateOff(): void {
    this.env.gateOff();
  }

  private g(hz: number): number {
    const fc = Math.min(Math.max(hz, 10), 0.45 * this.fs);
    return Math.tan((Math.PI * fc) / this.fs);
  }

  /** Update coefficients for the current (modulated) cutoff. */
  private update(cutoffHz: number): void {
    const { type, resonance } = this.f;
    const g = this.g(cutoffHz);
    if (type === 'LPM') {
      this.ladder.set(g, resonance);
    } else if (type === 'LPHP') {
      this.b.set(g, Math.SQRT2);
    } else {
      const k = svfDamping(resonance);
      // LP24 resonates on its second stage only: two resonant stages would square the
      // peak (Q²). The first stage is a plain Butterworth section.
      this.a.set(g, type === 'LP24' ? Math.SQRT2 : k);
      this.b.set(g, k);
    }
  }

  process(input: number): number {
    const e = this.env.next();
    if (this.n++ % CONTROL_BLOCK === 0) {
      this.update(this.f.cutoffHz * Math.pow(2, this.f.envOctaves * e + this.trackOct));
    }
    const x = input * this.inGain;
    switch (this.f.type) {
      case 'LP12':
        this.a.process(x);
        return this.a.lp;
      case 'LP24':
        this.a.process(x);
        this.b.process(this.a.lp);
        return this.b.lp;
      case 'LPM':
        return this.ladder.process(x);
      case 'LPHP':
        this.a.process(x);
        this.b.process(this.a.hp);
        return this.b.lp;
      case 'BP':
        this.a.process(x);
        return this.a.bp;
      case 'HP':
        this.a.process(x);
        return this.a.hp;
    }
  }
}

/**
 * Render one note of a synth layer preview as mono samples in (−1, 1). Stops
 * early once the amp envelope has decayed to silence. A note still sounding at
 * `maxSeconds` is released {@link END_FADE_SECONDS} before it and faded to zero.
 */
export function renderSynthPreview(p: SynthPreviewParams, opts: RenderOptions): Float32Array {
  const fs = opts.sampleRate ?? 48000;
  const hold = opts.holdSeconds ?? 1;
  const maxLen = Math.round((opts.maxSeconds ?? 4) * fs);
  const fadeLen = Math.min(maxLen, Math.max(1, Math.round(END_FADE_SECONDS * fs)));
  const fadeFrom = maxLen - fadeLen;
  const gateLen = Math.min(Math.round(hold * fs), fadeFrom);
  const dt = (440 * Math.pow(2, (opts.note + (p.pitchSemitones ?? 0) - 69) / 12)) / fs;

  const osc = new Oscillator(p.wave, dt);
  const amp = new Envelope(p.ampEnv, fs);
  const filter = p.filter ? new Filter(p.filter, fs, opts.note) : null;

  const out = new Float32Array(maxLen);
  let n = 0;
  for (; n < maxLen; n++) {
    if (n === gateLen) {
      amp.gateOff();
      filter?.gateOff();
    }
    if (amp.finished) break;
    let x = osc.next();
    if (filter) x = filter.process(x);
    let y = softLimit(OUTPUT_GAIN * x * amp.next());
    if (n >= fadeFrom) y *= (maxLen - 1 - n) / fadeLen;
    out[n] = y;
  }
  return out.subarray(0, n);
}
