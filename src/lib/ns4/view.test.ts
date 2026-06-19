import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from './parse';
import { programNameFromFilename } from './name';
import { activeLayers, headerView, drawbarLevels, volumeFill, organPanel, pianoCard, synthCard, fxChips, sampleRefViews, morphSummary } from './view';

const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))),
);

function fixture() {
  const p = parseNs4Program(fixtureBytes);
  p.name = programNameFromFilename('regressionTest.ns4p');
  return p;
}

describe('activeLayers', () => {
  it('returns only enabled layers (6 of 7; synth A is off)', () => {
    const layers = activeLayers(fixture());
    expect(layers).toHaveLength(6);
    expect(layers.every((l) => l.enabled)).toBe(true);
    expect(layers.find((l) => l.kind === 'synth' && l.id === 'A')).toBeUndefined();
  });
});

describe('headerView', () => {
  it('derives the header fields from the program', () => {
    const h = headerView(fixture());
    expect(h.name).toBe('regressionTest');
    expect(h.slot).toBe('H:81');
    expect(h.category).toBe('None');
    expect(h.version).toBe('v3.13');
    expect(h.sizeBytes).toBe(868);
    expect(h.summary).toBe('organ + piano + synth · 6 layers');
  });
});

describe('drawbarLevels', () => {
  it('parses organ A drawbar strings to integers 0–8', () => {
    const organA = activeLayers(fixture())[0]; // first active layer = organ A
    expect(organA.kind).toBe('organ');
    expect(drawbarLevels(organA)).toEqual([4, 2, 2, 1, 1, 2, 2, 1, 1]);
  });

  it('maps non-numeric / missing drawbars to 0 and clamps to 0–8', () => {
    expect(drawbarLevels({ id: 'A', kind: 'organ', drawbars: [undefined, { value: 'x' }, { value: '12' }] }))
      .toEqual([0, 0, 8]);
  });
});

describe('volumeFill', () => {
  it('maps a dB string to a 0–100 meter fill (-40..+6 dB range)', () => {
    expect(volumeFill('-4.7 dB')).toBe(77);
    expect(volumeFill('6 dB')).toBe(100);
    expect(volumeFill('-40 dB')).toBe(0);
    expect(volumeFill(undefined)).toBe(0);
    expect(volumeFill('n/a')).toBe(0);
  });
});

describe('engine card models', () => {
  const active = activeLayers(fixture());

  it('organPanel reads model + drawbar levels', () => {
    const m = organPanel(active[0], fixture().organFx, true); // organ A (VOX)
    expect(m.model).toBe('VOX');
    expect(m.drawbars.map((d) => d.level)).toEqual([4, 2, 2, 1, 1, 2, 2, 1, 1]);
  });

  it('pianoCard reads type + model name', () => {
    const c = pianoCard(active[2]); // piano A
    expect(c.type).toBe('Clav');
    expect(c.model).toBe('Clavinet D6 6.1');
  });

  it('synthCard reads osc + filter for an analog synth', () => {
    const c = synthCard(active[4]); // synth B
    expect(c.source).toBe('analog');
    expect(c.osc).toBe('2 (FM-H)');
    expect(c.oscDetail).toBe('wave 0.5');
    expect(c.filterType).toBe('BP');
    expect(c.cutoff).toBe('3.7 kHz');
  });
});

describe('fxChips', () => {
  const chips = fxChips(fixture());

  it('collects on-effects across active layers + global organ FX', () => {
    // fixture: piano A reverb(1) + piano B mod1/mod2/delay(3) +
    // synth B mod1/mod2/amp/comp(4) + synth C delay/reverb(2) + organ mod1/amp/delay(3) = 13
    expect(chips.length).toBe(13);
  });

  it('each chip has a non-empty label and string detail', () => {
    for (const c of chips) {
      expect(typeof c.label).toBe('string');
      expect(c.label.length).toBeGreaterThan(0);
      expect(typeof c.detail).toBe('string');
    }
  });

  it('keys are unique', () => {
    const keys = chips.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes a Reverb and a Delay chip (present in the fixture)', () => {
    expect(chips.some((c) => c.label.endsWith('Reverb'))).toBe(true);
    expect(chips.some((c) => c.label.endsWith('Delay'))).toBe(true);
  });

  it('prefixes per-layer FX with the engine, and the layer letter when a kind has 2+ active layers', () => {
    // fixture: piano A + piano B both active → letters; synth B + synth C both active → letters
    expect(chips.some((c) => c.label === 'Piano A Reverb')).toBe(true);
    expect(chips.some((c) => c.label === 'Synth C Reverb')).toBe(true);
    // organ FX keeps its global "Organ" prefix
    expect(chips.some((c) => c.label.startsWith('Organ'))).toBe(true);
  });
});

describe('sampleRefViews', () => {
  it('is empty for an all-analog patch (fixture has no enabled samples-mode layers)', () => {
    // The fixture's synth layers are all analog (and synth A is disabled), so the
    // stored sample slots are not samples the patch actually plays.
    expect(sampleRefViews(fixture())).toEqual([]);
  });

  it('includes only enabled, samples-mode layers; excludes analog and disabled', () => {
    const p = fixture();
    // Flip synth C (Flute) to enabled samples-mode; leave synth A (disabled) and
    // synth B (analog) as-is — only synth C should surface.
    const layers = (p.layers ?? []).map((l) =>
      l.kind === 'synth' && l.id === 'C' ? { ...l, enabled: true, source: 'samples' as const } : l,
    );
    const refs = sampleRefViews({ ...p, layers });
    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('Flute Multi_ST 4.1');
    expect(typeof refs[0].id).toBe('number');
    expect(typeof refs[0].categoryName).toBe('string');
  });
});

describe('morphSummary', () => {
  const rows = morphSummary(fixture());

  it('lists every morph-assigned parameter (the fixture has organ-FX morphs)', () => {
    expect(rows.length).toBeGreaterThan(0);
    // every row carries at least one source → target assignment
    for (const r of rows) {
      expect(typeof r.name).toBe('string');
      expect(typeof r.section).toBe('string');
      expect(!!(r.wheel || r.at || r.pedal)).toBe(true);
    }
  });

  it('maps the param group to a human section label', () => {
    // fixture morphs are all global organ-FX params (group "m" → "Global")
    expect(rows.every((r) => ['Organ', 'Piano', 'Synth', 'Global'].includes(r.section))).toBe(true);
  });
});
