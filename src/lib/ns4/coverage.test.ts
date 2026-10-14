import { describe, expect, it } from 'vitest';
import { buildParamMap } from './maps';
import { paramNamesByByte, paramsCoveringByte } from './coverage';

describe('paramNamesByByte', () => {
  it('names each byte exactly as paramsCoveringByte does, in one pass', () => {
    const map = buildParamMap();
    const byteLen = 1200; // past the end of a Stage 4 program
    const byByte = paramNamesByByte(map, byteLen);
    expect(byByte).toHaveLength(byteLen);
    for (let i = 0; i < byteLen; i++) {
      expect(byByte[i]).toEqual(paramsCoveringByte(map, i).map((p) => p.name));
    }
  });
});
