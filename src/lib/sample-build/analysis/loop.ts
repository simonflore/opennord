/**
 * Find a loop in a take: a loop start and a loop end where the sound runs on without a click or
 * a jump in level. On the Nord a loop always ends the sample, so the end found is the take's new
 * End and anything after it is dropped (`model.ts`).
 *
 * How: the steady part of the sound is the stretch after the attack while it stays within
 * {@link STEADY_DB} of its loudest. A few upward zero crossings near the end of that stretch are
 * the candidate ends; for each, every upward zero crossing at least `minLoopSeconds` earlier is a
 * candidate start. Playing on from a start must sound like playing on from the end, so the
 * {@link MATCH_MS} before each are compared (normalised squared difference, coarse then exact),
 * plus the level over the {@link LEVEL_MS} before each, so the loop doesn't pulse. Longer loops
 * win a close call: they sound less like a loop. All in mono; a stereo take's channels are mixed.
 */
import type { ClipAudio } from '../render';

export interface LoopSearch {
  /** Shortest loop to consider, in seconds. */
  minLoopSeconds?: number;
}

export interface FoundLoop {
  /** Loop start, in frames of the clip. */
  start: number;
  /** Loop end, exclusive: the take's new End, in frames of the clip. */
  end: number;
  /** How alike the sound is either side of the join, 0 to 1: 1 is the same, 0 no more alike than unrelated sounds. */
  match: number;
}

/** The steady part stays within this many dB of the take's loudest moment. */
export const STEADY_DB = 12;
/** Compared before a start and before an end. */
const MATCH_MS = 12;
const LEVEL_MS = 60;
/** After the loudest moment, the attack is taken to be over after this. */
const ATTACK_SETTLE_MS = 60;
/** Ends are looked for in this last part of the steady stretch (at most END_WINDOW_S). */
const END_WINDOW_PART = 0.2;
const END_WINDOW_S = 0.5;
const END_CANDIDATES = 16;
const REFINE_PER_END = 6;
/** Score: 1 dB of level difference weighs as much as this much mismatch; a whole-region loop gets this bonus. */
const LEVEL_WEIGHT = 0.02;
const LENGTH_BONUS = 0.03;
export const DEFAULT_MIN_LOOP_SECONDS = 0.1;

function mono(audio: ClipAudio, from: number, to: number): Float32Array {
  const out = new Float32Array(to - from);
  const n = audio.channels.length;
  for (const ch of audio.channels) for (let i = from; i < to; i++) out[i - from] += ch[i] / n;
  return out;
}

const rmsOf = (x: Float32Array, from: number, to: number) => {
  let s = 0;
  for (let i = Math.max(0, from); i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - Math.max(0, from)));
};

const db = (r: number) => 20 * Math.log10(Math.max(r, 1e-9));

/** Upward zero crossings in [from, to): frames whose sample is ≥ 0 after one below 0. */
function upCrossings(x: Float32Array, from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = Math.max(1, from); i < to; i++) if (x[i - 1] < 0 && x[i] >= 0) out.push(i);
  return out;
}

/** Normalised squared difference of the `w` frames before `a` and before `b`: 0 alike, up to 2 opposite. */
function mismatch(x: Float32Array, a: number, b: number, w: number, step: number): number {
  let d = 0, e = 0;
  for (let i = 1; i <= w; i += step) {
    const p = x[a - i], q = x[b - i];
    d += (p - q) * (p - q);
    e += p * p + q * q;
  }
  return e > 0 ? d / e : 0;
}

/**
 * The best loop in `take` (frames of the clip, [start, end)), or null when the take is too short
 * or too quiet to hold one.
 */
export function findLoop(audio: ClipAudio, take: { start: number; end: number }, opts: LoopSearch = {}): FoundLoop | null {
  const sr = audio.sampleRate;
  const len = take.end - take.start;
  const w = Math.max(8, Math.round((MATCH_MS / 1000) * sr));
  const lw = Math.max(w, Math.round((LEVEL_MS / 1000) * sr));
  const minLoop = Math.max(w, Math.round((opts.minLoopSeconds ?? DEFAULT_MIN_LOOP_SECONDS) * sr));
  if (len < minLoop + 2 * lw) return null;
  const x = mono(audio, take.start, take.end); // index 0 is the take's start

  // The envelope in 10 ms hops, and the steady stretch after the loudest moment.
  const hop = Math.max(1, Math.round(0.01 * sr));
  const env: number[] = [];
  for (let at = 0; at < len; at += hop) env.push(rmsOf(x, at, Math.min(len, at + hop)));
  let peakHop = 0;
  env.forEach((r, i) => { if (r > env[peakHop]) peakHop = i; });
  if (env[peakHop] < 1e-4) return null; // silence
  const floor = env[peakHop] * 10 ** (-STEADY_DB / 20);
  let lastHop = peakHop;
  for (let i = env.length - 1; i > peakHop; i--) if (env[i] >= floor) { lastHop = i; break; }
  let begin = Math.max(lw + 1, (peakHop * hop) + Math.round((ATTACK_SETTLE_MS / 1000) * sr));
  let steadyEnd = Math.min(len, (lastHop + 1) * hop);
  if (steadyEnd - begin < minLoop + w) {
    // No steady stretch long enough (a sound that dies away fast): use the second half of the take.
    begin = Math.max(lw + 1, Math.floor(len / 2) - minLoop);
    steadyEnd = len;
  }
  if (steadyEnd - begin < minLoop + w) return null;

  const window = Math.min(Math.round(END_WINDOW_S * sr), Math.max(w, Math.round((steadyEnd - begin) * END_WINDOW_PART)));
  let ends = upCrossings(x, Math.max(begin + minLoop, steadyEnd - window), steadyEnd);
  if (ends.length > END_CANDIDATES) ends = Array.from({ length: END_CANDIDATES }, (_, k) => ends[Math.round((k * (ends.length - 1)) / (END_CANDIDATES - 1))]);
  if (!ends.length) return null;
  const starts = upCrossings(x, begin, steadyEnd - minLoop);
  if (!starts.length) return null;
  const level = new Map<number, number>();
  const levelAt = (i: number) => { let v = level.get(i); if (v === undefined) { v = db(rmsOf(x, i - lw, i)); level.set(i, v); } return v; };
  const span = steadyEnd - begin;

  let best: { s: number; e: number; score: number; nsd: number } | null = null;
  const coarseStep = Math.max(1, Math.round(w / 64));
  for (const e of ends) {
    const top: { s: number; c: number }[] = [];
    const slopeE = x[e] - x[e - 1];
    for (const s of starts) {
      if (s > e - minLoop) break;
      const slopeS = x[s] - x[s - 1];
      if (slopeS > 3 * slopeE || slopeE > 3 * slopeS) continue; // a different slope through zero won't join cleanly
      const c = mismatch(x, s, e, w, coarseStep);
      if (top.length < REFINE_PER_END) top.push({ s, c });
      else if (c < top[top.length - 1].c) top[top.length - 1] = { s, c };
      else continue;
      top.sort((a, b) => a.c - b.c);
    }
    for (const { s } of top) {
      const nsd = mismatch(x, s, e, w, 1);
      const score = nsd + LEVEL_WEIGHT * Math.abs(levelAt(s) - levelAt(e)) - LENGTH_BONUS * ((e - s) / span);
      if (!best || score < best.score) best = { s, e, score, nsd };
    }
  }
  if (!best) return null;
  return { start: take.start + best.s, end: take.start + best.e, match: Math.max(0, Math.min(1, 1 - best.nsd)) };
}

/**
 * How alike the sound is either side of a loop's join, 0 to 1, as {@link findLoop} scores it:
 * the {@link MATCH_MS} before the loop start against the same before the end. For any loop,
 * found or set by hand. With a loop crossfade (`fadeFrames`, as `renderTake` writes it) the end
 * is scored as faded, so a join the crossfade has smoothed scores as it plays. Reads only the
 * frames it compares; null when there isn't room to compare.
 */
export function loopJoinMatch(audio: ClipAudio, loopStart: number, end: number, fadeFrames = 0): number | null {
  const w = Math.max(8, Math.round((MATCH_MS / 1000) * audio.sampleRate));
  const x = Math.max(0, Math.min(fadeFrames, end - loopStart, loopStart));
  if (loopStart - w < 0 || end > audio.channels[0].length || end - loopStart < w) return null;
  const before = mono(audio, loopStart - w, loopStart);
  const atEnd = mono(audio, end - w, end);
  if (x > 0) {
    // The fade runs over the last x frames before the end, into the x frames before the loop start (render.ts).
    const pre = mono(audio, loopStart - x, loopStart);
    for (let i = 0; i < w; i++) {
      const k = i - (w - x); // position within the fade, when the window reaches into it
      if (k < 0) continue;
      const g = (k + 1) / x;
      atEnd[i] = atEnd[i] * (1 - g) + pre[k] * g;
    }
  }
  let d = 0, e = 0;
  for (let i = 0; i < w; i++) { const p = before[i], q = atEnd[i]; d += (p - q) * (p - q); e += p * p + q * q; }
  return Math.max(0, Math.min(1, 1 - (e > 0 ? d / e : 0)));
}
