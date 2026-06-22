import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNg2 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/grand-2');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.ng2p'));

describe('decodeNg2', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.02 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNg2(load(name)).version, name).toBe('1.02');
    }
  });

  it('exposes correctly-sized raw clusters', () => {
    const prog = decodeNg2(load(fixtures()[0]));
    expect(prog._globalHeaderCluster).toHaveLength(4);
    expect(prog._layerAPrimaryCluster).toHaveLength(9);
    expect(prog._layerBPrimaryCluster).toHaveLength(9);
    expect(prog._layerAExtendedCluster).toHaveLength(16);
    expect(prog._layerBExtendedCluster).toHaveLength(16);
    expect(prog.layerA._raw).toHaveLength(14);
    expect(prog.layerB._raw).toHaveLength(14);
    expect(prog._layerAFinalCluster).toHaveLength(16);
    expect(prog._layerBFinalCluster).toHaveLength(16);
  });

  it('layer pairs share identical cluster sizes', () => {
    const prog = decodeNg2(load(fixtures()[0]));
    expect(prog._layerAPrimaryCluster.length).toBe(prog._layerBPrimaryCluster.length);
    expect(prog._layerAExtendedCluster.length).toBe(prog._layerBExtendedCluster.length);
    expect(prog.layerA._raw.length).toBe(prog.layerB._raw.length);
    expect(prog._layerAFinalCluster.length).toBe(prog._layerBFinalCluster.length);
  });

  // ── Candidate field tests (corpus RE, 2026-06-22) ───────────────────────

  it('globalParam1 and globalParam2 are 3-bit values (0–7) across all fixtures', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      expect(prog.globalParam1, `${name} globalParam1`).toBeGreaterThanOrEqual(0);
      expect(prog.globalParam1, `${name} globalParam1`).toBeLessThanOrEqual(7);
      expect(prog.globalParam2, `${name} globalParam2`).toBeGreaterThanOrEqual(0);
      expect(prog.globalParam2, `${name} globalParam2`).toBeLessThanOrEqual(7);
    }
  });

  it('piano model indices are in the expected range (1–18)', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      expect(prog.layerA.pianoModel, `${name} layerA.pianoModel`).toBeGreaterThanOrEqual(1);
      expect(prog.layerA.pianoModel, `${name} layerA.pianoModel`).toBeLessThanOrEqual(18);
      expect(prog.layerB.pianoModel, `${name} layerB.pianoModel`).toBeGreaterThanOrEqual(1);
      expect(prog.layerB.pianoModel, `${name} layerB.pianoModel`).toBeLessThanOrEqual(18);
    }
  });

  it('decodes specific fixture values — Acid_Piano (model 12 both layers)', () => {
    const prog = decodeNg2(load('BUNDLE__DW_Acid_Piano.ng2p'));
    // Corpus observation: Acid_Piano uses model index 12 for both layers.
    expect(prog.layerA.pianoModel).toBe(12);
    expect(prog.layerB.pianoModel).toBe(12);
    expect(prog.layerBActiveFlag).toBe(false);
  });

  it('decodes specific fixture values — Duet (layerBActiveFlag=true)', () => {
    const prog = decodeNg2(load('BUNDLE__DW_Duet.ng2p'));
    // Corpus observation: Duet has body[8] = 0x80 → layerBActiveFlag true.
    expect(prog.layerBActiveFlag).toBe(true);
    // Layer A model = 5 (lowest in corpus), Layer B model = 16.
    expect(prog.layerA.pianoModel).toBe(5);
    expect(prog.layerB.pianoModel).toBe(16);
  });

  it('decodes specific fixture values — Stacked (layerBActiveFlag=true, model 14/11)', () => {
    const prog = decodeNg2(load('BUNDLE__DW_Stacked.ng2p'));
    expect(prog.layerBActiveFlag).toBe(true);
    expect(prog.layerA.pianoModel).toBe(14);
    expect(prog.layerB.pianoModel).toBe(11);
  });

  it('layerBActiveFlag is false for the majority of corpus programs', () => {
    const active = fixtures().filter(name => decodeNg2(load(name)).layerBActiveFlag);
    // Exactly 4 programs have layerBActiveFlag set in our 20-file corpus.
    expect(active).toHaveLength(4);
  });

  it('piano model 12 is the most common Layer A default', () => {
    const counts = new Map<number, number>();
    for (const name of fixtures()) {
      const m = decodeNg2(load(name)).layerA.pianoModel;
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    // Model 12 appears in 6/20 Layer A programs (most frequent).
    expect(counts.get(12)).toBeGreaterThanOrEqual(4);
  });
});
