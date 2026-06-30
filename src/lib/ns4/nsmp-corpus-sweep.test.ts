import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { readNsmp, readNsmpZones, parseNsmpSections } from './nsmp';

/**
 * Whole-corpus **read/zone** health sweep — every `.nsmp/.nsmp3/.nsmp4` under
 * `fixtures/` (git-ignored; suite skips when the folder is absent/empty). This is
 * the "full pass": rather than per-file suites, it asserts the read invariants hold
 * for **all** samples at once, so a new codec/map/envelope variant the reader
 * mishandles trips here immediately. Every parse bug found this session (codec-2
 * v11, format-0 `.nsmp3`, v12 gid, codec-4 variable header, "Undefined" version)
 * was a read/zone issue — exactly what this guards.
 *
 * Audio *decode* is deliberately NOT exercised here (decoding all multi-MB files
 * takes minutes); the per-codec suites validate decode on representatives.
 *
 * Per file: recognized, no "unverified" warning, and (when it exposes zones) the
 * zones reference real strokes, are well-formed, and aren't the all-same-root
 * failure. Duplicate global ids are allowed — codec-4 legitimately reuses one
 * stroke across several zones (e.g. an organ pitched into multiple octaves).
 */

const FIX = resolve(__dirname, '../../..', 'fixtures');
function listSamples(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) out = out.concat(listSamples(p));
    else if (/\.nsmp[34]?$/i.test(e)) out.push(p);
  }
  return out;
}
const FILES = listSamples(FIX);

describe.skipIf(FILES.length === 0)('corpus sweep — all fixtures read cleanly', () => {
  for (const path of FILES) {
    const name = path.replace(FIX + '/', '');
    it(`reads ${name}`, () => {
      const b = new Uint8Array(readFileSync(path));
      const id = readNsmp(b);
      expect(id.recognized).toBe(true);
      expect(id.warnings.some((w) => /unverified/i.test(w))).toBe(false); // every variant is mapped

      const secs = parseNsmpSections(b);
      const gidSet = new Set(
        secs.filter((s) => s.tag.endsWith('stk')).map((s) => b[s.payloadOffset + 3]),
      );
      const strokes = secs.filter((s) => s.tag.endsWith('stk')).length;

      const z = readNsmpZones(b);
      if (strokes > 1) expect(z.length).toBeGreaterThan(0); // no silent zone loss
      if (z.length > 1) {
        const roots = z.map((x) => x.rootKey);
        expect(roots.every((r) => r === roots[0])).toBe(false); // not the all-same-root bug
        for (const x of z) {
          expect(gidSet.has(x.globalID)).toBe(true); // references a real stroke
          expect(x.keyLow).toBeLessThanOrEqual(x.keyHigh);
          expect(x.keyHigh).toBeLessThanOrEqual(127);
          expect(x.rootKey).toBeLessThanOrEqual(127);
        }
      }
    });
  }
});
