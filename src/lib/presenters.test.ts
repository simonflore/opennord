import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { decodedProgramFor } from './presenters';
import { DecodedProgramView } from '../components/program/DecodedProgramView';
import type { FwLayout } from './clavia/block-chain';
import { synthFwBody, synthFwFile } from './clavia/block-chain.synth';
import { FILE_TAGS } from './clavia/file-tags';
import { np4Codec } from './np4/codec';
import { np5Codec } from './np5/codec';
import { ng2Codec } from './ng2/codec';
import { NP4_LAYOUT } from './np4/layout.generated';
import { NP5_LAYOUT } from './np5/layout.generated';
import { NG2_LAYOUT } from './ng2/layout.generated';
import { ngCodec } from './ng/codec';
import { np6Codec } from './np6/codec';
import { ne6Codec } from './ne6/codec';
import { ne7Codec } from './ne7/codec';
import { no3Codec } from './no3/codec';
import { nw2Codec } from './nw2/codec';
import { NG_LAYOUT } from './ng/layout.generated';
import { NP6_LAYOUT } from './np6/layout.generated';
import { NE6_LAYOUT } from './ne6/layout.generated';
import { NE7_LAYOUT } from './ne7/layout.generated';
import { NO3_LAYOUT } from './no3/layout.generated';
import { NW2_LAYOUT } from './nw2/layout.generated';

const FW_LAYOUTS: Record<string, FwLayout> = {
  ng: NG_LAYOUT, ng2: NG2_LAYOUT, np4: NP4_LAYOUT, np5: NP5_LAYOUT, np6: NP6_LAYOUT, ne6: NE6_LAYOUT, ne7: NE7_LAYOUT, no3: NO3_LAYOUT, nw2: NW2_LAYOUT,
};

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
  it.skipIf(!ne6)('Electro 6 → piano/synth/organ manual sections, drawbars per manual', () => {
    const d = decodedProgramFor(ne6!)!;
    expect(d.title).toContain('Electro 6');
    // Firmware layout (OS 2.66): the old "upper/lower" pair is manual A Preset I/II;
    // each organ manual now shows its sounding preset.
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO', 'SAMPLE SYNTH', 'ORGAN A', 'ORGAN B', 'EFFECTS']);
    const organA = d.sections.find((s) => s.id === 'OA')!;
    expect(organA.drawbars).toBeDefined();
    expect(organA.drawbars!.length).toBe(9); // 9 drawbars
  });

  const piano5 = firstFixture('piano-5', '.np5p');
  it.skipIf(!piano5)('Piano 5 → piano / synth layer sections and the global effects', () => {
    const d = decodedProgramFor(piano5!)!;
    expect(d.title).toContain('Piano 5');
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO A', 'PIANO B', 'SYNTH A', 'SYNTH B', 'EFFECTS']);
  });

  // Every firmware-layout program tag, and each Live tag that stores its record, must reach a presenter.
  const withLives = (tags: readonly string[]) => [...tags, ...FILE_TAGS.filter((t) => t.program && tags.includes(t.program)).map((t) => t.tag)];
  it.each([ngCodec, ng2Codec, np4Codec, np5Codec, np6Codec, ne6Codec, ne7Codec, no3Codec, nw2Codec].flatMap((c) => withLives(c.tags).map((tag) => [tag, c] as const)))(
    '%s (synthetic) → its presenter', (tag, codec) => {
      const layout = FW_LAYOUTS[codec.model];
      const d = decodedProgramFor(synthFwFile(tag, synthFwBody(layout), layout.versionRange?.[0] ?? 100));
      expect(d?.title).toContain(layout.model);
      expect(d?.sections.length).toBeGreaterThan(0);
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
