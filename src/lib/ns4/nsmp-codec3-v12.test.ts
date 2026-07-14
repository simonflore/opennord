import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readNsmp, readNsmpZones, parseNsmpSections } from './nsmp';
import { hasGt } from './gt-fixtures';

/**
 * Regression: codec-3 `map` **version 12** zone records — the layout is
 * `00 01 [keyLow] [keyHigh] 00 00 01 00 00 00 [gid]` (gid @+10, keyHigh @+3). An
 * earlier RE used gid @+4 / keyHigh @+8, which *coincidentally* validated on a few
 * format-0 files (gid read off-by-one) but on format-1 files latched onto a false
 * all-zeros run → every zone came out with the **same root**, from 1, split 0.
 *
 * These v12 files appear in both envelope forms (format-0 `NSMP`@0x18 and format-1
 * `NSMP`@0x2c with CRC). Fixtures incl. the Elijah Fox bundle under `fixtures/` are
 * git-ignored; the suite skips when absent.
 */
const FILES = [
  // format-1 v12 (the reported failures)
  'fixtures/wave-2/Elijah Fox Signature Sound Bank Bundle/Samp Lib/Guitar_Plucked/E Guitar S 62_ST Stereo 3.0.nsmp3',
  'fixtures/wave-2/Elijah Fox Signature Sound Bank Bundle/Samp Lib/Guitar_Plucked/E Guitar LP 55_ST Stereo 3.0.nsmp3',
  'fixtures/wave-2/Elijah Fox Signature Sound Bank Bundle/Samp Lib/Strings Solo/Pizzicato 2_SR 3.0.nsmp3',
  'fixtures/wave-2/Elijah Fox Signature Sound Bank Bundle/Samp Lib/Piano/RainPiano_CL stereo 3.1.nsmp3',
];
const REPO_ROOT = resolve(__dirname, '../../..');

for (const rel of FILES) {
  describe.skipIf(!hasGt(rel))(`codec-3 v12: ${rel.split('/').pop()}`, () => {
    const bytes = hasGt(rel) ? new Uint8Array(readFileSync(resolve(REPO_ROOT, rel))) : new Uint8Array();

    it('reads distinct, well-formed zones — not the all-same-root failure', () => {
      const f = readNsmp(bytes);
      expect(f.codec).toBe(3);
      const secs = parseNsmpSections(bytes);
      expect(secs.find((s) => s.tag.endsWith('map'))!.version).toBe(12);
      const gidSet = new Set(
        secs.filter((s) => s.tag.endsWith('stk')).map((s) => bytes[s.payloadOffset + 3]),
      );

      const zones = readNsmpZones(bytes);
      expect(zones.length).toBeGreaterThan(1);

      // The bug signature: every zone identical (same root). Guard against it.
      const roots = zones.map((z) => z.rootKey);
      expect(roots.every((r) => r === roots[0])).toBe(false);

      // Each zone references a real, distinct stroke (gid was read off-by-one before).
      expect(new Set(zones.map((z) => z.globalID)).size).toBe(zones.length);
      for (const z of zones) {
        expect(gidSet.has(z.globalID)).toBe(true);
        expect(z.keyLow).toBeLessThanOrEqual(z.keyHigh);
        expect(z.keyHigh).toBeLessThanOrEqual(127);
      }
      // Contiguous tiling (keyLow derived top-down).
      for (let i = 0; i + 1 < zones.length; i++) {
        expect(zones[i].keyLow).toBe(zones[i + 1].keyHigh + 1);
      }
    });
  });
}
