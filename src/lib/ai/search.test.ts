import { describe, it, expect } from 'vitest';
import type { NS4Program } from '../ns4/types';
import { naiveRanker } from './search';

const prog = (name: string, over: Partial<NS4Program>) => ({ name, layers: [], ...over }) as unknown as NS4Program;

describe('naiveRanker — effects', () => {
  const organHall = prog('Gospel', { organFx: { reverb: { on: true, type: 'CATH' } } } as Partial<NS4Program>);
  const chorusOff = prog('Pad', { layers: [{ id: 'A', fxMod2: { on: false, mode: 'CHOR' } }] } as Partial<NS4Program>);
  const chorusOn = prog('Strings', { layers: [{ id: 'A', fxMod2: { on: true, mode: 'CHOR variation' } }] } as Partial<NS4Program>);

  it('finds an effect by its name, organ effects included', async () => {
    expect((await naiveRanker.rank('cathedral', [chorusOn, organHall]))[0].name).toBe('Gospel');
    expect((await naiveRanker.rank('chorus', [organHall, chorusOn]))[0].name).toBe('Strings');
  });

  it('ignores an effect that is switched off', async () => {
    // The ranker orders and never drops: the program playing chorus comes first.
    expect((await naiveRanker.rank('chorus', [chorusOff, chorusOn])).map((p) => p.name)).toEqual(['Strings', 'Pad']);
  });
});
