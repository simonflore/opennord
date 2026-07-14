import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodeStroke } from './nsmp-encode';
import { decodeStroke } from './nsmp-codec';
import { decodeNsmp } from './nsmp';

/** encode → decode must return the exact input PCM. */
function roundTrip(channels: Int32Array[]): Int32Array[] {
  const bytes = encodeStroke(channels);
  return decodeStroke(bytes, 0, channels.length).channels;
}

describe('encodeStroke ↔ decodeStroke round-trip (synthetic)', () => {
  it('mono ramp (order-1 predictor → tiny residuals)', () => {
    const ramp = Int32Array.from({ length: 1000 }, (_, i) => i - 500);
    const [out] = roundTrip([ramp]);
    expect(Array.from(out)).toEqual(Array.from(ramp));
  });

  it('stereo sine + silence onset', () => {
    const N = 5000;
    const L = Int32Array.from({ length: N }, (_, i) => (i < 100 ? 0 : Math.round(3000 * Math.sin(i / 7))));
    const R = Int32Array.from({ length: N }, (_, i) => (i < 100 ? 0 : Math.round(2500 * Math.sin(i / 11))));
    const [oL, oR] = roundTrip([L, R]);
    expect(Array.from(oL)).toEqual(Array.from(L));
    expect(Array.from(oR)).toEqual(Array.from(R));
  });

  it('full-range 16-bit content (forces high bitWidth blocks)', () => {
    // deterministic pseudo-random in [-32768, 32767]
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 65536) - 32768;
    const sig = Int32Array.from({ length: 3000 }, rnd);
    const [out] = roundTrip([sig]);
    expect(Array.from(out)).toEqual(Array.from(sig));
  });

  it('spans multiple blocks (blockSize default 2048)', () => {
    const sig = Int32Array.from({ length: 7000 }, (_, i) => Math.round(1000 * Math.sin(i / 13)));
    const [out] = roundTrip([sig]);
    expect(out.length).toBe(sig.length);
    expect(Array.from(out)).toEqual(Array.from(sig));
  });
});

describe('encodeStroke ↔ decodeStroke round-trip (codec 4, word-interleaved)', () => {
  function roundTripWI(channels: Int32Array[]): Int32Array[] {
    const bytes = encodeStroke(channels, { wordInterleaved: true });
    return decodeStroke(bytes, 0, channels.length, { wordInterleaved: true }).channels;
  }

  it('stereo with distinct L/R channels', () => {
    const N = 6000;
    const L = Int32Array.from({ length: N }, (_, i) => Math.round(3000 * Math.sin(i / 7)));
    const R = Int32Array.from({ length: N }, (_, i) => Math.round(2500 * Math.cos(i / 11)));
    const [oL, oR] = roundTripWI([L, R]);
    expect(Array.from(oL)).toEqual(Array.from(L));
    expect(Array.from(oR)).toEqual(Array.from(R));
  });

  it('mono + full-range content across multiple blocks', () => {
    let seed = 999;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 65536) - 32768;
    const sig = Int32Array.from({ length: 5000 }, rnd);
    const [out] = roundTripWI([sig]);
    expect(Array.from(out)).toEqual(Array.from(sig));
  });
});

describe('encodeStroke ↔ decodeStroke round-trip (OG / legacy, 24-bit)', () => {
  function roundTripU24(channels: Int32Array[]): Int32Array[] {
    const bytes = encodeStroke(channels, { u24: true });
    return decodeStroke(bytes, 0, channels.length, { u24: true }).channels;
  }

  it('stereo sine — 24-bit framing round-trips exactly', () => {
    const N = 6000;
    const L = Int32Array.from({ length: N }, (_, i) => Math.round(3000 * Math.sin(i / 7)));
    const R = Int32Array.from({ length: N }, (_, i) => Math.round(2500 * Math.cos(i / 11)));
    const [oL, oR] = roundTripU24([L, R]);
    expect(Array.from(oL)).toEqual(Array.from(L));
    expect(Array.from(oR)).toEqual(Array.from(R));
  });

  it('silent passages do not collide with the stop sentinel', () => {
    // A near-silent block would be order-0/bitWidth-1 (== the stop word); the
    // encoder must promote it so the decoder reads the full stroke, not truncate.
    const sig = Int32Array.from({ length: 5000 }, (_, i) =>
      i < 2500 ? (i % 2 === 0 ? 0 : -1) : Math.round(1500 * Math.sin(i / 9)));
    const [out] = roundTripU24([sig]);
    expect(out.length).toBe(sig.length);
    expect(Array.from(out)).toEqual(Array.from(sig));
  });

  it('full-range content forces high bitWidth blocks', () => {
    let seed = 4242;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 65536) - 32768;
    const sig = Int32Array.from({ length: 4000 }, rnd);
    const [out] = roundTripU24([sig]);
    expect(Array.from(out)).toEqual(Array.from(sig));
  });
});

// Round-trip on real decoded audio (gitignored sample). Skipped in CI.
const realFile = join(process.cwd(), 'research/nsmp/Strings.nsmp3');
describe.skipIf(!existsSync(realFile))('encodeStroke round-trip on real Strings.nsmp3 audio', () => {
  it('re-encodes a decoded stroke and decodes back identically', () => {
    const bytes = new Uint8Array(readFileSync(realFile));
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBeGreaterThan(0);
    const original = strokes[0].channels;
    const reDecoded = roundTrip(original as Int32Array[]);
    expect(reDecoded.length).toBe(original.length);
    for (let c = 0; c < original.length; c++) {
      expect(reDecoded[c].length).toBe(original[c].length);
      expect(Array.from(reDecoded[c])).toEqual(Array.from(original[c]));
    }
  });
});
