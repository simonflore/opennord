import { describe, it, expect } from 'vitest';
import type { NS4Program } from '../ns4/types';
import { naiveRanker } from './search';

const prog = (name: string, over: Partial<NS4Program>) => ({ name, layers: [], ...over }) as unknown as NS4Program;

describe('naiveRanker — effects', () => {
  const organ = { id: 'A', kind: 'organ', enabled: true };
  const organHall = prog('Gospel', { layers: [organ], organFx: { reverb: { on: true, type: 'CATH' } } } as Partial<NS4Program>);
  const chorusOff = prog('Pad', { layers: [{ id: 'A', kind: 'synth', enabled: true, fxMod2: { on: false, mode: 'CHOR' } }] } as Partial<NS4Program>);
  const chorusOn = prog('Strings', { layers: [{ id: 'A', kind: 'synth', enabled: true, fxMod2: { on: true, mode: 'CHOR variation' } }] } as Partial<NS4Program>);
  // Effects that don't sound: chorus on a muted layer, an organ reverb with no organ playing.
  const muted = prog('Muted', { layers: [{ id: 'A', kind: 'synth', enabled: false, fxMod2: { on: true, mode: 'CHOR' } }] } as Partial<NS4Program>);
  const noOrgan = prog('Piano', { layers: [{ id: 'A', kind: 'piano', enabled: true }], organFx: { reverb: { on: true, type: 'CATH' } } } as Partial<NS4Program>);

  it('finds an effect by its name, organ effects included', async () => {
    expect((await naiveRanker.rank('cathedral', [chorusOn, organHall]))[0].name).toBe('Gospel');
    expect((await naiveRanker.rank('chorus', [organHall, chorusOn]))[0].name).toBe('Strings');
  });

  it('ignores an effect that is switched off', async () => {
    // The ranker orders and never drops: the program playing chorus comes first.
    expect((await naiveRanker.rank('chorus', [chorusOff, chorusOn])).map((p) => p.name)).toEqual(['Strings', 'Pad']);
  });

  it('ignores effects that do not sound', async () => {
    expect((await naiveRanker.rank('chorus', [muted, chorusOn]))[0].name).toBe('Strings');
    expect((await naiveRanker.rank('cathedral', [noOrgan, organHall]))[0].name).toBe('Gospel');
  });
});
