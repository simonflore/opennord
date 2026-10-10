/**
 * Audio measurements for the hardware test kit.
 *
 * Plain, dependency-free signal analysis over Float32 PCM in [-1, 1]: pitch (normalized
 * autocorrelation), peak/RMS level, spectral centroid, the amplitude envelope (attack,
 * decay, T60), amplitude-modulation rate (tremolo, rotary) and pitch-modulation rate and
 * depth (vibrato, chorus). `scripts/compare-recording.ts` runs these on a recording of the
 * instrument and on OpenNord's own render of the same note.
 *
 * Local only: recordings of the user's instrument are read from disk and never sent
 * anywhere (`docs/LEGAL.md`).
 */
import { parseWav } from '../ns4/wav';

export const toDb = (x: number): number => (x > 0 ? 20 * Math.log10(x) : -Infinity);
/** Frequency of a MIDI note at A4 = `a4` Hz (equal temperament). */
export const noteToHz = (midi: number, a4 = 440): number => a4 * 2 ** ((midi - 69) / 12);
/** Interval from `ref` to `hz` in cents. */
export const centsBetween = (hz: number, ref: number): number => 1200 * Math.log2(hz / ref);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS: Record<string, string> = { DB: 'C#', EB: 'D#', GB: 'F#', AB: 'G#', BB: 'A#' };

/** "A4", "G#4", "Bb3" or a MIDI number ("69") → MIDI note (C4 = 60). */
export function parseNote(s: string): number {
  const t = s.trim();
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    if (n > 127) throw new Error(`MIDI note ${n} is out of range (0–127).`);
    return n;
  }
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(t);
  if (!m) throw new Error(`"${s}" is not a note name like A4, G#4 or Bb3.`);
  let name = m[1].toUpperCase() + m[2];
  if (m[2] === 'b') name = FLATS[name.toUpperCase()] ?? name;
  const pc = NOTE_NAMES.indexOf(name);
  if (pc < 0) throw new Error(`"${s}" is not a note name like A4, G#4 or Bb3.`);
  return (Number(m[3]) + 1) * 12 + pc;
}

/** MIDI note → "A4". */
export const noteName = (midi: number): string => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

// ── Reading a recording ──────────────────────────────────────────────────────────────────

export interface Recording {
  sampleRate: number;
  /** One Float32Array per channel, in [-1, 1]. */
  channels: Float32Array[];
}

/** Read a WAV file (8/16/24/32-bit PCM or 32-bit float) into Float32 channels in [-1, 1]. */
export function readRecording(bytes: Uint8Array): Recording {
  const wav = parseWav(bytes);
  const scale = wav.float ? 1 / 0x7fffff : wav.bitDepth === 8 ? 1 / 128 : 1 / 2 ** (wav.bitDepth - 1);
  return { sampleRate: wav.sampleRate, channels: wav.channels.map((c) => Float32Array.from(c, (v) => v * scale)) };
}

export type ChannelPick = 'mix' | 'left' | 'right' | 'side';

/** One analysis signal from a recording: the L/R average (default), one side, or L − R. */
export function pickChannel(rec: Recording, which: ChannelPick = 'mix'): Float32Array {
  const [l, r = l] = rec.channels;
  if (which === 'left') return l;
  if (which === 'right') return r;
  const out = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) out[i] = which === 'side' ? (l[i] - r[i]) / 2 : (l[i] + r[i]) / 2;
  return out;
}

// ── Level ────────────────────────────────────────────────────────────────────────────────

export interface Levels {
  /** Sample peak in dBFS. */
  peakDb: number;
  /** RMS in dBFS (a full-scale sine reads −3 dB). */
  rmsDb: number;
}

export function levels(x: ArrayLike<number>): Levels {
  let peak = 0;
  let sq = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    peak = Math.max(peak, Math.abs(v));
    sq += v * v;
  }
  return { peakDb: toDb(peak), rmsDb: toDb(Math.sqrt(sq / Math.max(1, x.length))) };
}

// ── Envelope ─────────────────────────────────────────────────────────────────────────────

export interface Envelope {
  /** Seconds between frames. */
  hopS: number;
  /** Seconds from the signal start to the centre of frame 0. */
  offsetS: number;
  /** RMS per frame (linear). */
  lin: Float64Array;
  /** RMS per frame (dBFS). */
  db: Float64Array;
}

/** Sliding RMS envelope (default 10 ms windows every 1 ms). */
export function rmsEnvelope(x: ArrayLike<number>, sr: number, opts: { windowS?: number; hopS?: number } = {}): Envelope {
  const win = Math.max(1, Math.round((opts.windowS ?? 0.01) * sr));
  const hop = Math.max(1, Math.round((opts.hopS ?? 0.001) * sr));
  const prefix = new Float64Array(x.length + 1);
  for (let i = 0; i < x.length; i++) prefix[i + 1] = prefix[i] + x[i] * x[i];
  const frames = x.length >= win ? Math.floor((x.length - win) / hop) + 1 : 0;
  const lin = new Float64Array(frames);
  const db = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    const a = f * hop;
    lin[f] = Math.sqrt(Math.max(0, prefix[a + win] - prefix[a]) / win);
    db[f] = toDb(lin[f]);
  }
  return { hopS: hop / sr, offsetS: win / 2 / sr, lin, db };
}

function percentile(values: ArrayLike<number>, p: number): number {
  const finite = Array.from(values).filter(Number.isFinite).sort((a, b) => a - b);
  if (!finite.length) return -Infinity;
  return finite[Math.min(finite.length - 1, Math.max(0, Math.round(p * (finite.length - 1))))];
}

/**
 * Index of the first sample where the note starts: the first 1 ms frame whose RMS rises
 * within `thresholdDb` (default 40 dB) of the loudest frame, stepped back to the frame's start.
 */
export function findOnset(x: ArrayLike<number>, sr: number, thresholdDb = 40): number {
  const env = rmsEnvelope(x, sr, { windowS: 0.002, hopS: 0.0005 });
  let max = -Infinity;
  for (const v of env.db) max = Math.max(max, v);
  if (!Number.isFinite(max)) return 0;
  for (let f = 0; f < env.db.length; f++) {
    if (env.db[f] >= max - thresholdDb) return Math.round(f * env.hopS * sr);
  }
  return 0;
}

export interface EnvelopeStats {
  /** Time from 10 % to 90 % of the peak RMS. */
  attackMs?: number;
  /** Time from the start of the analysed signal to the RMS peak. */
  peakAtMs: number;
  /** Time from the RMS peak until it has fallen 20 dB (undefined if it never does). */
  decay20Ms?: number;
  /**
   * Decay rate as the time to fall 60 dB, from a straight-line fit (dB against time) over the
   * part of the decay between 5 dB and 35 dB below the peak (or 10 dB above the noise floor).
   * Undefined when the note doesn't decay measurably (`sustained`).
   */
  t60S?: number;
  /** The level stayed within 5 dB of its peak for the whole signal (an organ note, a held loop). */
  sustained: boolean;
}

/** Attack, decay and T60 of a note that starts at the beginning of `x`. */
export function envelopeStats(x: ArrayLike<number>, sr: number, noiseDb = -120): EnvelopeStats {
  const env = rmsEnvelope(x, sr);
  const { lin, db, hopS } = env;
  if (!lin.length) return { peakAtMs: 0, sustained: false };
  let p = 0;
  for (let i = 1; i < lin.length; i++) if (lin[i] > lin[p]) p = i;
  const peak = lin[p];
  const peakDb = db[p];
  const firstAt = (from: number, to: number, ok: (i: number) => boolean) => {
    for (let i = from; i < to; i++) if (ok(i)) return i;
    return -1;
  };
  const i10 = firstAt(0, p + 1, (i) => lin[i] >= 0.1 * peak);
  const i90 = firstAt(0, p + 1, (i) => lin[i] >= 0.9 * peak);
  const attackMs = i10 >= 0 && i90 >= 0 ? (i90 - i10) * hopS * 1000 : undefined;

  const i20 = peakDb - 20 > noiseDb + 6 ? firstAt(p, db.length, (i) => db[i] <= peakDb - 20) : -1;
  const decay20Ms = i20 >= 0 ? (i20 - p) * hopS * 1000 : undefined;

  const start = firstAt(p, db.length, (i) => db[i] <= peakDb - 5);
  const sustained = start < 0;
  let t60S: number | undefined;
  if (start >= 0) {
    const floor = Math.max(peakDb - 35, noiseDb + 10);
    let end = firstAt(start, db.length, (i) => db[i] <= floor);
    if (end < 0) end = db.length - 1;
    // Least-squares line through (t, dB) over [start, end].
    let n = 0, st = 0, sd = 0, stt = 0, std = 0;
    for (let i = start; i <= end; i++) {
      if (!Number.isFinite(db[i])) continue;
      const t = i * hopS;
      n++; st += t; sd += db[i]; stt += t * t; std += t * db[i];
    }
    const span = (end - start) * hopS;
    const den = n * stt - st * st;
    if (n >= 10 && span >= 0.02 && den > 0) {
      const slope = (n * std - st * sd) / den; // dB per second
      if (slope < 0 && -slope * span >= 3) t60S = -60 / slope;
    }
  }
  return { attackMs, peakAtMs: (p * hopS + env.offsetS) * 1000, decay20Ms, t60S, sustained };
}

// ── Pitch ────────────────────────────────────────────────────────────────────────────────

/** McLeod's normalized square difference at lag `tau` over the first `n` samples. */
function nsdf(x: ArrayLike<number>, n: number, tau: number): number {
  let r = 0;
  let m = 0;
  for (let i = 0; i + tau < n; i++) {
    const a = x[i];
    const b = x[i + tau];
    r += a * b;
    m += a * a + b * b;
  }
  return m > 0 ? (2 * r) / m : 0;
}

/** Vertex of the parabola through (−1, a), (0, b), (1, c): offset and value. */
function parabola(a: number, b: number, c: number): { dx: number; y: number } {
  const den = a - 2 * b + c;
  if (den === 0) return { dx: 0, y: b };
  const dx = Math.max(-1, Math.min(1, (0.5 * (a - c)) / den));
  return { dx, y: b - 0.25 * (a - c) * dx };
}

export interface PitchEstimate {
  hz: number;
  /** Peak of the normalized autocorrelation, 0–1: how periodic the signal is. */
  clarity: number;
}

/**
 * Fundamental frequency by normalized autocorrelation (McLeod pitch method): the first
 * autocorrelation peak within 90 % of the strongest one gives the period, which is then
 * refined at whole multiples of the period across the window (sub-cent precision on a
 * steady note). Undefined when the signal isn't periodic (clarity below 0.5).
 */
export function estimateF0(
  x: ArrayLike<number>, sr: number, opts: { minHz?: number; maxHz?: number } = {},
): PitchEstimate | undefined {
  const maxLag = Math.ceil(sr / (opts.minHz ?? 27.5));
  const minLag = Math.max(2, Math.floor(sr / (opts.maxHz ?? 4200)));
  const n = Math.min(x.length, 1 << 15);
  const coarseN = Math.min(n, Math.max(4096, 3 * maxLag));
  const top = Math.min(maxLag, Math.floor(coarseN / 2));
  if (top <= minLag + 2) return undefined;
  const d = new Float64Array(top + 2);
  for (let t = 1; t <= top + 1; t++) d[t] = nsdf(x, coarseN, t);
  // Key maxima: the highest point of each positive lobe after the first negative zero crossing.
  let t = 1;
  while (t <= top && d[t] > 0) t++;
  const peaks: number[] = [];
  while (t <= top) {
    while (t <= top && d[t] <= 0) t++;
    let best = -1;
    while (t <= top && d[t] > 0) {
      if (best < 0 || d[t] > d[best]) best = t;
      t++;
    }
    if (best > minLag && best < top) peaks.push(best);
  }
  if (!peaks.length) return undefined;
  const highest = Math.max(...peaks.map((p) => d[p]));
  if (highest < 0.5) return undefined;
  const pick = peaks.find((p) => d[p] >= 0.9 * highest)!;
  const v = parabola(d[pick - 1], d[pick], d[pick + 1]);
  let period = pick + v.dx;
  // Refine at 2, 4, 8 … periods: the lag error shrinks with the multiple.
  for (let mult = 2; mult * period + 3 < n / 2; mult *= 2) {
    const centre = Math.round(mult * period);
    let bestLag = centre;
    let bestVal = -Infinity;
    const vals = new Map<number, number>();
    for (let lag = centre - 2; lag <= centre + 2; lag++) {
      const val = nsdf(x, n, lag);
      vals.set(lag, val);
      if (val > bestVal) { bestVal = val; bestLag = lag; }
    }
    const a = vals.get(bestLag - 1) ?? nsdf(x, n, bestLag - 1);
    const c = vals.get(bestLag + 1) ?? nsdf(x, n, bestLag + 1);
    period = (bestLag + parabola(a, bestVal, c).dx) / mult;
  }
  return { hz: sr / period, clarity: Math.min(1, v.y) };
}

// ── Spectrum ─────────────────────────────────────────────────────────────────────────────

/** In-place iterative radix-2 FFT (re/im of equal power-of-two length). */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/**
 * Spectral centroid (Hz): the power-weighted mean frequency of a Hann-windowed FFT over up
 * to 32,768 samples, ignoring bins below 20 Hz and more than `floorDb` below the strongest
 * bin. A rough "brightness" number: a pure sine reads its own frequency. (Power, not
 * magnitude, so a partial weighs the same whether or not it falls on an FFT bin.)
 */
export function spectralCentroid(x: ArrayLike<number>, sr: number, floorDb = -80): number | undefined {
  let n = 1024;
  while (n * 2 <= Math.min(x.length, 1 << 15)) n *= 2;
  const len = Math.min(n, x.length);
  if (len < 64) return undefined;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < len; i++) re[i] = x[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (len - 1)));
  fft(re, im);
  const pow = new Float64Array(n / 2);
  let max = 0;
  for (let k = 1; k < n / 2; k++) {
    pow[k] = re[k] * re[k] + im[k] * im[k];
    max = Math.max(max, pow[k]);
  }
  if (max === 0) return undefined;
  const floor = max * 10 ** (floorDb / 10);
  let num = 0;
  let den = 0;
  for (let k = 1; k < n / 2; k++) {
    const f = (k * sr) / n;
    if (f < 20 || pow[k] < floor) continue;
    num += f * pow[k];
    den += pow[k];
  }
  return den > 0 ? num / den : undefined;
}

// ── Modulation ───────────────────────────────────────────────────────────────────────────

/** Strongest periodicity (Hz) of a frame series sampled at `rate` Hz, by autocorrelation. */
export function periodicity(
  series: ArrayLike<number>, rate: number, minHz: number, maxHz: number,
): { hz: number; clarity: number } | undefined {
  const n = series.length;
  // Remove a straight-line trend (a fading note, a slowly drifting pitch).
  let st = 0, sv = 0, stt = 0, stv = 0;
  for (let i = 0; i < n; i++) { st += i; sv += series[i]; stt += i * i; stv += i * series[i]; }
  const den = n * stt - st * st;
  const slope = den > 0 ? (n * stv - st * sv) / den : 0;
  const icpt = (sv - slope * st) / Math.max(1, n);
  const y = Float64Array.from({ length: n }, (_, i) => series[i] - (icpt + slope * i));
  const minLag = Math.max(1, Math.floor(rate / maxHz));
  const maxLag = Math.min(Math.ceil(rate / minHz), Math.floor(n / 2));
  if (maxLag <= minLag + 2) return undefined;
  const d = Float64Array.from({ length: maxLag + 2 }, (_, lag) => (lag < minLag ? 1 : nsdf(y, n, lag)));
  let lag = minLag;
  while (lag <= maxLag && d[lag] > 0) lag++;
  let best = -1;
  for (; lag <= maxLag; lag++) {
    if (d[lag] > d[lag - 1] && d[lag] >= d[lag + 1] && (best < 0 || d[lag] > d[best] * 1.1)) best = lag;
  }
  if (best < 0 || d[best] < 0.3) return undefined;
  const v = parabola(d[best - 1], d[best], d[best + 1]);
  return { hz: rate / (best + v.dx), clarity: Math.min(1, v.y) };
}

export interface Modulation {
  /** Modulation rate (Hz). */
  rateHz: number;
  /** Amplitude: half the 5–95 % spread, in dB (level) or cents (pitch). */
  depth: number;
  clarity: number;
}

/**
 * The held part of a note: from 50 ms after the level first comes within 20 dB of its
 * maximum to 50 ms before the last moment it is still within 20 dB, so the attack, a quick
 * release and any silence around the note don't count as modulation.
 */
export function steadyPart(x: Float32Array, sr: number): Float32Array {
  const env = rmsEnvelope(x, sr, { windowS: 0.01, hopS: 0.005 });
  let max = -Infinity;
  for (const v of env.db) max = Math.max(max, v);
  let first = -1;
  let last = -1;
  env.db.forEach((v, i) => { if (v >= max - 20) { if (first < 0) first = i; last = i; } });
  if (first < 0) return x;
  const a = Math.round((first * env.hopS + 0.05) * sr);
  const b = Math.round((last * env.hopS + 2 * env.offsetS - 0.05) * sr);
  return b - a > 0.2 * sr ? x.subarray(a, b) : x;
}

/** Smaller level wobbles (window ripple, a decaying note) don't count as tremolo. */
const MIN_TREMOLO_DB = 0.3;
/** Smaller pitch wobbles don't count as vibrato. */
const MIN_VIBRATO_CENTS = 1;

/**
 * Tremolo / rotary amplitude modulation: rate and depth (dB) of the RMS envelope. Undefined
 * when the level moves less than ±0.3 dB or not periodically.
 */
export function amplitudeModulation(x: Float32Array, sr: number, minHz = 0.3, maxHz = 20): Modulation | undefined {
  const env = rmsEnvelope(steadyPart(x, sr), sr, { windowS: 0.01, hopS: 0.002 });
  const depth = (percentile(env.db, 0.95) - percentile(env.db, 0.05)) / 2;
  if (!(depth >= MIN_TREMOLO_DB)) return undefined;
  const per = periodicity(env.db.map((v) => (Number.isFinite(v) ? v : -120)), 1 / env.hopS, minHz, maxHz);
  return per && { rateHz: per.hz, depth, clarity: per.clarity };
}

/**
 * Pitch over time (cents relative to `centreHz`), one value every `hopS`, from 20 ms windows
 * searched within a semitone of `centreHz`.
 */
export function pitchTrack(x: ArrayLike<number>, sr: number, centreHz: number, hopS = 0.005): Float64Array {
  const win = Math.max(Math.round(0.02 * sr), Math.round((3 * sr) / centreHz));
  const hop = Math.max(1, Math.round(hopS * sr));
  const lo = Math.max(2, Math.floor(sr / (centreHz * 2 ** (1 / 12))));
  const hi = Math.ceil(sr / (centreHz / 2 ** (1 / 12)));
  const frames = x.length >= win + hi ? Math.floor((x.length - win - hi) / hop) + 1 : 0;
  const out = new Float64Array(frames);
  const seg = new Float64Array(win + hi + 1);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < seg.length; i++) seg[i] = x[f * hop + i];
    let best = lo;
    const vals = new Float64Array(hi + 2);
    for (let t = lo - 1; t <= hi + 1; t++) {
      vals[t] = nsdf(seg, win + t, t);
      if (t >= lo && t <= hi && vals[t] > vals[best]) best = t;
    }
    const period = best + parabola(vals[best - 1], vals[best], vals[best + 1]).dx;
    out[f] = centsBetween(sr / period, centreHz);
  }
  return out;
}

/** Vibrato / chorus pitch modulation: rate and depth (cents) around `centreHz`. */
export function pitchModulation(x: Float32Array, sr: number, centreHz: number, minHz = 0.3, maxHz = 20): Modulation | undefined {
  const hopS = 0.005;
  const track = pitchTrack(steadyPart(x, sr), sr, centreHz, hopS);
  const depth = (percentile(track, 0.95) - percentile(track, 0.05)) / 2;
  if (!(depth >= MIN_VIBRATO_CENTS)) return undefined;
  const per = periodicity(track, 1 / hopS, minHz, maxHz);
  return per && { rateHz: per.hz, depth, clarity: per.clarity };
}

/** Amplitude-modulation rate over time (rotary spin-up/down): `[seconds, Hz]` rows. */
export function modulationTrack(
  x: Float32Array, sr: number, opts: { windowS?: number; hopS?: number } = {},
): { atS: number; rateHz?: number }[] {
  const win = Math.round((opts.windowS ?? 1.5) * sr);
  const hop = Math.round((opts.hopS ?? 0.25) * sr);
  const rows: { atS: number; rateHz?: number }[] = [];
  for (let a = 0; a + win <= x.length; a += hop) {
    rows.push({ atS: (a + win / 2) / sr, rateHz: amplitudeModulation(x.subarray(a, a + win), sr, 0.5, 15)?.rateHz });
  }
  return rows;
}

export interface TimelineRow {
  atS: number;
  rmsDb: number;
  centroidHz?: number;
}

/**
 * Level and brightness over time: one row every `stepS` (default 0.1 s) from 50 ms windows.
 * Shows a filter-envelope sweep, a compressor recovering, a reverb tail or a rotor spinning up.
 */
export function timeline(x: Float32Array, sr: number, stepS = 0.1, windowS = 0.05): TimelineRow[] {
  const win = Math.round(windowS * sr);
  const step = Math.round(stepS * sr);
  const rows: TimelineRow[] = [];
  for (let a = 0; a + win <= x.length; a += step) {
    const seg = x.subarray(a, a + win);
    rows.push({ atS: a / sr, rmsDb: levels(seg).rmsDb, centroidHz: spectralCentroid(seg, sr) });
  }
  return rows;
}

// ── Notes ────────────────────────────────────────────────────────────────────────────────

/**
 * Note starts in a recording of separate notes (a velocity sweep): sample indices where the
 * RMS jumps at least `riseDb` within 30 ms, at least 20 dB above the noise floor and at least
 * `minGapS` after the previous start.
 */
export function segmentNotes(x: ArrayLike<number>, sr: number, opts: { riseDb?: number; minGapS?: number } = {}): number[] {
  const env = rmsEnvelope(x, sr, { windowS: 0.01, hopS: 0.002 });
  const db = env.db.map((v) => Math.max(v, -200)); // digital silence reads −200 dB
  const noise = percentile(db, 0.1);
  const look = Math.max(1, Math.round(0.03 / env.hopS));
  const gap = Math.round((opts.minGapS ?? 0.3) / env.hopS);
  const rise = opts.riseDb ?? 15;
  const starts: number[] = [];
  let last = -Infinity;
  // A take that starts mid-note counts as starting from silence.
  const level = (j: number) => (j < 0 ? -200 : db[j]);
  for (let i = 0; i < db.length; i++) {
    if (i - last < gap || !(db[i] > noise + 20)) continue;
    let lo = Infinity;
    let at = i;
    for (let j = i - look; j <= i; j++) if (level(j) < lo) { lo = level(j); at = j; }
    if (db[i] - lo < rise) continue;
    // The first frame that rose 3 dB above the floor: its window has just reached the note.
    const floor = Math.max(lo, noise);
    let s = Math.max(0, at);
    while (s < i && db[s] < floor + 3) s++;
    starts.push(Math.min(x.length - 1, at < 0 && s === 0 ? 0 : Math.round((s * env.hopS + 2 * env.offsetS) * sr)));
    last = i;
  }
  return starts;
}

/**
 * The `n`-th note (1-based) of a take with several notes: from 50 ms before it starts to
 * 20 ms before the next one. Throws when the take has fewer notes.
 */
export function nthNote(x: Float32Array, sr: number, n: number): Float32Array {
  const starts = segmentNotes(x, sr);
  if (!(n >= 1 && n <= starts.length)) throw new Error(`The take has ${starts.length} note(s); can't pick note ${n}.`);
  const a = Math.max(0, starts[n - 1] - Math.round(0.05 * sr));
  const b = n < starts.length ? starts[n] - Math.round(0.02 * sr) : x.length;
  return x.subarray(a, Math.max(a + 1, b));
}

export interface Measurement {
  sampleRate: number;
  /** Where the note starts in the file (s). */
  onsetS: number;
  /** Length analysed after the onset (s). */
  lengthS: number;
  /** Level before the note (dBFS), or −120 when there's no lead-in. */
  noiseDb: number;
  f0?: PitchEstimate;
  peakDb: number;
  rmsDb: number;
  centroidHz?: number;
  env: EnvelopeStats;
  tremolo?: Modulation;
  vibrato?: Modulation;
}

export interface MeasureOptions {
  /** Seconds after the onset to analyse: [start, end]. Default: the whole note. */
  window?: [number, number?];
  /** Seconds after the window start used for pitch and brightness. Default 0.1–0.5 s. */
  steady?: [number, number];
  /** Also measure amplitude and pitch modulation. */
  modulation?: boolean;
  /** How long the key was held (s, from the onset): modulation is measured only while it is. */
  heldS?: number;
  /** Onset found in another signal (keeps two takes aligned), in samples. */
  onset?: number;
}

/** All the note measurements the test plan asks for, on one mono signal. */
export function measure(x: Float32Array, sr: number, opts: MeasureOptions = {}): Measurement {
  const onset = opts.onset ?? findOnset(x, sr);
  const pre = x.subarray(Math.max(0, onset - Math.round(0.2 * sr)), Math.max(0, onset - Math.round(0.01 * sr)));
  const noiseDb = pre.length >= 0.02 * sr ? Math.max(-120, levels(pre).rmsDb) : -120;
  const [ws, we] = opts.window ?? [0];
  const a = Math.min(x.length, onset + Math.round(ws * sr));
  const b = we === undefined ? x.length : Math.min(x.length, onset + Math.round(we * sr));
  const seg = x.subarray(a, Math.max(a, b));
  const len = seg.length / sr;
  let [ss, se] = opts.steady ?? [0.1, 0.5];
  if (len < se) {
    se = len;
    ss = Math.min(ss, Math.max(0, len - 0.05));
    if (se - ss < 0.05) ss = Math.min(0.02, len / 4);
  }
  const steady = seg.subarray(Math.round(ss * sr), Math.round(se * sr));
  const lv = levels(seg);
  const f0 = steady.length >= 0.03 * sr ? estimateF0(steady, sr) : undefined;
  const m: Measurement = {
    sampleRate: sr, onsetS: onset / sr, lengthS: len, noiseDb, f0,
    peakDb: lv.peakDb, rmsDb: lv.rmsDb, centroidHz: spectralCentroid(steady, sr), env: envelopeStats(seg, sr, noiseDb),
  };
  if (opts.modulation) {
    const heldFor = opts.heldS === undefined ? Infinity : opts.heldS - ws;
    const held = heldFor > 0.2 ? seg.subarray(0, Math.round(Math.min(len, heldFor) * sr)) : seg;
    m.tremolo = amplitudeModulation(held, sr);
    if (f0) m.vibrato = pitchModulation(held, sr, f0.hz);
  }
  return m;
}
