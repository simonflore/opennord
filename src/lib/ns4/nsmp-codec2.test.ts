import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readNsmp, decodeNsmp, parseNsmpSections, readNsmpZones } from './nsmp';
import { hasGt } from './gt-fixtures';

/**
 * Codec-2 / NSMP-2 **revision B** (Nord Sample Library 2.0) read support — the
 * `NWS` v11 / CBIN-version-200 `.nsmp` files, `map` version 10. Fixtures live in
 * `fixtures/` and are git-ignored factory content (`docs/LEGAL.md`), so this suite
 * skips when absent. Pins what we now read for this generation:
 *
 *  - identified as `codec === 2`, `legacy`, with a real sample name (rev B adds a
 *    `hdr` name + `cat` section, unlike rev A / v8);
 *  - **zones** (the `map` v10 15-byte table): every record's global id matches a
 *    real `stk` header, the zones tile the keyboard top-down with no gaps/overlaps,
 *    and root keys are musical (`parseCodec2ZoneRecords`, see docs/NSMP-CODEC.md);
 *  - audio decodes to bounded PCM.
 */

const FILES = [
  'fixtures/12 String Guitar Sample.nsmp',
  'fixtures/ARP Quadra Str 8 4 2 BR Mono 2.0.nsmp',
  'fixtures/Cathedral Organ 3 SR 2.0.nsmp',
  'fixtures/Nord Sample Library BassGit 2.0.nsmp',
  'fixtures/Vibes DV Mono 2.0.nsmp',
];
const REPO_ROOT = resolve(__dirname, '../../..');
const BOUND = 1 << 26;

for (const rel of FILES) {
  describe.skipIf(!hasGt(rel))(`codec-2 (Library 2.0): ${rel.split('/').pop()}`, () => {
    const bytes = hasGt(rel) ? new Uint8Array(readFileSync(resolve(REPO_ROOT, rel))) : new Uint8Array();

    it('identifies as codec 2, legacy, named — no "unverified" warning', () => {
      const f = readNsmp(bytes);
      expect(f.recognized).toBe(true);
      expect(f.codec).toBe(2);
      expect(f.legacy).toBe(true);
      expect(f.versionRaw).toBe(200);
      expect((f.name ?? '').length).toBeGreaterThan(0); // rev B carries a name
      expect(f.warnings.some((w) => /unverified/i.test(w))).toBe(false);
    });

    it('decodes the v10 map into a valid, keyboard-tiling zone table', () => {
      const secs = parseNsmpSections(bytes);
      const map = secs.find((s) => s.tag.endsWith('map'))!;
      expect(map.version).toBe(10);
      const gidSet = new Set(
        secs.filter((s) => s.tag.endsWith('stk')).map((s) => bytes[s.payloadOffset + 3]),
      );
      const zones = readNsmpZones(bytes);
      expect(zones.length).toBeGreaterThan(0);
      // Sorted top-down by the parser. Validate each + the tiling between them.
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        expect(gidSet.has(z.globalID)).toBe(true); // references a real stroke
        expect(z.keyHigh).toBeLessThanOrEqual(127);
        expect(z.keyLow).toBeLessThanOrEqual(z.keyHigh); // well-formed span
        expect(z.rootKey).toBeGreaterThanOrEqual(0);
        expect(z.rootKey).toBeLessThanOrEqual(127);
        if (i + 1 < zones.length) {
          // Contiguous tiling, strictly descending — no gaps, no overlaps.
          expect(z.keyLow).toBe(zones[i + 1].keyHigh + 1);
        } else {
          expect(z.keyLow).toBe(0); // bottom zone reaches the lowest key
        }
      }
    });

    it('decodes audio to bounded PCM', () => {
      const strokes = decodeNsmp(bytes);
      expect(strokes.length).toBeGreaterThan(0);
      for (const s of strokes) {
        expect([1, 2]).toContain(s.channels.length);
        expect(s.channels[0].length).toBeGreaterThan(0);
        for (const ch of s.channels) for (const v of ch) expect(Math.abs(v)).toBeLessThan(BOUND);
      }
    }, 120_000);
  });
}

// Regression guard for the per-zone-value truncation bug: Spitfire-era codec-2
// libraries carry a value at record +1..+3 (not the `0x10` unity), which the old
// marker mistook for the run end — Pizzicato decoded only 8 of 37 zones, orphaning
// 29 strokes in the rompler. All zones must now decode (whole-line: same fix serves
// the Wave / Electro-3 / Stage-2 versions of this content).
const SPITFIRE_C2 = 'fixtures/Spitfire String Quintet Nord Stage 2/SpitfireStrQPizz 2.2.nsmp';
describe.skipIf(!hasGt(SPITFIRE_C2))('codec-2: Spitfire per-zone-value records decode fully', () => {
  const bytes = new Uint8Array(readFileSync(resolve(REPO_ROOT, SPITFIRE_C2)));
  it('decodes a zone for (nearly) every stroke, not a truncated 8-record run', () => {
    const strokes = new Set(
      parseNsmpSections(bytes).filter((s) => s.tag.endsWith('stk')).map((s) => bytes[s.payloadOffset + 3]),
    );
    const zones = readNsmpZones(bytes);
    expect(zones.length).toBeGreaterThanOrEqual(strokes.size - 1); // was 8 of 37 before the fix
  });
});
