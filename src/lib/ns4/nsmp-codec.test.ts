import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBlockHeader, decodeStroke } from './nsmp-codec';

describe('readBlockHeader', () => {
  it('splits the packed fields (sampleCnt[0:13], order[14:17], bitWidth[19:22]+1)', () => {
    // sampleCnt=4, filterOrder=1, bitWidth=8  →  (8-1)<<19 | 1<<14 | 4
    const h = readBlockHeader(0x384004);
    expect(h).toEqual({ sampleCnt: 4, filterOrder: 1, bitWidth: 8, isStop: false });
  });

  it('recognizes the stop sentinel (order 0, bitWidth 1)', () => {
    expect(readBlockHeader(0).isStop).toBe(true);
  });
});

describe('decodeStroke — synthetic block (CI, no real audio)', () => {
  it('reconstructs an order-1 block: out[i] = residual[i] + out[i-1]', () => {
    // header(0x00384004) + 4×8-bit residuals [10,5,-3,2] (0x0A05FD02) + stop(0)
    const bytes = new Uint8Array([0x00, 0x38, 0x40, 0x04, 0x0a, 0x05, 0xfd, 0x02, 0x00, 0x00, 0x00, 0x00]);
    const { channels, endOffset } = decodeStroke(bytes, 0, 1);
    // residuals run through the order-1 predictor (running sum): 10,15,12,14
    expect(Array.from(channels[0])).toEqual([10, 15, 12, 14]);
    expect(endOffset).toBe(12); // past the stop word
  });
});

// Real-data validation against the user's own sample (gitignored). Skipped in CI.
const realFile = join(process.cwd(), 'research/nsmp/Strings.nsmp3');
describe.skipIf(!existsSync(realFile))('decodeStroke — real Strings.nsmp3 first stroke', () => {
  it('decodes a clean stereo waveform (silent onset, sane levels, stop sentinel)', () => {
    const bytes = new Uint8Array(readFileSync(realFile));
    // First stroke block stream begins at 0x51c (after the NSMP/hdr/cat/map
    // sections); stereo, 32-bit words. Validated 2026-06-13 (docs/NSMP-CODEC.md).
    const { channels, endOffset } = decodeStroke(bytes, 0x51c, 2);
    const [L, R] = channels;
    expect(L.length).toBe(68146);
    expect(R.length).toBe(68146);
    expect(endOffset).toBe(0x204b0); // stop sentinel
    // Clean audio onset: silence, then a gentle ramp-in.
    expect(Array.from(L.slice(0, 8))).toEqual([0, 0, 0, 0, -1, -2, -3, -4]);
    // Sane 16-bit levels (not noise, not divergence).
    const peak = L.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    expect(peak).toBe(6114);
  });
});
