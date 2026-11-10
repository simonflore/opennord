/**
 * Recording a take (spec §7, canvas "Record"): blocks of audio come in from the input; nothing
 * is kept until the sound gets louder than the start threshold (a short pre-roll before it is
 * kept, so the attack is whole), and recording stops by itself after a stretch of silence when
 * asked. Pure: the screen feeds it blocks from the browser's audio input.
 */
import type { ClipAudio } from './render';

export interface RecorderOptions {
  sampleRate: number;
  channels: 1 | 2;
  /** Start keeping audio once a block's peak is louder than this (dBFS); null starts at once. */
  startDb: number | null;
  /** Stop after this many seconds below the start level (or −60 dB with no start level); null never. */
  stopAfterSilenceS: number | null;
  /** Kept before the moment the threshold was crossed, in seconds. */
  preRollS?: number;
  /** Longest recording, in seconds (memory). */
  maxSeconds?: number;
}

export type RecorderState = 'armed' | 'recording' | 'done';

export interface Recorder {
  /** Feed one block (one Float32Array per input channel); returns the state after it. */
  push(block: Float32Array[]): RecorderState;
  readonly state: RecorderState;
  /** Peak of the last block per channel, in dBFS (−Infinity for silence), for the meters. */
  readonly levelsDb: number[];
  /** Seconds kept so far. */
  readonly seconds: number;
  /** Stop and give the recording; null when nothing was kept. */
  finish(): ClipAudio | null;
}

const peakDb = (ch: Float32Array) => {
  let p = 0;
  for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > p) p = a; }
  return p > 0 ? 20 * Math.log10(p) : -Infinity;
};

export function createRecorder(opts: RecorderOptions): Recorder {
  const pre = Math.round((opts.preRollS ?? 0.05) * opts.sampleRate);
  const max = Math.round((opts.maxSeconds ?? 600) * opts.sampleRate);
  const silenceDb = opts.startDb ?? -60;
  const silenceFrames = opts.stopAfterSilenceS === null ? Infinity : Math.round(opts.stopAfterSilenceS * opts.sampleRate);
  let state: RecorderState = opts.startDb === null ? 'recording' : 'armed';
  let levels: number[] = Array.from({ length: opts.channels }, () => -Infinity);
  const kept: Float32Array[][] = []; // blocks, per channel
  let keptFrames = 0;
  let quietFrames = 0;
  const preBlocks: Float32Array[][] = []; // while armed: the last blocks, for the pre-roll
  let preFrames = 0;

  /** The block as the recorder's channels: a mono input doubled for stereo, a stereo one mixed for mono. */
  const shape = (block: Float32Array[]): Float32Array[] => {
    if (opts.channels === 2) return [block[0], block[1] ?? block[0]].map((c) => Float32Array.from(c));
    if (block.length === 1) return [Float32Array.from(block[0])];
    const out = new Float32Array(block[0].length);
    for (const c of block) for (let i = 0; i < out.length; i++) out[i] += c[i] / block.length;
    return [out];
  };
  const keep = (b: Float32Array[]) => { kept.push(b); keptFrames += b[0].length; };

  return {
    get state() { return state; },
    get levelsDb() { return levels; },
    get seconds() { return keptFrames / opts.sampleRate; },
    push(block) {
      if (state === 'done' || !block.length || !block[0].length) return state;
      const b = shape(block);
      levels = b.map(peakDb);
      const loudest = Math.max(...levels);
      if (state === 'armed') {
        if (opts.startDb !== null && loudest > opts.startDb) {
          // Keep the pre-roll: the end of the blocks heard while armed.
          let need = pre;
          const tail: Float32Array[][] = [];
          for (let k = preBlocks.length - 1; k >= 0 && need > 0; k--) {
            const n = preBlocks[k][0].length;
            tail.unshift(n <= need ? preBlocks[k] : preBlocks[k].map((c) => c.subarray(n - need)));
            need -= Math.min(n, need);
          }
          tail.forEach(keep);
          state = 'recording';
        } else {
          preBlocks.push(b); preFrames += b[0].length;
          while (preBlocks.length > 1 && preFrames - preBlocks[0][0].length >= pre) preFrames -= preBlocks.shift()![0].length;
          return state;
        }
      }
      keep(b);
      quietFrames = loudest > silenceDb ? 0 : quietFrames + b[0].length;
      if (quietFrames >= silenceFrames || keptFrames >= max) state = 'done';
      return state;
    },
    finish() {
      state = 'done';
      if (!keptFrames) return null;
      // A stop on silence drops the silence it waited through, keeping a little of the tail.
      const drop = Number.isFinite(silenceFrames) && quietFrames >= silenceFrames
        ? Math.max(0, quietFrames - Math.round(0.2 * opts.sampleRate)) : 0;
      const frames = keptFrames - drop;
      const channels = Array.from({ length: opts.channels }, () => new Float32Array(frames));
      let at = 0;
      for (const b of kept) {
        const n = Math.min(b[0].length, frames - at);
        if (n <= 0) break;
        b.forEach((c, i) => channels[i].set(c.subarray(0, n), at));
        at += n;
      }
      return { sampleRate: opts.sampleRate, channels };
    },
  };
}
