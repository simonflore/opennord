import { describe, it, expect } from 'vitest';
import type { Ns3Panel } from './decode';
import { ns3Engines } from './engines';

/** Minimal panel — only the `on` flags matter to the summary. */
function panel(id: 'A' | 'B', on: { organ?: boolean; piano?: boolean; synth?: boolean }): Ns3Panel {
  return {
    id,
    organ: { on: !!on.organ },
    piano: { on: !!on.piano },
    synth: { on: !!on.synth },
  } as unknown as Ns3Panel;
}

describe('ns3Engines', () => {
  it('groups engines under their Panel, in organ → piano → synth order', () => {
    expect(ns3Engines([panel('A', { organ: true, piano: true }), panel('B', { synth: true })])).toEqual({
      axis: 'container',
      term: 'Panel',
      groups: [{ id: 'A', engines: ['organ', 'piano'] }, { id: 'B', engines: ['synth'] }],
    });
  });

  it('keeps a panel with nothing on, as an empty group', () => {
    expect(ns3Engines([panel('A', {})])).toEqual({
      axis: 'container', term: 'Panel', groups: [{ id: 'A', engines: [] }],
    });
  });

  it('yields no groups when the decoder found no panels', () => {
    expect(ns3Engines([])).toEqual({ axis: 'container', term: 'Panel', groups: [] });
  });
});
