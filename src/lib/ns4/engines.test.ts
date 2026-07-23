import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNs4Program } from './parse';
import { ns4Engines } from './engines';

const fixtureBytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))),
);
const fixture = () => parseNs4Program(fixtureBytes);

describe('ns4Engines', () => {
  it('groups active layers under their engine, in organ → piano → synth order', () => {
    expect(ns4Engines(fixture())).toEqual({
      axis: 'engine',
      engines: [
        { kind: 'organ', layers: ['A', 'B'] },
        { kind: 'piano', layers: ['A', 'B'] },
        { kind: 'synth', layers: ['B', 'C'] }, // synth A is off in scene I
      ],
    });
  });

  it('honours the requested Layer Scene (a scene only mutes)', () => {
    expect(ns4Engines(fixture(), 'II')).toEqual({
      axis: 'engine',
      engines: [
        { kind: 'organ', layers: ['A', 'B'] },
        { kind: 'piano', layers: ['B'] },
        { kind: 'synth', layers: ['A', 'B'] },
      ],
    });
  });

  it('omits an engine entirely when none of its layers are on', () => {
    const p = parseNs4Program(fixtureBytes);
    p.layers = (p.layers ?? []).filter((l) => l.kind !== 'organ');
    const s = ns4Engines(p);
    expect(s.axis).toBe('engine');
    if (s.axis !== 'engine') throw new Error('unreachable');
    expect(s.engines.map((e) => e.kind)).toEqual(['piano', 'synth']);
  });
});
