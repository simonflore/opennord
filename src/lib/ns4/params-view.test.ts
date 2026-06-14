import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeAllParams } from './coverage';
import { buildParamMap } from './maps';
import { collapseMorphs, groupParams, filterRows } from './params-view';

const bytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))),
);
const all = decodeAllParams(bytes, buildParamMap());

describe('params-view', () => {
  it('collapses morph rows into base rows (far fewer than the raw dump)', () => {
    const rows = collapseMorphs(all);
    expect(rows.length).toBeLessThan(all.length);
    expect(rows.some((r) => / with (wheel|A\.T\.|ctrlped)$/.test(r.name))).toBe(false);
  });

  it('attaches assigned morphs as badges (the fixture has at least one)', () => {
    const rows = collapseMorphs(all);
    const withMorph = rows.filter((r) => r.morphs.wheel || r.morphs.at || r.morphs.pedal);
    expect(withMorph.length).toBeGreaterThan(0);
  });

  it('groups rows by section without losing any', () => {
    const rows = collapseMorphs(all);
    const groups = groupParams(rows);
    expect(groups.length).toBeGreaterThan(1);
    expect(groups.reduce((n, g) => n + g.rows.length, 0)).toBe(rows.length);
  });

  it('filters by name or value', () => {
    const filtered = filterRows(collapseMorphs(all), 'reverb');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => (r.name + ' ' + r.display).toLowerCase().includes('reverb'))).toBe(true);
  });
});
