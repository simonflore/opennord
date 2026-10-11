import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { decodedProgramFor } from './presenters';
import { DecodedProgramView } from '../components/program/DecodedProgramView';
import { synthFwBody, synthFwFile } from './clavia/block-chain.synth';
import { NP4_LAYOUT } from './np4/layout.generated';
import { NP5_LAYOUT } from './np5/layout.generated';
import { NG2_LAYOUT } from './ng2/layout.generated';

/** Load the first fixture for a model dir, or null if the (gitignored) corpus is absent. */
function firstFixture(modelDir: string, ext: string): Uint8Array | null {
  const dir = join(process.cwd(), 'fixtures', modelDir);
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).find((n) => n.endsWith(ext));
  return f ? new Uint8Array(readFileSync(join(dir, f))) : null;
}

describe('decodedProgramFor — lite piano/organ models', () => {
  const grand2 = firstFixture('grand-2', '.ng2p');
  it.skipIf(!grand2)('Grand 2 → piano / synth layer sections and the reverb', () => {
    const d = decodedProgramFor(grand2!)!;
    expect(d).not.toBeNull();
    expect(d.title).toContain('Grand 2');
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO A', 'PIANO B', 'SYNTH A', 'SYNTH B', 'REVERB']);
    // Piano A always carries a piano name or type as its first engine part.
    expect(d.sections[0].engines[0].parts[0]).toBeTruthy();
    expect(d.header.some(([k]) => k === 'Piano A sound id')).toBe(true);
  });

  const ne6 = firstFixture('electro-6', '.ne6p');
  it.skipIf(!ne6)('Electro 6 → organ drawbar sections with B3 footage', () => {
    const d = decodedProgramFor(ne6!)!;
    expect(d.title).toContain('Electro 6');
    expect(d.sections.map((s) => s.label)).toEqual(['ORGAN UPPER', 'ORGAN LOWER']);
    expect(d.sections[0].drawbars).toBeDefined();
    expect(d.sections[0].drawbars!.length).toBe(9); // 9 Hammond drawbars
  });

  const piano5 = firstFixture('piano-5', '.np5p');
  it.skipIf(!piano5)('Piano 5 → piano / synth layer sections and the global effects', () => {
    const d = decodedProgramFor(piano5!)!;
    expect(d.title).toContain('Piano 5');
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO A', 'PIANO B', 'SYNTH A', 'SYNTH B', 'EFFECTS']);
  });

  // Render path: the shared DecodedProgramView must render the lite output without throwing.
  it.skipIf(!grand2)('Grand 2 renders through DecodedProgramView', () => {
    const html = renderToStaticMarkup(createElement(DecodedProgramView, { program: decodedProgramFor(grand2!)! }));
    expect(html).toContain('PIANO A');
    expect(html).toContain('Piano'); // engine label
    expect(html).toContain('sound id'); // header fingerprint row present
  });
});

describe('decodedProgramFor — piano names resolve from the 32-bit NameHash', () => {
  // The hash is the PIANO_NAMES key; variation is a separate field, so a non-zero
  // variation (which the old 34-bit np4 read folded into the id) still resolves.
  it('Piano 4', () => {
    const d = decodedProgramFor(synthFwFile('np4p', synthFwBody(NP4_LAYOUT, {
      'piano.enable': 1, 'piano.bank': 2, 'piano.variation': 1, 'piano.nameHash': 3490565097,
    })))!;
    expect(d.sections[0].engines[0].parts[0]).toBe('EP6 Sparkletop XL');
  });

  it('Piano 5 (both layers)', () => {
    const d = decodedProgramFor(synthFwFile('np5p', synthFwBody(NP5_LAYOUT, {
      'pianoA.variation': 2, 'pianoA.nameHash': 550238836, 'pianoB.nameHash': 1209279823,
    }, 101), 101))!;
    expect(d.sections.slice(0, 2).map((s) => s.engines[0].parts[0])).toEqual(['Clavinet D6 6.1', 'White Grand XL']);
  });

  it('Grand 2 (both layers)', () => {
    const d = decodedProgramFor(synthFwFile('ng2p', synthFwBody(NG2_LAYOUT, {
      'pianoA.nameHash': 1770716052, 'pianoB.variation': 3, 'pianoB.nameHash': 1145892321,
    }, 102), 102))!;
    expect(d.sections.slice(0, 2).map((s) => s.engines[0].parts[0])).toEqual(['Soft Grand Lrg', 'EP1 Deep Timbre Lrg']);
  });
});
