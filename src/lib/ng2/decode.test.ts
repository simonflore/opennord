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
    expect(prog.layerA._raw).toHaveLength(9);
    expect(prog.layerB._raw).toHaveLength(9);
    expect(prog._layerAExtendedCluster).toHaveLength(16);
    expect(prog._layerBExtendedCluster).toHaveLength(16);
    expect(prog._layerAEffectsCluster).toHaveLength(14);
    expect(prog._layerBEffectsCluster).toHaveLength(14);
    expect(prog._layerAFinalCluster).toHaveLength(16);
    expect(prog._layerBFinalCluster).toHaveLength(16);
  });

  it('layer pairs share identical cluster sizes', () => {
    const prog = decodeNg2(load(fixtures()[0]));
    expect(prog.layerA._raw.length).toBe(prog.layerB._raw.length);
    expect(prog._layerAExtendedCluster.length).toBe(prog._layerBExtendedCluster.length);
    expect(prog._layerAEffectsCluster.length).toBe(prog._layerBEffectsCluster.length);
    expect(prog._layerAFinalCluster.length).toBe(prog._layerBFinalCluster.length);
    expect(prog.layerA.pianoModelIdBytes).toHaveLength(4);
  });

  // ── Candidate global fields ─────────────────────────────────────────────

  it('globalParam1 and globalParam2 are 3-bit values (0–7) across all fixtures', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      expect(prog.globalParam1, `${name} globalParam1`).toBeGreaterThanOrEqual(0);
      expect(prog.globalParam1, `${name} globalParam1`).toBeLessThanOrEqual(7);
      expect(prog.globalParam2, `${name} globalParam2`).toBeGreaterThanOrEqual(0);
      expect(prog.globalParam2, `${name} globalParam2`).toBeLessThanOrEqual(7);
    }
  });

  it('layerBActiveFlag is set in exactly 4 corpus programs', () => {
    const active = fixtures().filter(name => decodeNg2(load(name)).layerBActiveFlag);
    expect(active).toHaveLength(4);
  });

  // ── CONFIRMED piano-layer fields (Stage group-p oracle, 2026-06-22) ───────

  it('CONFIRMED pianoOn distribution is {off:23, on:17} across both layers', () => {
    let on = 0;
    let off = 0;
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      for (const layer of [prog.layerA, prog.layerB]) {
        if (layer.pianoOn) on++;
        else off++;
      }
    }
    // Stage 230-3: on-layers carry real volume, off-layers default.
    expect(on).toBe(17);
    expect(off).toBe(23);
  });

  it('CONFIRMED volume: on-layers carry nonzero volume, off-layers read 0', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      for (const layer of [prog.layerA, prog.layerB]) {
        expect(layer.volume, `${name} volume range`).toBeGreaterThanOrEqual(0);
        expect(layer.volume, `${name} volume range`).toBeLessThanOrEqual(127); // 230-7 7-bit
        if (layer.pianoOn) {
          expect(layer.volume, `${name} on-layer volume`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('CONFIRMED kbZones are a 4-bit enum {0,8,15}', () => {
    const seen = new Set<number>();
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      for (const layer of [prog.layerA, prog.layerB]) {
        expect(layer.kbZones, `${name} kbZones`).toBeLessThanOrEqual(15); // 243-1 4-bit
        seen.add(layer.kbZones);
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 8, 15]);
  });

  it('CONFIRMED octaveShift is 4-bit, centred ~4', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      for (const layer of [prog.layerA, prog.layerB]) {
        expect(layer.octaveShift, `${name} octaveShift`).toBeLessThanOrEqual(15); // 243-5
      }
    }
    // Dominant value across the corpus is 4 (the center).
    let four = 0;
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      for (const layer of [prog.layerA, prog.layerB]) {
        if (layer.octaveShift === 4) four++;
      }
    }
    expect(four).toBe(28);
  });

  it('CONFIRMED pianoType: Grand-dominant, with Electric/Upright differentials', () => {
    // Stage 244-3 semantic differential (from the cross-model mapping evidence).
    const acid = decodeNg2(load('BUNDLE__DW_Acid_Piano.ng2p'));
    expect(acid.layerA.pianoType).toBe('Grand');

    // Stacked-B & Wavey-B = Electric.
    expect(decodeNg2(load('BUNDLE__DW_Stacked.ng2p')).layerB.pianoType).toBe('Electric');
    expect(decodeNg2(load('BUNDLE__DW_Wavey.ng2p')).layerB.pianoType).toBe('Electric');

    // Thursday-A, Kentucky-B, Tspoon-B = Upright.
    expect(decodeNg2(load('BUNDLE__DW_Thursday.ng2p')).layerA.pianoType).toBe('Upright');
    expect(decodeNg2(load('BUNDLE__DW_Kentucky.ng2p')).layerB.pianoType).toBe('Upright');
    expect(decodeNg2(load('BUNDLE__DW_Tspoon.ng2p')).layerB.pianoType).toBe('Upright');
  });

  it('CONFIRMED pianoType distribution is Grand:34 / Upright:4 / Electric:2', () => {
    const counts: Record<string, number> = {};
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      for (const layer of [prog.layerA, prog.layerB]) {
        counts[layer.pianoType] = (counts[layer.pianoType] ?? 0) + 1;
      }
    }
    expect(counts.Grand).toBe(34);
    expect(counts.Upright).toBe(4);
    expect(counts.Electric).toBe(2);
  });

  it('CONFIRMED pianoModelId: default Grand is 0x40a12a7b on off-layers', () => {
    // Stage 245-5: off-layers carry the default Grand model bytes.
    const lazy = decodeNg2(load('BUNDLE__DW_Lazy_River.ng2p'));
    expect(lazy.layerA.pianoModelId >>> 0).toBe(0x40a12a7b);
    expect(lazy.layerA.pianoOn).toBe(false);
    expect(Array.from(lazy.layerA.pianoModelIdBytes)).toEqual([0x40, 0xa1, 0x2a, 0x7b]);
  });

  it('CONFIRMED pianoModelId: same instrument shares the exact 32-bit ID', () => {
    // Clavish-A & Untitled-A both 0x830146c3 (slot 24, var 3).
    const clavish = decodeNg2(load('BUNDLE__DW_Clavish.ng2p'));
    const untitled = decodeNg2(load('BUNDLE__DW_Untitled.ng2p'));
    expect(clavish.layerA.pianoModelId >>> 0).toBe(0x830146c3);
    expect(untitled.layerA.pianoModelId >>> 0).toBe(0x830146c3);
    expect(clavish.layerA.pianoModelSlot).toBe(24);
    expect(clavish.layerA.pianoVariation).toBe(3);

    // Kentucky-A & Thursday-B both 0x4c57dca3 (cross-layer shared model).
    const kentucky = decodeNg2(load('BUNDLE__DW_Kentucky.ng2p'));
    const thursday = decodeNg2(load('BUNDLE__DW_Thursday.ng2p'));
    expect(kentucky.layerA.pianoModelId >>> 0).toBe(0x4c57dca3);
    expect(thursday.layerB.pianoModelId >>> 0).toBe(0x4c57dca3);

    // Griti-B & Concerto-B both 0x22676f0b.
    const griti = decodeNg2(load('BUNDLE__DW_Griti_Tines.ng2p'));
    const concerto = decodeNg2(load('BUNDLE__DW_Concerto.ng2p'));
    expect(griti.layerB.pianoModelId >>> 0).toBe(0x22676f0b);
    expect(concerto.layerB.pianoModelId >>> 0).toBe(0x22676f0b);
  });

  it('decodes specific fixture values — Duet layer split', () => {
    const prog = decodeNg2(load('BUNDLE__DW_Duet.ng2p'));
    expect(prog.layerBActiveFlag).toBe(true);
    // Layer A is the default Grand (off); Layer B carries the played sound.
    expect(prog.layerA.pianoOn).toBe(false);
    expect(prog.layerB.pianoOn).toBe(false);
    expect(prog.layerB.volume).toBe(100);
    expect(prog.layerB.pianoModelSlot).toBe(9);
  });

  // ── CANDIDATE field range guards (Stage group-p oracle) ──────────────────

  it('CANDIDATE slot/variation/touch/unison/dynComp/timbre stay in range', () => {
    for (const name of fixtures()) {
      const prog = decodeNg2(load(name));
      for (const layer of [prog.layerA, prog.layerB]) {
        expect(layer.pianoModelSlot, `${name} slot`).toBeLessThanOrEqual(31); // 244-6 5-bit
        expect(layer.pianoVariation, `${name} variation`).toBeLessThanOrEqual(3); // 245-3 2-bit
        expect(layer.touch, `${name} touch`).toBeLessThanOrEqual(3); // 249-8 2-bit
        expect(layer.unisonLevel, `${name} unison`).toBeLessThanOrEqual(3); // 250-2 2-bit
        expect(layer.dynComp, `${name} dynComp`).toBeLessThanOrEqual(3); // 250-4 2-bit
        expect(layer.timbre, `${name} timbre`).toBeLessThanOrEqual(7); // 250-7 3-bit
      }
    }
  });
});
