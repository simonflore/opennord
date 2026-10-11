/**
 * Routing for the later ColdFire legacy-record readers (clavia/legacy-program.ts):
 * identify → codec → presenter → view, for each program tag and its Live tag.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { parseClaviaFile } from './formats';
import { decodedProgramFor } from './presenters';
import { identifyNordFile } from './clavia/nord-file';
import { synthLegacyFile, writeLegacyRecord } from './clavia/block-chain.synth';
import type { LegacyLayout } from './clavia/legacy-record';
import { DecodedProgramView } from '../components/program/DecodedProgramView';
import { decodeForModel, getModelProgress } from './contribute/coverage';
import { NE5_LAYOUT } from './ne5/layout.generated';
import { NP3_LAYOUT } from './np3/layout.generated';
import { NCP_LAYOUT } from './nc/layout.generated';
import { NP1_LAYOUT } from './np1/layout.generated';
import { NP2_LAYOUT } from './np2/layout.generated';

interface Case {
  tag: string; live?: string; layout: LegacyLayout; model: string; registry: string; title: string;
  version: number; status: 'confirmed' | 'candidate';
}

const CASES: Case[] = [
  { tag: 'ne5p', live: 'ne5l', layout: NE5_LAYOUT, model: 'ne5', registry: 'electro-5', title: 'Nord Electro 5 · Program', version: 4, status: 'confirmed' },
  { tag: 'np3p', live: 'np3l', layout: NP3_LAYOUT, model: 'np3', registry: 'piano-3', title: 'Nord Piano 3 · Program', version: 4, status: 'candidate' },
  { tag: 'np2p', layout: NP2_LAYOUT, model: 'np2', registry: 'piano-2', title: 'Nord Piano 2 · Program', version: 2, status: 'candidate' },
  { tag: 'nppg', layout: NP1_LAYOUT, model: 'np1', registry: 'piano-1', title: 'Nord Piano · Program', version: 0, status: 'candidate' },
  { tag: 'ncpg', layout: NCP_LAYOUT, model: 'nc', registry: 'c2', title: 'Nord C2 · Program', version: 100, status: 'candidate' },
];

function file(tag: string, layout: LegacyLayout, version: number): Uint8Array {
  const data = new Uint8Array(layout.dataBytes);
  writeLegacyRecord(data, layout);
  return synthLegacyFile(tag, version, data);
}

describe('ColdFire legacy-record readers — identify, codec, presenter and coverage', () => {
  for (const c of CASES) {
    const bytes = file(c.tag, c.layout, c.version);

    it(`${c.tag} → registry model ${c.registry}, codec ${c.model}`, () => {
      expect(identifyNordFile(bytes).modelId).toBe(c.registry);
      const f = parseClaviaFile(bytes);
      expect(f.model).toBe(c.model);
      expect(f.program.parsed).toBe(true);
      expect(f.program.warnings).toEqual([]);
    });

    if (c.live) {
      it(`${c.live} (Live) routes to the same codec and presenter`, () => {
        const live = file(c.live!, c.layout, c.version);
        expect(parseClaviaFile(live).model).toBe(c.model);
        expect(decodedProgramFor(live)?.title).toBe(c.title);
      });
    }

    it(`${c.tag} → presenter renders through DecodedProgramView`, () => {
      const d = decodedProgramFor(bytes)!;
      expect(d.title).toBe(c.title);
      expect(d.sections.length).toBeGreaterThan(0);
      expect(renderToStaticMarkup(createElement(DecodedProgramView, { program: d }))).toContain(c.title);
    });

    it(`${c.tag} too short still routes, header-only with a warning`, () => {
      const short = bytes.slice(0, 0x1a + 2);
      const f = parseClaviaFile(short);
      expect(f.model).toBe(c.model);
      expect(f.program.warnings.length).toBeGreaterThan(0);
      expect(decodedProgramFor(short)?.sections).toEqual([]);
    });

    it(`${c.registry} coverage is 'partial' over the ${c.layout.dataBytes}-byte record, ${c.status}`, () => {
      expect(decodeForModel(c.registry)).toMatchObject({ status: 'partial', bodyBytes: c.layout.dataBytes, fullMap: true });
      const statuses = new Set(getModelProgress(c.registry)!.regions!.map((r) => r.status));
      expect(statuses.has(c.status)).toBe(true);
      expect(statuses.has(c.status === 'confirmed' ? 'candidate' : 'confirmed')).toBe(false);
    });
  }
});
