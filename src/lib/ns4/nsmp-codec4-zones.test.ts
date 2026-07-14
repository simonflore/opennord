import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readNsmp, decodeNsmp, readNsmpZones, parseNsmpSections } from './nsmp';
import { hasGt } from './gt-fixtures';

/**
 * Codec-4 (`.nsmp4`) zone-table robustness. The v21 `map` has a **variable-size**
 * zone-table header (`SampleUnison` block): 32 B on most instruments but smaller on
 * others (26 B on Cathedral Organ), and per-note rows aren't always unity. The
 * fixed-offset / unity-skip paths returned **0 zones** for such files; the reader
 * now locates the record table as the maximal run of valid 16-byte records keyed by
 * the stroke global-id set. Fixtures are git-ignored factory content.
 *
 * Note: codec-4 records store an *explicit* keyLow and support velocity layers, so
 * zones don't necessarily tile contiguously (unlike the v10/v12 stroke-ref maps) —
 * we validate well-formedness + valid stroke refs, not gap-free tiling.
 */
const FILES = [
  'fixtures/ARP Quadra Str 8 BR 4.1.nsmp4',
  'fixtures/Cathedral Organ 4.1.nsmp4',
  'fixtures/Nord Acoustic Guitar 12 Str 4.1.nsmp4',
];
const REPO_ROOT = resolve(__dirname, '../../..');
const BOUND = 1 << 26;

for (const rel of FILES) {
  describe.skipIf(!hasGt(rel))(`codec-4 zones: ${rel.split('/').pop()}`, () => {
    const bytes = hasGt(rel) ? new Uint8Array(readFileSync(resolve(REPO_ROOT, rel))) : new Uint8Array();

    it('identifies as codec 4 with a valid checksum + name', () => {
      const f = readNsmp(bytes);
      expect(f.codec).toBe(4);
      expect(f.checksumValid).toBe(true);
      expect((f.name ?? '').length).toBeGreaterThan(0);
    });

    it('reads a non-empty zone table whose records reference real strokes', () => {
      const secs = parseNsmpSections(bytes);
      expect(secs.find((s) => s.tag.endsWith('map'))!.version).toBeGreaterThanOrEqual(21);
      const gidSet = new Set(
        secs.filter((s) => s.tag.endsWith('stk')).map((s) => bytes[s.payloadOffset + 3]),
      );
      const zones = readNsmpZones(bytes);
      expect(zones.length).toBeGreaterThan(0); // Cathedral Organ used to return 0
      for (const z of zones) {
        expect(gidSet.has(z.globalID)).toBe(true);
        expect(z.keyHigh).toBeLessThanOrEqual(127);
        expect(z.keyLow).toBeLessThanOrEqual(z.keyHigh); // well-formed span (explicit keyLow)
      }
    });

    it('decodes audio to bounded PCM', () => {
      const strokes = decodeNsmp(bytes);
      expect(strokes.length).toBeGreaterThan(0);
      for (const s of strokes) {
        expect(s.channels[0].length).toBeGreaterThan(0);
        for (const ch of s.channels) for (const v of ch) expect(Math.abs(v)).toBeLessThan(BOUND);
      }
    }, 180_000);
  });
}
