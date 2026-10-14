import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { libraryName, soundId } from '../clavia/sound-id';
import { PIANO_NAMES, SAMPLE_NAMES } from './names.generated';
import { FACTORY_LIBS } from '../device/factory-libs.generated';
import { FACTORY_SOUNDS } from './factory-sounds.generated';
import { factorySoundById, findFactorySounds, pianoPanelType } from './factory-sounds';
import { decodeAllParams } from './coverage';
import { buildParamMap } from './maps';

const fixture = new Uint8Array(readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))));

describe('soundId', () => {
  it('names the regression fixture\'s two pianos', () => {
    const ids = decodeAllParams(fixture, buildParamMap())
      .filter((d) => d.baseName === 'piano model ID/name').map((d) => d.value);
    expect(ids).toEqual([soundId('Clavinet D6  6.1'), soundId('White Grand XL 6.3')]);
  });

  it('reads a factory file\'s library name the way the instrument hashes it', () => {
    expect(libraryName('Clavinet_D6__6.1.npno', 'piano')).toBe('Clavinet D6  6.1');
    expect(libraryName('Oboe Multi_ST 4.1.nsmp4', 'sample')).toBe('Oboe Multi_ST 4.1');
  });

  it('reproduces the ids the community tables already know', () => {
    const pianos = FACTORY_LIBS.filter((e) => e.type === 'piano').map((e) => soundId(libraryName(e.filename, 'piano')));
    const samples = FACTORY_LIBS.filter((e) => e.type === 'sample').map((e) => soundId(libraryName(e.filename, 'sample')));
    // Measured when the hash was found: 220 factory pianos and 85 samples land on a known id.
    expect(pianos.filter((id) => id in PIANO_NAMES).length).toBeGreaterThanOrEqual(220);
    expect(new Set(samples.filter((id) => id in SAMPLE_NAMES)).size).toBeGreaterThanOrEqual(85);
  });

  it('never returns 0, which a program reads as "none"', () => {
    expect(soundId('')).not.toBe(0);
  });
});

describe('FACTORY_SOUNDS', () => {
  it('is up to date with the factory catalog and its ids', () => {
    for (const s of FACTORY_SOUNDS) expect(s.id).toBe(soundId(s.library));
    const kept = new Set(FACTORY_LIBS
      .filter((e) => e.type === 'piano' || /\.nsmp[34]$/.test(e.filename))
      .map((e) => libraryName(e.filename, e.type)));
    expect(new Set(FACTORY_SOUNDS.map((s) => s.library))).toEqual(kept);
  });

  it('finds sounds by words of their name, and files pianos under their panel button', () => {
    const whiteXl = findFactorySounds('piano', 'white grand xl');
    expect(whiteXl.map((s) => s.library)).toContain('White Grand XL 6.3');
    expect(pianoPanelType(whiteXl[0])).toBe(0); // Grand
    expect(pianoPanelType(factorySoundById(soundId('Clavinet D6  6.1'))!)).toBe(3); // Clav, as in the fixture
    expect(findFactorySounds('sample', 'oboe').every((s) => s.kind === 'sample')).toBe(true);
  });
});
