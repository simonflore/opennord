/**
 * Routing for the firmware-layout readers (Grand `ngp`, Grand 2 `ng2p`,
 * Piano 4 `np4p`, Piano 5 `np5p`, Piano 6 `np6p`, Electro 7 `ne7p`, Organ 3
 * `no3p`): identify → codec → presenter → view.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { parseClaviaFile } from './formats';
import { decodedProgramFor } from './presenters';
import { identifyNordFile } from './clavia/nord-file';
import { fileTypeTag } from './clavia/cbin';
import { synthFwBody, synthFwFile } from './clavia/block-chain.synth';
import type { FwLayout } from './clavia/block-chain';
import { NG_LAYOUT } from './ng/layout.generated';
import { NG2_LAYOUT } from './ng2/layout.generated';
import { NP4_LAYOUT } from './np4/layout.generated';
import { NP5_LAYOUT } from './np5/layout.generated';
import { NP6_LAYOUT } from './np6/layout.generated';
import { NE7_LAYOUT } from './ne7/layout.generated';
import { NO3_LAYOUT } from './no3/layout.generated';
import { DecodedProgramView } from '../components/program/DecodedProgramView';
import { decodeForModel, getModelProgress } from './contribute/coverage';

const CASES: { tag: string; live: string; layout: FwLayout; model: string; registry: string; title: string; version: number }[] = [
  { tag: 'ngp', live: 'ngl', layout: NG_LAYOUT, model: 'ng', registry: 'grand', title: 'Nord Grand · Program', version: 100 },
  { tag: 'ng2p', live: 'ng2l', layout: NG2_LAYOUT, model: 'ng2', registry: 'grand-2', title: 'Nord Grand 2 · Program', version: 102 },
  { tag: 'np4p', live: 'np4l', layout: NP4_LAYOUT, model: 'np4', registry: 'piano-4', title: 'Nord Piano 4 · Program', version: 100 },
  { tag: 'np5p', live: 'np5l', layout: NP5_LAYOUT, model: 'np5', registry: 'piano-5', title: 'Nord Piano 5 · Program', version: 101 },
  { tag: 'np6p', live: 'np6l', layout: NP6_LAYOUT, model: 'np6', registry: 'piano-6', title: 'Nord Piano 6 · Program', version: 102 },
  { tag: 'ne7p', live: 'ne7l', layout: NE7_LAYOUT, model: 'ne7', registry: 'electro-7', title: 'Nord Electro 7 · Program', version: 100 },
  { tag: 'no3p', live: 'no3l', layout: NO3_LAYOUT, model: 'no3', registry: 'organ-3', title: 'Nord Organ 3 · Program', version: 200 },
];

describe('firmware-layout readers — identify, codec and presenter routing', () => {
  for (const c of CASES) {
    const bytes = synthFwFile(c.tag, synthFwBody(c.layout, {}, c.version), c.version);

    it(`${c.tag} → registry model ${c.registry}, codec ${c.model}`, () => {
      expect(identifyNordFile(bytes).modelId).toBe(c.registry);
      const file = parseClaviaFile(bytes);
      expect(file.model).toBe(c.model);
      expect(file.program.parsed).toBe(true);
      expect('format' in file.program && file.program.format).toBe(c.tag);
    });

    it(`${c.live} (Live) routes to the same codec`, () => {
      expect(parseClaviaFile(synthFwFile(c.live, synthFwBody(c.layout, {}, c.version), c.version)).model).toBe(c.model);
    });

    it(`${c.tag} → presenter renders through DecodedProgramView`, () => {
      const d = decodedProgramFor(bytes);
      expect(d?.title).toBe(c.title);
      expect(d?.sections.length).toBeGreaterThan(0);
      const html = renderToStaticMarkup(createElement(DecodedProgramView, { program: d! }));
      expect(html).toContain(c.title);
    });

    it(`${c.tag} with a broken body still routes, header-only with a warning`, () => {
      const broken = bytes.slice(0, bytes.length - 3);
      const file = parseClaviaFile(broken);
      expect(file.model).toBe(c.model);
      expect(file.program.warnings.length).toBeGreaterThan(0);
      expect(decodedProgramFor(broken)?.sections).toEqual([]);
    });

    it(`${c.registry} coverage is 'partial' with a byte map of the firmware body size`, () => {
      expect(decodeForModel(c.registry).status).toBe('partial');
      const p = getModelProgress(c.registry)!;
      expect(p.bodyBytes).toBe(c.layout.bodyBytes);
      expect(p.regions!.at(-1)!.end).toBe(c.layout.bodyBytes - 1);
    });
  }

  it('the Grand’s three-letter tag reads the same with NUL or space padding', () => {
    const body = synthFwBody(NG_LAYOUT);
    const nul = synthFwFile('ngp', body);
    const space = nul.slice();
    space[11] = 0x20;
    expect(nul[11]).toBe(0);
    for (const b of [nul, space]) {
      expect(fileTypeTag(b)).toBe('ngp');
      expect(parseClaviaFile(b).model).toBe('ng');
      expect(identifyNordFile(b).modelName).toBe('Nord Grand');
    }
  });

  it('Electro 7 / Organ 3 byte maps are candidate-only; Grand / Grand 2 / Piano 4–6 are confirmed', () => {
    const statuses = (id: string) => new Set(getModelProgress(id)!.regions!.map((r) => r.status));
    expect(statuses('electro-7').has('confirmed')).toBe(false);
    expect(statuses('organ-3').has('candidate')).toBe(true);
    expect(statuses('grand').has('confirmed')).toBe(true);
    expect(statuses('piano-6').has('candidate')).toBe(false);
    for (const id of ['grand-2', 'piano-4', 'piano-5']) {
      expect(statuses(id).has('confirmed'), id).toBe(true);
      expect(statuses(id).has('candidate'), id).toBe(false);
    }
  });
});
