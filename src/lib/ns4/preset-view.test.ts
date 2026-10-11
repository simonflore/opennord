import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNs4Preset } from './preset';
import { presetVoices, presetParamSections } from './preset-view';
import { buildCbinHeader } from '../clavia/cbin';
import { hasGt } from './gt-fixtures';

/** Zero-bodied preset with a real header — see preset.test.ts. */
function blank(tag: string, size: number): Uint8Array {
  const buf = new Uint8Array(size);
  buf.set(buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw: 205 }), 0);
  return buf;
}

describe('presetVoices', () => {
  it.each([['ns4o', 183, 'organ'], ['ns4n', 195, 'piano'], ['ns4y', 541, 'synth']] as const)(
    'gives a %s preset one %s card per enabled voice', (tag, size, kind) => {
      const preset = parseNs4Preset(blank(tag, size))!;
      const voices = presetVoices(preset);
      expect(voices).toHaveLength(preset.layers.length);
      expect(voices[0].card.kind).toBe(kind);
      expect(voices[0].card.title).toBe(kind.toUpperCase());
    });

  it('draws nine drawbars for an organ preset', () => {
    const card = presetVoices(parseNs4Preset(blank('ns4o', 183))!)[0].card;
    expect(card.kind === 'organ' && card.organ.drawbars).toHaveLength(9);
  });
});

describe('presetParamSections', () => {
  it('keeps every row, split into panel sections with Sound first', () => {
    const rows = parseNs4Preset(blank('ns4y', 541))!.layers[0].rows;
    const sections = presetParamSections(rows);
    expect(sections.reduce((n, s) => n + s.rows.length, 0)).toBe(rows.length);
    expect(sections[0].label).toBe('Sound');
    expect(sections.map((s) => s.label)).toEqual(expect.arrayContaining(['Filter', 'Envelopes', 'Effects']));
    expect(sections.find((s) => s.key === 'fx')!.rows.every((r) => r.name.startsWith('FX '))).toBe(true);
  });
});

// Factory presets are Nord content — git-ignored, so these run only where the
// local corpus is present (docs/LEGAL.md). Values match the flat parameter list.
const DIR = 'fixtures/stage-4';
const load = (name: string) => parseNs4Preset(new Uint8Array(readFileSync(resolve(__dirname, '../../..', DIR, name))))!;
const PAD = 'Synth Preset_Bank 1_Slow Motion Pad.ns4y';
const B3 = 'Organ Preset_Bank 1_B3 Cocktail.ns4o';
const UPRIGHT = 'Piano Preset_Bank 1_Powerful Upright.ns4n';

describe.skipIf(!hasGt(`${DIR}/${PAD}`, `${DIR}/${B3}`, `${DIR}/${UPRIGHT}`))('presetVoices — factory presets', () => {
  it('synth: filter, envelopes and only the effects that are on', () => {
    const [v] = presetVoices(load(PAD));
    if (v.card.kind !== 'synth') throw new Error('expected a synth card');
    expect(v.card.synth.filterType).toBe('LP24');
    expect(v.card.synth.cutoff).toBe('4.2 kHz');
    expect(v.card.env).not.toBeNull();
    expect(v.card.filterEnv).toBeDefined();
    expect(v.fxChips.map((c) => c.label)).toEqual(['Amp/EQ', 'Reverb']);
    expect(v.fxChips[1].detail).toContain('HALL');
  });

  it('organ: the B3 with its registration', () => {
    const preset = load(B3);
    const [v] = presetVoices(preset);
    if (v.card.kind !== 'organ') throw new Error('expected an organ card');
    expect(v.card.organ.model).toBe('B3');
    const row = (n: number) => preset.layers[0].rows.find((r) => r.name === `drawbar ${n}`)!.display;
    expect(v.card.organ.drawbars.map((d) => d.label)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map(row));
  });

  it('piano: the model by name', () => {
    const [v] = presetVoices(load(UPRIGHT));
    if (v.card.kind !== 'piano') throw new Error('expected a piano card');
    expect(v.card.piano.model).toBe('Amber Upright XL');
  });
});
