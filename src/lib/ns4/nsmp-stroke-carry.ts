/**
 * The part of writing a converted stroke that every generation shares: cut the stream
 * where the source's regions begin, and write the header's four region pointers
 *. The legacy and the codec-3/4 writers differ
 * only in word size and in where their header ends.
 */
import { encodeStrokeNW1Marked, type EncodeNW1Options } from './nw1-encode';
import type { WriteStrokeMeta } from './nsmp-write';

export interface CarriedStream {
  /** The block stream, stop block included. */
  stream: Uint8Array;
  /** Stream words from the stream's start to the alternate start (0 = none), the loop-begin
   *  block (the stop block on a one-shot) and the stop block. */
  altWord: number;
  loopWord: number;
  stopWord: number;
}

/** Encode `channels` with a segment at each of the source's region starts. */
export function encodeCarriedStream(
  channels: ArrayLike<number>[], meta: Pick<WriteStrokeMeta, 'segmentsInterleaved' | 'loop'>, enc: EncodeNW1Options,
): CarriedStream {
  const nCh = channels.length;
  const frames = channels[0]?.length ?? 0;
  const inside = (f: number | undefined) => (f !== undefined && Number.isInteger(f) && f > 0 && f < frames ? f : undefined);
  const loop = meta.loop?.loops ? inside(meta.loop.loopStart) : undefined;
  const alt = inside(meta.loop?.altStart);
  const cuts = new Set((meta.segmentsInterleaved ?? []).filter((s) => s > 0 && s < frames * nCh && s % nCh === 0));
  if (loop !== undefined) cuts.add(loop * nCh);
  if (alt !== undefined) cuts.add(alt * nCh);
  const { bytes, marks } = encodeStrokeNW1Marked(channels, {
    ...enc, segmentsInterleaved: [...cuts].sort((a, b) => a - b),
    loopBeginInterleaved: loop === undefined ? undefined : loop * nCh,
  });
  // Every cut opens a block, so each region has its mark; a missing one is a bug here, and
  // is reported instead of quietly writing a note that no longer loops.
  const wordOf = (frame: number, what: string): number => {
    const m = marks.find((x) => x.sample === frame * nCh);
    if (!m) throw new Error(`convert: no block opens at the ${what} (frame ${frame})`);
    return m.word;
  };
  const stopWord = marks[marks.length - 1].word;
  return {
    stream: bytes, stopWord,
    altWord: alt === undefined ? 0 : wordOf(alt, 'alternate start'),
    loopWord: loop === undefined ? stopWord : wordOf(loop, 'loop start'),
  };
}

const put32 = (b: Uint8Array, o: number, v: number) => {
  b[o] = (v >>> 24) & 0xff; b[o + 1] = (v >>> 16) & 0xff; b[o + 2] = (v >>> 8) & 0xff; b[o + 3] = v & 0xff;
};

/**
 * Write the region pointers (+0x12, +0x1b, +0x24, +0x2d) with their `0x80` markers and the
 * loop decay (+0x28) into a stroke header. `start` is the stream's first word, counted from
 * the file body.
 */
export function putRegionPointers(header: Uint8Array, start: number, s: CarriedStream, decayRaw = 0x800000): void {
  put32(header, 0x12, start);
  header[0x16] = 0x80;
  put32(header, 0x1b, start + s.altWord);
  header[0x1f] = 0x80;
  put32(header, 0x24, start + s.loopWord);
  header[0x28] = (decayRaw >>> 16) & 0xff; header[0x29] = (decayRaw >>> 8) & 0xff; header[0x2a] = decayRaw & 0xff; // 0x800000 = hold
  put32(header, 0x2d, start + s.stopWord);
}
