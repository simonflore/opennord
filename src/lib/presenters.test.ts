import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { decodedProgramFor } from './presenters';
import { DecodedProgramView } from '../components/program/DecodedProgramView';
import type { FwLayout } from './clavia/block-chain';
import { synthFwBody, synthFwFile } from './clavia/block-chain.synth';
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
  ng: NG_LAYOUT, np6: NP6_LAYOUT, ne6: NE6_LAYOUT, ne7: NE7_LAYOUT, no3: NO3_LAYOUT, nw2: NW2_LAYOUT,
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
  it.skipIf(!grand2)('Grand 2 → per-layer piano core sections', () => {
    const d = decodedProgramFor(grand2!)!;
    expect(d).not.toBeNull();
    expect(d.title).toContain('Grand 2');
    expect(d.sections.map((s) => s.label)).toEqual(['LAYER A', 'LAYER B']);
    // Layer A always carries a piano type label as its first engine part.
    expect(d.sections[0].engines[0].parts[0]).toBeTruthy();
    expect(d.header.some(([k]) => k === 'Layer A sound id')).toBe(true);
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
  it.skipIf(!piano5)('Piano 5 → per-layer piano core', () => {
    const d = decodedProgramFor(piano5!)!;
    expect(d.title).toContain('Piano 5');
    expect(d.sections.length).toBe(2);
  });

  // Every tag a firmware-layout codec claims (Program and Live) must reach a presenter.
  it.each([ngCodec, np6Codec, ne6Codec, ne7Codec, no3Codec, nw2Codec].flatMap((c) => c.tags.map((tag) => [tag, c] as const)))(
    '%s (synthetic) → its presenter', (tag, codec) => {
      const layout = FW_LAYOUTS[codec.model];
      const d = decodedProgramFor(synthFwFile(tag, synthFwBody(layout), layout.versionRange?.[0] ?? 100));
      expect(d?.title).toContain(layout.model);
      expect(d?.sections.length).toBeGreaterThan(0);
    });

  // Render path: the shared DecodedProgramView must render the lite output without throwing.
  it.skipIf(!grand2)('Grand 2 renders through DecodedProgramView', () => {
    const html = renderToStaticMarkup(createElement(DecodedProgramView, { program: decodedProgramFor(grand2!)! }));
    expect(html).toContain('LAYER A');
    expect(html).toContain('Piano'); // engine label
    expect(html).toContain('sound id'); // header fingerprint row present
  });
});
