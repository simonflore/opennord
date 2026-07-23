import { describe, it, expect } from 'vitest';
import type { Ns2Slot } from './decode';
import { ns2Engines } from './engines';

/** Minimal slot — only the `on` flags matter to the summary. */
function slot(id: 'A' | 'B', on: { organ?: boolean; piano?: boolean; synth?: boolean }): Ns2Slot {
  return {
    id,
    active: true,
    organ: { on: !!on.organ },
    piano: { on: !!on.piano },
    synth: { on: !!on.synth },
  } as unknown as Ns2Slot;
}

describe('ns2Engines', () => {
  it('groups engines under their Slot, in organ → piano → synth order', () => {
    expect(ns2Engines([slot('A', { piano: true }), slot('B', { organ: true, synth: true })])).toEqual({
      axis: 'container',
      term: 'Slot',
      groups: [{ id: 'A', engines: ['piano'] }, { id: 'B', engines: ['organ', 'synth'] }],
    });
  });

  it('maps exactly the slots it is given (callers filter on `active`)', () => {
    expect(ns2Engines([])).toEqual({ axis: 'container', term: 'Slot', groups: [] });
  });
});
