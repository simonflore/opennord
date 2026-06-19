import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { convertNsmp } from './nsmp-convert';
import { readNsmp, decodeNsmp, readNsmpZones, nsmpLayout } from './nsmp';

const root = resolve(__dirname, '../../..');
const load = (p: string) => new Uint8Array(readFileSync(resolve(root, p)));

const sameChannels = (a: Int32Array[], b: Int32Array[]) => {
  if (a.length !== b.length) return false;
  for (let ch = 0; ch < a.length; ch++) {
    if (a[ch].length !== b[ch].length) return false;
    for (let i = 0; i < a[ch].length; i++) if (a[ch][i] !== b[ch][i]) return false;
  }
  return true;
};

describe('convertNsmp(x, 2) — downconvert any Nord sample to OG (.nsmp)', () => {
  const sources = [
    'nsmp conversion demo files/BrassAlesis 4 from 2.nsmp4',
    'nsmp conversion demo files/BrassAlesis 3 from 2.nsmp3',
    'nsmp conversion demo files/BrassAlesis 2.nsmp',
  ];

  for (const src of sources) {
    it(`lossless + valid OG from ${src.split('/').pop()}`, () => {
      const bytes = load(src);
      const before = decodeNsmp(bytes);
      const { bytes: og, extension, warnings } = convertNsmp(bytes, 2);

      expect(extension).toBe('.nsmp');
      expect(warnings.some((w) => /experimental/i.test(w))).toBe(true);

      // Structurally a valid OG file.
      const meta = readNsmp(og);
      expect(meta.recognized).toBe(true);
      expect(nsmpLayout(og).legacy).toBe(true);
      expect(meta.strokeCount).toBe(before.length);

      // Audio is preserved exactly across the conversion.
      const after = decodeNsmp(og);
      expect(after.length).toBe(before.length);
      for (let i = 0; i < before.length; i++) {
        expect(sameChannels(after[i].channels, before[i].channels), `stroke ${i} audio`).toBe(true);
      }

      // Zones (splits) carried over.
      const zones = readNsmpZones(og);
      expect(zones.length).toBe(before.length);
    });
  }
});
