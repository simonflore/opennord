import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from './parse';
import { programNameFromFilename } from '../clavia/name';
import { activeLayers, headerView, drawbarLevels, volumeFill, organPanel, pianoCard, synthCard, sampleRefViews, morphSummary } from './view';
import { engineZones, isSplit, programZones } from './view';
import type { KeyItem } from '../clavia/engine-view';
import { zonedProgram } from '../../test-utils/ns4';

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
    expect(h.engines).toEqual({
      axis: 'engine',
      engines: [
        { kind: 'organ', layers: ['A', 'B'] },
        { kind: 'piano', layers: ['A', 'B'] },
        { kind: 'synth', layers: ['B', 'C'] },
      ],
    });
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

describe('engineZones / isSplit', () => {
  it('reads the zone flags with the Split switch on', () => {
    const p = zonedProgram([{ kind: 'organ', kbZones: '1100' }, { kind: 'piano', kbZones: '0011' }]);
    expect(engineZones(p)).toEqual([
      { kind: 'piano', cells: [false, false, true, true] },
      { kind: 'organ', cells: [true, true, false, false] },
    ]);
    expect(isSplit(p)).toBe(true);
  });

  it('with the switch off, every active engine plays the whole keyboard, stale flags or not', () => {
    const p = zonedProgram([{ kind: 'organ', kbZones: '0000' }, { kind: 'piano', kbZones: '0011' }], false);
    expect(engineZones(p)).toEqual([
      { kind: 'piano', cells: [true, true, true, true] },
      { kind: 'organ', cells: [true, true, true, true] },
    ]);
    expect(isSplit(p)).toBe(false);
  });

  it('a real program: Split on, but each engine still covers the keyboard (organ A + B)', () => {
    const p = fixture();
    expect(programZones(p).hasSplit).toBe(true);
    expect(isSplit(p)).toBe(false);
  });
});

describe('pianoCard — timbre and touch as LED keys', () => {
  const card = (pianoType: string, timbre: string, touch = 'med') =>
    pianoCard({ id: 'A', kind: 'piano', pianoType, timbre, touch } as unknown as Parameters<typeof pianoCard>[0]);
  const lit = (keys?: KeyItem[]) => keys?.filter((k) => k.on).map((k) => k.label);

  it('lights the timbre setting; an electric piano adds the Dyno keys', () => {
    expect(card('Grand', 'MID').timbreKeys?.map((k) => k.label)).toEqual(['Soft', 'Mid', 'Bright']);
    expect(lit(card('Grand', 'MID').timbreKeys)).toEqual(['Mid']);
    expect(lit(card('Electric', 'DYNO2').timbreKeys)).toEqual(['Dyno 2']);
    expect(card('Electric', 'off').timbreKeys).toHaveLength(5);
  });

  it('lights several keys for a clav combination, by the clav\'s names; none for off', () => {
    expect(card('Clav', 'off').timbreKeys?.map((k) => k.label)).toEqual(['Soft', 'Treble', 'Brilliant']);
    expect(lit(card('Clav', 'SOFT+BRIGHT').timbreKeys)).toEqual(['Soft', 'Brilliant']);
    expect(lit(card('Grand', 'off').timbreKeys)).toEqual([]);
  });

  it('keeps a knob for a timbre the type\'s keys cannot show', () => {
    expect(card('Grand', 'DYNO1').timbreKeys).toBeUndefined();
  });

  it('shows keyboard touch as Light / Med / Heavy', () => {
    expect(card('Grand', 'off', 'heavy').touchKeys).toEqual([
      { label: 'Light', on: false }, { label: 'Med', on: false }, { label: 'Heavy', on: true },
    ]);
  });
});
