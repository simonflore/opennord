import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readTruVibrato } from './nsmp';
import { hasGt } from './gt-fixtures';

/**
 * Tru-Vibrato lives in the codec-4.2 `.sty` (style) section — a flag + 9-byte
 * block in the trailing 13 bytes of a 108-byte `.sty`. Reverse-engineered by
 * diffing the Spitfire String Quintet across nsmp3/nsmp4 (the block is nsmp4-only)
 * and validated by articulation: bowed = on, pizzicato/spiccato = off. The older
 * 4.1 layout (92-byte `.sty`) has no vibrato block → null. Fixtures are git-ignored.
 */
const REPO = resolve(__dirname, '../../..');
const load = (rel: string) => new Uint8Array(readFileSync(resolve(REPO, rel)));
const D = 'fixtures/Spitfire String Quintet Nord Stage 4';

const BOWED = [
  `${D}/Spitfire StrQuintet Trem 4.2.nsmp4`,
  `${D}/Spitfire StringQuintet Soft 4.2.nsmp4`,
  `${D}/Spitfire StringQuintet Stac 4.2.nsmp4`,
];
const NO_VIBRATO = [
  `${D}/Spitfire StrQuintPizzicato 4.2.nsmp4`,
  `${D}/String Quintet Spiccato 4.2.nsmp4`,
];

describe.skipIf(!hasGt(BOWED[0]))('Tru-Vibrato (.sty codec-4.2)', () => {
  it('reports ON for bowed articulations, with a 9-byte param block', () => {
    for (const f of BOWED) {
      const tv = readTruVibrato(load(f));
      expect(tv?.on, f).toBe(true);
      expect(tv?.params.length).toBe(9);
    }
  });

  it('reports OFF for pizzicato / spiccato (no vibrato)', () => {
    for (const f of NO_VIBRATO) {
      expect(readTruVibrato(load(f))?.on, f).toBe(false);
    }
  });

  it('returns null for the older 4.1 layout (no vibrato block)', () => {
    const rel = 'fixtures/Cathedral Organ 4.1.nsmp4';
    if (hasGt(rel)) expect(readTruVibrato(load(rel))).toBeNull();
  });
});

describe('readTruVibrato — guards', () => {
  it('returns null for non-codec-4 / no .sty bytes', () => {
    expect(readTruVibrato(new Uint8Array(64))).toBeNull();
  });
});
