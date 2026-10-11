/**
 * Routing for the legacy-record readers built on the firmware descriptor
 * layouts (clavia/legacy-record.ts): identify → codec → presenter → view, and
 * the coverage byte map. None of these models registers a Live partition with a
 * known tag, so only program tags route.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { parseClaviaFile } from './formats';
import { decodedProgramFor } from './presenters';
import { identifyNordFile } from './clavia/nord-file';
import { synthLegacyLayoutFile } from './clavia/block-chain.synth';
import type { LegacyLayout } from './clavia/legacy-record';
import { NE3_LAYOUT } from './ne3/layout.generated';
import { NE3HP_LAYOUT } from './ne3/layout-hp.generated';
import { NC2_LAYOUT } from './nc2/layout.generated';
import { NW1_LAYOUT } from './nw1/layout.generated';
import { DecodedProgramView } from '../components/program/DecodedProgramView';
import { decodeForModel, getModelProgress } from './contribute/coverage';

interface Case {
  tag: string; layout: LegacyLayout; model: string; registry: string; coverage: string[]; title: string; fileBytes: number;
}

const CASES: Case[] = [
  {
    tag: 'nepg', layout: NE3HP_LAYOUT, model: 'ne3', registry: 'electro-3', coverage: ['electro-3', 'electro-3-hp'],
    title: 'Nord Electro 3 · Program', fileBytes: 136,
  },
  // nc2p is shared with the C2, the registry's anchor model for the tag; the layout is the C2D's.
  {
    tag: 'nc2p', layout: NC2_LAYOUT, model: 'nc2', registry: 'c2', coverage: ['c2d'],
    title: 'Nord C2D · Program', fileBytes: 373,
  },
  {
    tag: 'nwp', layout: NW1_LAYOUT, model: 'nw1', registry: 'wave', coverage: ['wave'],
    title: 'Nord Wave · Program', fileBytes: 350,
  },
];

describe('legacy-record readers — identify, codec and presenter routing', () => {
  for (const c of CASES) {
    const bytes = synthLegacyLayoutFile(c.tag, c.layout);

    it(`${c.tag} → registry model ${c.registry}, codec ${c.model}, the predicted ${c.fileBytes}-byte file`, () => {
      expect(bytes).toHaveLength(c.fileBytes);
      expect(identifyNordFile(bytes).modelId).toBe(c.registry);
      const file = parseClaviaFile(bytes);
      expect(file.model).toBe(c.model);
      expect(file.program.parsed).toBe(true);
      expect(file.program.warnings).toEqual([]);
    });

    it(`${c.tag} → presenter renders through DecodedProgramView`, () => {
      const d = decodedProgramFor(bytes);
      expect(d?.title).toBe(c.title);
      expect(d?.sections.length).toBeGreaterThan(0);
      const html = renderToStaticMarkup(createElement(DecodedProgramView, { program: d! }));
      expect(html).toContain(c.title);
    });

    it(`${c.tag} truncated still routes, header-only with a warning`, () => {
      const broken = bytes.slice(0, bytes.length - 6);
      const file = parseClaviaFile(broken);
      expect(file.model).toBe(c.model);
      expect(file.program.warnings.length).toBeGreaterThan(0);
      expect(decodedProgramFor(broken)?.sections).toEqual([]);
    });

    for (const id of c.coverage) {
      it(`${id} coverage is 'partial' with a candidate-only byte map of the record data`, () => {
        expect(decodeForModel(id).status).toBe('partial');
        const p = getModelProgress(id)!;
        const layout = id === 'electro-3' ? NE3_LAYOUT : c.layout;
        expect(p.bodyBytes).toBe(layout.dataBytes + (layout.padBytes ?? 0));
        expect(p.regions!.at(-1)!.end).toBe(p.bodyBytes! - 1);
        const statuses = new Set(p.regions!.map((r) => r.status));
        expect(statuses.has('confirmed')).toBe(false);
        expect(statuses.has('candidate')).toBe(true);
      });
    }
  }
});
