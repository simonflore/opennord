/**
 * The organ synthesis core — pure TypeScript, no Web Audio, fully deterministic.
 *
 * Design: a fixed bank of always-running tone generators (91 tonewheels for the
 * B3; a divider chain or pipe ranks for the other models) feeding one mix bus.
 * Each held key closes one contact per drawbar; a closed contact adds that
 * drawbar's level to its generator's target gain. Generators ramp to target
 * (abruptly for tonewheels — that step is part of the key click — and slowly for
 * pipes). Cost per sample is one wavetable read per *sounding generator*, so the
 * organ is fully polyphonic at a flat cost: ten fingers on a full registration
 * costs about the same as one.
 *
 * Signal flow (mono):
 *   generators ─▶ manual bus ─▶ vib/chorus ─┐
 *   generators ─▶ percussion bus × envelope ┼─▶ volume ─▶ soft clip ─▶ out
 *   key click / pipe chiff noise ───────────┘
 *   (a rotary speaker stage belongs after `out`)
 *
 * The same class runs in the AudioWorklet and in tests (`renderOffline`).
 */
import { PERC_2ND, PERC_3RD, wheelFor } from './tonewheel';
import { Scanner } from './scanner';
import { DEFAULT_ORGAN_PARAMS, type OrganParams } from './types';
import { voicingFor, type ModelVoicing } from './voicing';

const TABLE_BITS = 11;
const TABLE_SIZE = 1 << TABLE_BITS;
const SPAN_MAX = 256;

/** Percussion decay time constants (s): fast ≈ 0.2 s audible, slow ≈ 1 s. */
export const PERC_TAU_FAST = 0.15;
export const PERC_TAU_SLOW = 0.6;
/** Percussion peak level relative to a drawbar at full: normal / soft. */
export const PERC_LEVEL_NORMAL = 1.0;
export const PERC_LEVEL_SOFT = 0.5;
/** Drawbar (manual) volume while percussion is on at normal volume: about −3 dB. */
export const PERC_NORMAL_MANUAL_DROP = 0.708;

const CLICK_TAU_S = 0.0012;
const CHIFF_TAU_S = 0.03;
const CLICK_SCALE = 0.35;

interface Gen {
  id: number;
  inc: number;      // cycles per sample
  phase0: number;   // phase at clock 0 (generators never stop turning)
  table: Float32Array;
  gain: number; target: number; step: number;
  pgain: number; ptarget: number; pstep: number;
  nt: number; np: number; // scratch for retargeting
  active: boolean;
}

interface Key {
  /** Bit per bus: contact closed. */
  mask: number;
  down: boolean;
}

interface ContactEvent { at: number; note: number; bus: number; close: boolean }

/** Small deterministic PRNG (xorshift32). */
function xorshift(seed: number) {
  let s = (seed | 0) || 0x9e3779b9;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** Stable per-generator starting phase from (seed, id) — independent of creation order. */
function hashPhase(seed: number, id: number): number {
  let h = (Math.imul(id + 1, 0x85ebca6b) ^ Math.imul(seed | 0, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0; h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const tableCache = new Map<string, Float32Array>();
/** Single-cycle table (+1 guard sample), band-limited to the harmonics that fit. */
function wavetable(timbre: string, harmonics: readonly number[], freq: number, sampleRate: number): Float32Array {
  let n = 0;
  for (let h = 1; h <= harmonics.length; h++) if (h * freq < 0.45 * sampleRate && harmonics[h - 1]) n = h;
  const key = `${timbre}:${n}`;
  const hit = tableCache.get(key);
  if (hit) return hit;
  const t = new Float32Array(TABLE_SIZE + 1);
  let sq = 0;
  for (let i = 0; i < TABLE_SIZE; i++) {
    let v = 0;
    for (let h = 1; h <= n; h++) v += harmonics[h - 1] * Math.sin((2 * Math.PI * h * i) / TABLE_SIZE);
    t[i] = v;
    sq += v * v;
  }
  // Equal loudness across timbres: every table has the RMS of a unit sine.
  const rms = Math.sqrt(sq / TABLE_SIZE);
  const norm = rms > 0 ? Math.SQRT1_2 / rms : 0;
  for (let i = 0; i < TABLE_SIZE; i++) t[i] *= norm;
  t[TABLE_SIZE] = t[0];
  tableCache.set(key, t);
  return t;
}

/** Soft limiter: transparent below ±0.6, smooth tanh knee toward ±1. */
export function softClip(x: number): number {
  const a = Math.abs(x);
  if (a <= 0.6) return x;
  return Math.sign(x) * (0.6 + 0.4 * Math.tanh((a - 0.6) / 0.4));
}

export interface OrganCoreOptions {
  sampleRate: number;
  params?: OrganParams;
  /** Seed for generator phases, contact scatter and click noise (determinism). */
  seed?: number;
}

export class OrganCore {
  readonly sampleRate: number;
  private readonly seed: number;
  private params: OrganParams;
  private voicing: ModelVoicing;
  private clock = 0;
  private gens = new Map<number, Gen>();
  private active: Gen[] = [];
  private keys = new Map<number, Key>();
  private queue: ContactEvent[] = [];
  private dirty = false;
  private rand: () => number;
  private route: number[] = [];
  private scanner: Scanner;
  private percEnv = 0;
  private percDecay = 1;
  private clickEnv = 0; private clickDecay: number; private lastNoise = 0;
  private chiffEnv = 0; private chiffDecay: number; private chiffLp = 0;
  private main = new Float32Array(SPAN_MAX);
  private perc = new Float32Array(SPAN_MAX);

  constructor(opts: OrganCoreOptions) {
    this.sampleRate = opts.sampleRate;
    this.seed = opts.seed ?? 1;
    this.rand = xorshift(this.seed);
    this.params = DEFAULT_ORGAN_PARAMS;
    this.voicing = voicingFor(this.params.model);
    this.scanner = new Scanner(this.sampleRate);
    this.clickDecay = Math.exp(-1 / (CLICK_TAU_S * this.sampleRate));
    this.chiffDecay = Math.exp(-1 / (CHIFF_TAU_S * this.sampleRate));
    this.setParams(opts.params ?? DEFAULT_ORGAN_PARAMS);
  }

  // ── Control ───────────────────────────────────────────────────────────────

  setParams(p: OrganParams): void {
    const modelChanged = p.model !== this.params.model;
    this.params = { ...p, drawbars: [...p.drawbars], percussion: { ...p.percussion }, vibrato: { ...p.vibrato } };
    this.voicing = voicingFor(p.model);
    if (modelChanged) this.resetBank();
    const tau = p.percussion.decayFast ? PERC_TAU_FAST : PERC_TAU_SLOW;
    this.percDecay = Math.exp(-1 / (tau * this.sampleRate));
    this.scanner.set(p.vibrato.on, p.vibrato.type, this.voicing.vibRateHz, this.voicing.vibShape);
    this.dirty = true;
  }

  getParams(): OrganParams { return this.params; }

  /** Key down. Velocity is accepted for API symmetry; organs ignore it. */
  noteOn(note: number, _velocity = 100): void {
    let key = this.keys.get(note);
    if (key?.down) return; // already held
    const othersDown = this.anyKeyDown();
    if (!key) { key = { mask: 0, down: true }; this.keys.set(note, key); }
    key.down = true;
    this.cancelEvents(note);
    this.scheduleContacts(note, true);
    // Single-trigger percussion: fires only from a fully released keyboard.
    if (!othersDown && this.voicing.percussion && this.params.percussion.on) this.percEnv = 1;
    if (this.voicing.chiff > 0) this.chiffEnv += this.voicing.chiff;
    this.dirty = true;
  }

  noteOff(note: number): void {
    const key = this.keys.get(note);
    if (!key || !key.down) return;
    key.down = false;
    this.cancelEvents(note);
    this.scheduleContacts(note, false);
    this.dirty = true;
  }

  allNotesOff(): void {
    this.keys.clear();
    this.queue.length = 0;
    this.dirty = true;
  }

  /** Notes whose key is currently down. */
  heldNotes(): number[] {
    return [...this.keys.entries()].filter(([, k]) => k.down).map(([n]) => n).sort((a, b) => a - b);
  }

  /** Current percussion envelope (0..1), for tests and meters. */
  percussionEnvelope(): number { return this.percEnv; }

  /** Target gain per generator id, with all scheduled contacts settled now (tests). */
  settledTargets(): Map<number, number> {
    for (const e of this.queue) this.applyEvent(e);
    this.queue.length = 0;
    this.recompute();
    const out = new Map<number, number>();
    for (const g of this.active) if (g.target > 0) out.set(g.id, g.target);
    return out;
  }

  /** Generators currently rendering (sounding or ramping). */
  activeGenerators(): number { return this.active.length; }

  /** Frequency of a generator id under the current model (tests / meters). */
  generatorFrequency(id: number): number { return this.voicing.tone(id).freq; }

  // ── Rendering ─────────────────────────────────────────────────────────────

  /** Render `frames` mono samples into `out` starting at `offset` (overwrites). */
  render(out: Float32Array, offset = 0, frames = out.length - offset): void {
    let pos = offset;
    const end = offset + frames;
    while (pos < end) {
      while (this.queue.length && this.queue[0].at <= this.clock) {
        this.applyEvent(this.queue.shift()!);
        this.dirty = true;
      }
      if (this.dirty) { this.recompute(); this.dirty = false; }
      let n = Math.min(end - pos, SPAN_MAX);
      if (this.queue.length) n = Math.min(n, Math.max(1, this.queue[0].at - this.clock));
      this.renderSpan(out, pos, n);
      pos += n;
      this.clock += n;
    }
  }

  private renderSpan(out: Float32Array, pos: number, n: number): void {
    const main = this.main, perc = this.perc;
    main.fill(0, 0, n); perc.fill(0, 0, n);
    for (const g of this.active) {
      let ph = g.phase0 + g.inc * this.clock;
      ph -= Math.floor(ph);
      const t = g.table, inc = g.inc;
      let gain = g.gain; const target = g.target, step = g.step;
      let pg = g.pgain; const pt = g.ptarget, ps = g.pstep;
      const hasPerc = pg > 0 || pt > 0;
      for (let i = 0; i < n; i++) {
        const x = ph * TABLE_SIZE;
        const j = x | 0;
        const a = t[j];
        const s = a + (t[j + 1] - a) * (x - j);
        if (gain !== target) gain = gain < target ? Math.min(target, gain + step) : Math.max(target, gain - step);
        main[i] += s * gain;
        if (hasPerc) {
          if (pg !== pt) pg = pg < pt ? Math.min(pt, pg + ps) : Math.max(pt, pg - ps);
          perc[i] += s * pg;
        }
        ph += inc;
        if (ph >= 1) ph -= 1;
      }
      g.gain = gain; g.pgain = pg;
    }
    // Drop generators that went silent.
    let w = 0;
    for (const g of this.active) {
      if (g.gain > 0 || g.target > 0 || g.pgain > 0 || g.ptarget > 0) this.active[w++] = g;
      else g.active = false;
    }
    this.active.length = w;

    const p = this.params;
    const v = this.voicing;
    const percOn = v.percussion && p.percussion.on;
    const manualGain = percOn && !p.percussion.volSoft ? PERC_NORMAL_MANUAL_DROP : 1;
    const percLevel = percOn ? (p.percussion.volSoft ? PERC_LEVEL_SOFT : PERC_LEVEL_NORMAL) : 0;
    const vol = (Number.isFinite(p.volumeDb) ? 10 ** (p.volumeDb / 20) : 0) * v.level;
    for (let i = 0; i < n; i++) {
      let s = this.scanner.process(main[i] * manualGain);
      if (percLevel > 0) s += perc[i] * this.percEnv * percLevel;
      this.percEnv *= this.percDecay;
      if (this.clickEnv > 1e-5) {
        const noise = this.rand() * 2 - 1;
        s += (noise - this.lastNoise) * this.clickEnv; // differentiated noise: bright, short
        this.lastNoise = noise;
        this.clickEnv *= this.clickDecay;
      }
      if (this.chiffEnv > 1e-5) {
        this.chiffLp += 0.25 * (this.rand() * 2 - 1 - this.chiffLp); // breathy, darker noise
        s += this.chiffLp * this.chiffEnv;
        this.chiffEnv *= this.chiffDecay;
      }
      out[pos + i] = softClip(s * vol);
    }
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private resetBank(): void {
    this.gens.clear();
    this.active.length = 0;
  }

  private anyKeyDown(): boolean {
    for (const k of this.keys.values()) if (k.down) return true;
    return false;
  }

  private cancelEvents(note: number): void {
    if (this.queue.some((e) => e.note === note)) this.queue = this.queue.filter((e) => e.note !== note);
  }

  private scheduleContacts(note: number, close: boolean): void {
    const scatter = (this.voicing.contactScatterMs * this.sampleRate) / 1000;
    for (let bus = 0; bus < this.voicing.buses; bus++) {
      const at = this.clock + Math.round(this.rand() * scatter);
      this.queue.push({ at, note, bus, close });
    }
    this.queue.sort((a, b) => a.at - b.at);
  }

  private applyEvent(e: ContactEvent): void {
    const key = this.keys.get(e.note);
    if (!key) return;
    const bit = 1 << e.bus;
    const was = (key.mask & bit) !== 0;
    key.mask = e.close ? key.mask | bit : key.mask & ~bit;
    if (was !== e.close && this.voicing.keyClick) {
      // A contact that carries signal clicks harder than an idle one.
      const live = (this.params.drawbars[e.bus] ?? 0) > 0 ? 1 : 0.25;
      this.clickEnv += (this.params.keyClick * CLICK_SCALE * live) / this.voicing.buses;
    }
    if (!key.down && key.mask === 0) this.keys.delete(e.note);
  }

  private gen(id: number): Gen {
    let g = this.gens.get(id);
    if (!g) {
      const tone = this.voicing.tone(id);
      g = {
        id,
        inc: tone.freq / this.sampleRate,
        phase0: hashPhase(this.seed, id),
        table: wavetable(tone.timbre, tone.harmonics, tone.freq, this.sampleRate),
        gain: 0, target: 0, step: 0, pgain: 0, ptarget: 0, pstep: 0, nt: 0, np: 0,
        active: false,
      };
      this.gens.set(id, g);
    }
    if (!g.active) { g.active = true; g.nt = 0; g.np = 0; this.active.push(g); }
    return g;
  }

  /** Rebuild every generator's target from the closed contacts of the held keys. */
  private recompute(): void {
    for (const g of this.active) { g.nt = 0; g.np = 0; }
    const p = this.params;
    const v = this.voicing;
    const shift = 12 * p.octaveShift;
    const r = this.route;
    for (const [note, key] of this.keys) {
      const midi = note + shift;
      for (let bus = 0; bus < v.buses; bus++) {
        if (!(key.mask & (1 << bus))) continue;
        r.length = 0;
        v.route(midi, bus, p, r);
        for (let i = 0; i < r.length; i += 2) this.gen(r[i]).nt += r[i + 1];
      }
      if (key.down && v.percussion && p.percussion.on) {
        this.gen(wheelFor(midi, p.percussion.harm3rd ? PERC_3RD : PERC_2ND, v.lowestWheel)).np += 1;
      }
    }
    const sr = this.sampleRate / 1000;
    const rel = (p.sustain ? v.sustainReleaseMs : v.releaseMs) * sr;
    const att = v.attackMs * sr;
    for (const g of this.active) {
      if (g.nt !== g.target) {
        g.step = Math.abs(g.nt - g.gain) / Math.max(1, g.nt > g.gain ? att : rel);
        g.target = g.nt;
      }
      if (g.np !== g.ptarget) {
        g.pstep = Math.abs(g.np - g.pgain) / Math.max(1, g.np > g.pgain ? att : v.releaseMs * sr);
        g.ptarget = g.np;
      }
    }
  }
}

/**
 * Render a scripted performance offline — deterministic, for tests and for
 * bouncing a preview. Events are [timeSeconds, 'on' | 'off', note].
 */
export function renderOffline(
  params: OrganParams,
  events: readonly (readonly [number, 'on' | 'off', number])[],
  seconds: number,
  sampleRate = 48000,
  seed = 1,
): Float32Array {
  const core = new OrganCore({ sampleRate, params, seed });
  const total = Math.round(seconds * sampleRate);
  const out = new Float32Array(total);
  const evs = [...events].sort((a, b) => a[0] - b[0]);
  let pos = 0;
  for (const [t, kind, note] of evs) {
    const at = Math.min(total, Math.round(t * sampleRate));
    if (at > pos) { core.render(out, pos, at - pos); pos = at; }
    if (kind === 'on') core.noteOn(note, 100); else core.noteOff(note);
  }
  if (pos < total) core.render(out, pos, total - pos);
  return out;
}
