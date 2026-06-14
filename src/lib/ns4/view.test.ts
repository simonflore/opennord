import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from './parse';
import { programNameFromFilename } from './name';
import { activeLayers, headerView, drawbarLevels, volumeFill } from './view';

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
