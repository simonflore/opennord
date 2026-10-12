import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodeNsmp, readStrokeRegions, strokeLoop, loopDecayDbPerSecond, NSMP_ENVELOPE_RATE, type StrokeRegions } from './nsmp';
import type { DecodedStroke, StrokeMark } from './nsmp-codec';

/** A `stk` header holding only the region pointers and the loop-decay field. */
function header(start: number, secondStart: number, loopBegin: number, end: number, decayRaw = 0x800000): Uint8Array {
  const b = new Uint8Array(0x40);
  const put = (o: number, v: number) => new DataView(b.buffer).setUint32(o, v);
  put(0x12, start); put(0x1b, secondStart); put(0x24, loopBegin); put(0x2d, end);
  b[0x28] = decayRaw >>> 16; b[0x29] = (decayRaw >>> 8) & 0xff; b[0x2a] = decayRaw & 0xff;
  return b;
}

describe('readStrokeRegions', () => {
  it('reads the pointers relative to the stroke start, and loops when loop begin is before the end', () => {
    expect(readStrokeRegions(header(500, 600, 900, 1000, 0x8001ea), 0)).toEqual({ secondStart: 100, loopBegin: 400, end: 500, loops: true, decayRaw: 0x8001ea });
  });
  it('is a one-shot when loop begin equals the end', () => {
    expect(readStrokeRegions(header(500, 600, 1000, 1000), 0)?.loops).toBe(false);
  });
  it('is null when the pointers are out of order', () => {
    expect(readStrokeRegions(header(500, 400, 900, 1000), 0)).toBeNull();
  });
});

describe('loopDecayDbPerSecond', () => {
  it('is 0 for the hold marker', () => {
    expect(loopDecayDbPerSecond(0x800000)).toBe(0);
  });
  it('inverts the editor: a Decay time of T seconds falls 40 dB in T seconds', () => {
    for (const seconds of [0.5, 2, 12]) {
      const stored = -Math.trunc(0.01 ** (1 / (seconds * NSMP_ENVELOPE_RATE)) * 0x800000); // NW1::Decay2DSP
      expect(loopDecayDbPerSecond(stored & 0xffffff)).toBeCloseTo(40 / seconds, 0);
    }
  });
});

describe('strokeLoop', () => {
  const mark = (word: number, sample: number, loopDecay = false): StrokeMark => ({ word, sample, loopDecay });
  const decoded = (marks: StrokeMark[], frames: number, ch = 1): DecodedStroke =>
    ({ channels: Array.from({ length: ch }, () => new Int32Array(frames)), endOffset: 0, segments: [], marks });
  const regions: StrokeRegions = { secondStart: 100, loopBegin: 400, end: 500, loops: true, decayRaw: 0x800000 };

  it('maps the stream-word pointers to the audio frames of the blocks they land on', () => {
    const d = decoded([mark(0, 0), mark(100, 300), mark(400, 1500, true), mark(500, 2000)], 2000);
    expect(strokeLoop(regions, d, 1)).toEqual({ loopStart: 1500, loopEnd: 2000, loops: true, altStart: 300, decayDbPerSecond: 0 });
  });
  it('halves interleaved positions for a stereo stroke', () => {
    const d = decoded([mark(0, 0), mark(100, 600), mark(400, 3000, true), mark(500, 4000)], 2000, 2);
    expect(strokeLoop(regions, d, 2)).toMatchObject({ loopStart: 1500, altStart: 300 });
  });
  it('anchors on the stream end when the decoder entered the stream a few words early', () => {
    const d = decoded([mark(22, 0), mark(122, 300), mark(422, 1500, true), mark(522, 2000)], 2000);
    expect(strokeLoop(regions, d, 1)).toMatchObject({ loopStart: 1500, altStart: 300 });
  });
  it('gives a one-shot an empty loop at the end', () => {
    const d = decoded([mark(0, 0), mark(100, 300), mark(500, 2000)], 2000);
    expect(strokeLoop({ ...regions, loopBegin: 500, loops: false, decayRaw: 0x8001ea }, d, 1))
      .toEqual({ loopStart: 2000, loopEnd: 2000, loops: false, altStart: 300, decayDbPerSecond: 0 });
  });
  it('keeps the loop when only the alternate start lands on no block', () => {
    const d = decoded([mark(0, 0), mark(400, 1500, true), mark(500, 2000)], 2000);
    expect(strokeLoop(regions, d, 1)).toMatchObject({ loopStart: 1500, loops: true, altStart: 0 });
  });
  it('reads the pointers as written when the last block is not the stream end', () => {
    const d = decoded([mark(0, 0), mark(100, 300), mark(400, 1500, true)], 2000);
    expect(strokeLoop(regions, d, 1)).toMatchObject({ loopStart: 1500, altStart: 300 });
  });
  it('is null rather than a guess when the loop begin lands on no block, or the header is unreadable', () => {
    const d = decoded([mark(0, 0), mark(100, 300), mark(500, 2000)], 2000);
    expect(strokeLoop(regions, d, 1)).toBeNull();
    expect(strokeLoop(null, d, 1)).toBeNull();
  });
});

// Real sample audio is kept out of the repo (docs/LEGAL.md), so these skip when
// the files are absent (CI) and run locally.
const takeOnMe = resolve(__dirname, '../../../research/nsmp/TAKE ON ME.nsmp');
const have = existsSync(takeOnMe);

describe('stroke loop region (#20)', () => {
  it.skipIf(!have)('decodes loop vs one-shot from the stroke header (OG, validated)', () => {
    const strokes = decodeNsmp(new Uint8Array(readFileSync(takeOnMe)));
    const loops = strokes.map((s) => s.loop?.loops);
    // Per docs/NSMP-CODEC.md, TAKE ON ME stk 1/2/3/8 are one-shot (loop begin == end),
    // the rest loop. Every stroke's region must be decodable (no nulls).
    expect(loops).toEqual([true, false, false, false, false, true, true, true, false]);
    for (const s of strokes) {
      expect(s.loop).not.toBeNull();
      expect(s.loop!.loopStart).toBeLessThanOrEqual(s.loop!.loopEnd); // monotonic window
    }
  });
});

const fixtures = resolve(__dirname, '../../../fixtures');
const samples = existsSync(fixtures) ? readdirSync(fixtures).filter((f) => /\.nsmp[34]?$/.test(f)) : [];

describe.skipIf(samples.length === 0)('stroke loops across the local corpus (OG, codec 3, codec 4)', () => {
  it.each(samples)('%s: every region pointer lands on a block, and the loop-decay flag opens the loop', (name) => {
    for (const s of decodeNsmp(new Uint8Array(readFileSync(resolve(fixtures, name))))) {
      expect(s.loop, `stroke ${s.index}`).not.toBeNull();
      const l = s.loop!;
      expect(l.altStart).toBeLessThanOrEqual(l.loopStart);
      expect(l.loopEnd).toBe(s.channels[0].length);
      const flagged = s.marks.filter((m) => m.loopDecay).map((m) => Math.floor(m.sample / s.channelCount));
      expect(flagged).toEqual(l.loops ? [l.loopStart] : []);
    }
  });
});
