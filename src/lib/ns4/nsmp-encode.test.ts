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
