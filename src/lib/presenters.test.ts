import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { decodedProgramFor } from './presenters';
import { DecodedProgramView } from '../components/program/DecodedProgramView';

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
  it.skipIf(!ne6)('Electro 6 → organ drawbar sections with B3 footage', () => {
    const d = decodedProgramFor(ne6!)!;
    expect(d.title).toContain('Electro 6');
    expect(d.sections.map((s) => s.label)).toEqual(['ORGAN UPPER', 'ORGAN LOWER']);
    expect(d.sections[0].drawbars).toBeDefined();
    expect(d.sections[0].drawbars!.length).toBe(9); // 9 Hammond drawbars
  });

  const piano5 = firstFixture('piano-5', '.np5p');
  it.skipIf(!piano5)('Piano 5 → per-layer piano core', () => {
    const d = decodedProgramFor(piano5!)!;
    expect(d.title).toContain('Piano 5');
    expect(d.sections.length).toBe(2);
  });

  // Render path: the shared DecodedProgramView must render the lite output without throwing.
  it.skipIf(!grand2)('Grand 2 renders through DecodedProgramView', () => {
    const html = renderToStaticMarkup(createElement(DecodedProgramView, { program: decodedProgramFor(grand2!)! }));
    expect(html).toContain('LAYER A');
    expect(html).toContain('Piano'); // engine label
    expect(html).toContain('sound id'); // header fingerprint row present
  });
});
