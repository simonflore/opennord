import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { readNsmpZones } from './nsmp';

// Validation files are real sample audio kept out of the repo (docs/LEGAL.md), so
// these assertions skip when the files aren't present (e.g. CI) and run locally.
const root = resolve(__dirname, '../../..');
const og = resolve(root, 'nsmp conversion demo files/BrassAlesis 2.nsmp');
const sine = resolve(root, 'research/nsmp/ground-truth/sine_24.nsmp4');
const have = existsSync(og) && existsSync(sine);

describe('readNsmpZones root key (#18)', () => {
  it.skipIf(!have)('OG reads the per-zone root from the stroke header (in-zone, not octave 0)', () => {
    const zones = readNsmpZones(new Uint8Array(readFileSync(og)));
    expect(zones).toHaveLength(8);
    // The old bug read the OG map byte (~D#0/15, below the keyboard). The real root
    // lives in the stroke header: a playable key, descending with the zones (G5..C2).
    for (const z of zones) expect(z.rootKey).toBeGreaterThanOrEqual(36); // ≥ C2
    const roots = zones.map((z) => z.rootKey);
    for (let i = 1; i < roots.length; i++) expect(roots[i]).toBeLessThan(roots[i - 1]);
  });

  it.skipIf(!have)('codec-4 native root is unchanged (sine_24 → 57 / A3, matches its .nsmpproj)', () => {
    const zones = readNsmpZones(new Uint8Array(readFileSync(sine)));
    expect(zones[0].rootKey).toBe(57);
  });
});
