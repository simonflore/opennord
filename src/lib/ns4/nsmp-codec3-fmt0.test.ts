import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readNsmp, decodeNsmp, readNsmpZones, parseNsmpSections, nsmpLayout } from './nsmp';
import { hasGt } from './gt-fixtures';

/**
 * Codec-3 **format-0** `.nsmp3` (some Library-3.0 exports) — the CBIN format-type
 * byte is 0, so the `NSMP` container sits at **0x18** (no CRC-32 block) rather than
 * the format-1 `0x2c`. These previously decoded to **zero strokes** because
 * `nsmpLayout` only knew `NSMP`@0x2c; now `NSMP`@0x18 is handled. Their `map` is
 * **version 12** (an 11-byte stroke-reference record), distinct from the v14 form.
 *
 * Fixtures in `fixtures/` are git-ignored factory content (`docs/LEGAL.md`); the
 * suite skips when absent.
 */
const FILES = [
  'fixtures/12 String Guitar DV Mono 3.0.nsmp3',
  'fixtures/ARP Quadra Str 8 4 2 BR Mono 3.0.nsmp3',
  'fixtures/Cathedral Organ 3.0.nsmp3',
  'fixtures/Nord Sample 12 String Guitar 2 BR Mono 3.0.nsmp3',
];
const REPO_ROOT = resolve(__dirname, '../../..');
const BOUND = 1 << 26;

for (const rel of FILES) {
  describe.skipIf(!hasGt(rel))(`codec-3 format-0: ${rel.split('/').pop()}`, () => {
    const bytes = hasGt(rel) ? new Uint8Array(readFileSync(resolve(REPO_ROOT, rel))) : new Uint8Array();

    it('parses the format-0 envelope (NSMP container @0x18) as codec 3 with a name', () => {
      const lay = nsmpLayout(bytes);
      expect(lay.bodyStart).toBe(0x18); // format-0: no CRC block before the body
      expect(lay.headerSize).toBe(12); // NSMP 12-byte section headers
      expect(lay.legacy).toBe(false);
      const f = readNsmp(bytes);
      expect(f.codec).toBe(3);
      expect((f.name ?? '').length).toBeGreaterThan(0);
    });

    it('reads the v12 map into a valid, keyboard-tiling zone table', () => {
      const secs = parseNsmpSections(bytes);
      expect(secs.find((s) => s.tag.endsWith('map'))!.version).toBe(12);
      const gidSet = new Set(
        secs.filter((s) => s.tag.endsWith('stk')).map((s) => bytes[s.payloadOffset + 3]),
      );
      const zones = readNsmpZones(bytes);
      expect(zones.length).toBeGreaterThan(0);
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        expect(gidSet.has(z.globalID)).toBe(true);
        expect(z.keyHigh).toBeLessThanOrEqual(127);
        expect(z.keyLow).toBeLessThanOrEqual(z.keyHigh);
        if (i + 1 < zones.length) expect(z.keyLow).toBe(zones[i + 1].keyHigh + 1);
        else expect(z.keyLow).toBe(0);
      }
    });

    it('decodes audio to bounded PCM', () => {
      const strokes = decodeNsmp(bytes);
      expect(strokes.length).toBeGreaterThan(0);
      for (const s of strokes) {
        expect(s.channels[0].length).toBeGreaterThan(0);
        for (const ch of s.channels) for (const v of ch) expect(Math.abs(v)).toBeLessThan(BOUND);
      }
    }, 120_000);
  });
}
