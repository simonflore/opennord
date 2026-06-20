import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodeNsmp } from './nsmp';

// Real sample audio is kept out of the repo (docs/LEGAL.md), so this skips when
// the file is absent (CI) and runs locally.
const takeOnMe = resolve(__dirname, '../../../research/nsmp/TAKE ON ME.nsmp');
const have = existsSync(takeOnMe);

describe('stroke loop region (#20)', () => {
  it.skipIf(!have)('decodes loop vs one-shot from the stroke header (OG, validated)', () => {
    const strokes = decodeNsmp(new Uint8Array(readFileSync(takeOnMe)));
    const loops = strokes.map((s) => s.loop?.loops);
    // Per docs/NSMP-CODEC.md, TAKE ON ME stk 1/2/3/8 are one-shot (loop-out == end),
    // the rest loop. Every stroke's region must be decodable (no nulls).
    expect(loops).toEqual([true, false, false, false, false, true, true, true, false]);
    for (const s of strokes) {
      expect(s.loop).not.toBeNull();
      expect(s.loop!.loopStart).toBeLessThanOrEqual(s.loop!.loopEnd); // monotonic window
    }
  });
});
