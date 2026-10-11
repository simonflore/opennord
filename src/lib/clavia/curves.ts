/**
 * Shapes for the panel's small curves — filter response, EQ, oscillator and LFO
 * waveforms. Pure maths from the values a file prints ("4.2 kHz", "+3.0 dB"), so
 * every Nord model's view-model can use them. These are **schematic**: textbook
 * 2-pole / 4-pole responses and ideal wave shapes that show what a setting does,
 * not a measurement of the instrument's DSP. The printed value stays the truth.
 */

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** "4.2 kHz" | "988 Hz" → Hz; undefined for anything that isn't a frequency. */
export function parseHz(s: string | undefined): number | undefined {
  const m = s ? /^([\d.]+)\s*(k?)Hz$/i.exec(s.trim()) : null;
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  return Number.isNaN(n) ? undefined : n * (m[2] ? 1000 : 1);
}

/** The audible band the frequency curves span, left to right. */
const F_LO = 20, F_HI = 20000;
/** Frequency → 0–1 across the curve (log scale). */
export const freqX = (hz: number) => clamp01(Math.log(hz / F_LO) / Math.log(F_HI / F_LO));
const xFreq = (x: number) => F_LO * (F_HI / F_LO) ** x;

/**
 * Where a filter-frequency knob sits, 0–100. The Stage's cutoff runs in
 * semitones from ~14 Hz (fully left) and reads 440 Hz at step 60 of 127, so the
 * position follows from the printed frequency.
 */
export function cutoffKnobFill(hz: number): number {
  return Math.round(clamp01((12 * Math.log2(hz / 440) + 60) / 127) * 100);
}

export interface FilterShape {
  /** "LP12" | "LP24" | "LPM" | "HP" | "BP" | "LPHP" (anything else draws as LP24). */
  type: string;
  cutoffHz: number;
  /** Resonance 0–1. Ignored by LPHP, whose second knob is the high-pass frequency. */
  res?: number;
  /** LPHP only: the high-pass corner. */
  hpHz?: number;
}

/** Magnitude of a 2-pole low-pass at frequency ratio r = f / fc. */
const lp2 = (r: number, q: number) => 1 / Math.sqrt((1 - r * r) ** 2 + (r / q) ** 2);
const BUTTERWORTH = Math.SQRT1_2;

function filterGain(f: FilterShape, hz: number): number {
  const r = hz / f.cutoffHz;
  const q = BUTTERWORTH + (f.res ?? 0) ** 2 * 10;
  switch (f.type.toUpperCase()) {
    case 'LP12': return lp2(r, q);
    case 'HP': return r * r * lp2(r, q);
    case 'BP': return (r / Math.max(q, 1)) * lp2(r, Math.max(q, 1));
    case 'LPHP': {
      const rh = hz / (f.hpHz ?? F_LO);
      return lp2(r, BUTTERWORTH) * rh * rh * lp2(rh, BUTTERWORTH);
    }
    default: return lp2(r, q) * lp2(r, BUTTERWORTH); // LP24, LPM
  }
}

/** dB window the response curves are drawn in. */
const DB_LO = -30, DB_HI = 18;
const dbY = (db: number) => 1 - clamp01((db - DB_LO) / (DB_HI - DB_LO));
/** Where 0 dB sits in a filter curve, 0 (top) – 1 (bottom). */
export const FILTER_ZERO_Y = dbY(0);

export interface CurvePoint { x: number; y: number }

/** The filter's response as points in a unit box (x: 20 Hz → 20 kHz, y: 0 = top). */
export function filterResponse(f: FilterShape, steps = 48): CurvePoint[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = i / steps;
    return { x, y: dbY(20 * Math.log10(Math.max(filterGain(f, xFreq(x)), 1e-6))) };
  });
}

export interface EqShape { bassDb: number; midDb: number; trebDb: number; midHz: number }

/** Corner frequencies of the bass and treble shelves (Nord's 3-band EQ). */
const EQ_BASS_HZ = 100, EQ_TREBLE_HZ = 4000;
const EQ_RANGE_DB = 15;

/** A 3-band EQ (bass shelf, swept mid bell, treble shelf) in a unit box; 0 dB is y = 0.5. */
export function eqResponse(e: EqShape, steps = 40): CurvePoint[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = i / steps;
    const hz = xFreq(x);
    const db = e.bassDb / (1 + (hz / EQ_BASS_HZ) ** 2)
      + e.trebDb / (1 + (EQ_TREBLE_HZ / hz) ** 2)
      + e.midDb * Math.exp(-(Math.log2(hz / e.midHz) ** 2) / 2);
    return { x, y: 0.5 - Math.max(-1, Math.min(1, db / EQ_RANGE_DB)) / 2 };
  });
}

export type WaveShape = 'sine' | 'triangle' | 'saw' | 'inv saw' | 'square' | 'pulse' | 'noise' | 'S/H';

/**
 * The basic shape an oscillator wave name ends in — "Sub Square Saw" is a saw
 * (with a square sub-oscillator), "Sync Pulse 33" a pulse. Undefined when the
 * name isn't one of the classic shapes (FM, wavetables, samples).
 */
export function waveShapeOf(name: string | undefined): { shape: WaveShape; width?: number } | undefined {
  if (!name) return undefined;
  const words = name.toLowerCase().match(/noise|sine|triangle|saw|square|pulse(?: \d+)?/g);
  const last = words?.[words.length - 1];
  if (!last) return undefined;
  if (last.startsWith('pulse')) return { shape: 'pulse', width: (parseInt(last.slice(5), 10) || 25) / 100 };
  return { shape: last as WaveShape };
}

/** Deterministic stand-in for randomness, so noise and S/H draw the same every render. */
const pseudo = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

/** One sample of a unit wave, phase 0–1 → −1…1. */
function waveAt(shape: WaveShape, t: number, width: number, cycle: number): number {
  switch (shape) {
    case 'sine': return Math.sin(2 * Math.PI * t);
    case 'triangle': return 1 - 4 * Math.abs(((t + 0.25) % 1) - 0.5);
    case 'saw': return 2 * t - 1;
    case 'inv saw': return 1 - 2 * t;
    case 'square': return t < 0.5 ? 1 : -1;
    case 'pulse': return t < width ? 1 : -1;
    case 'noise': return pseudo(cycle * 97 + Math.floor(t * 9));
    case 'S/H': return pseudo(cycle * 4 + Math.floor(t * 4));
  }
}

/** `cycles` periods of a wave as points in a unit box (y: 0 = top). */
export function wavePoints(shape: WaveShape, cycles = 2, width = 0.5): CurvePoint[] {
  const perCycle = 48;
  const pts: CurvePoint[] = [];
  for (let c = 0; c < cycles; c++) {
    for (let i = 0; i < perCycle; i++) {
      // Sample just inside each step so vertical edges (square, saw) stay vertical.
      for (const t of [i / perCycle, (i + 0.999) / perCycle]) {
        pts.push({ x: (c + t) / cycles, y: 0.5 - waveAt(shape, t, width, c) * 0.5 });
      }
    }
  }
  return pts;
}
