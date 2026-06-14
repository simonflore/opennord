import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from './parse';
import { programNameFromFilename } from './name';
import { activeLayers, headerView } from './view';

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
