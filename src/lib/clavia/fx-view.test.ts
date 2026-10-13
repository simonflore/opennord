import { describe, it, expect } from 'vitest';
import { mergeEqualChains, unitsOn, type FxGroupView, type FxUnitView } from './fx-view';

const reverb = (key: string, over: Partial<FxUnitView> = {}): FxUnitView => ({
  key, label: 'Reverb', on: true, type: 'Hall', params: [{ label: 'Amount', value: '3.3', fill: 33 }], ...over,
});
const group = (kind: 'piano' | 'synth', id: string, units: FxUnitView[]): FxGroupView => ({
  key: `${kind}${id}`, label: `${kind === 'piano' ? 'Piano' : 'Synth'} ${id}`, kind, units,
});

describe('mergeEqualChains', () => {
  it('merges neighbouring groups of one kind whose units match apart from the key', () => {
    const out = mergeEqualChains([
      group('synth', 'A', [reverb('sA-rev')]),
      group('synth', 'B', [reverb('sB-rev')]),
      group('synth', 'C', [reverb('sC-rev')]),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe('Synth A·B·C');
    expect(out[0].key).toBe('synthA');
    expect(out[0].units[0].key).toBe('sA-rev');
  });

  it('keeps groups apart when one value differs', () => {
    const out = mergeEqualChains([
      group('synth', 'A', [reverb('a')]),
      group('synth', 'B', [reverb('b', { params: [{ label: 'Amount', value: '3.4', fill: 34 }] })]),
    ]);
    expect(out.map((g) => g.label)).toEqual(['Synth A', 'Synth B']);
  });

  it('keeps groups apart when only a morph target differs', () => {
    const morphed = reverb('b', { params: [{ label: 'Amount', value: '3.3', fill: 33, morph: { wheel: '8.0' } }] });
    const out = mergeEqualChains([group('synth', 'A', [reverb('a')]), group('synth', 'B', [morphed])]);
    expect(out).toHaveLength(2);
  });

  it('merges on what is drawn: a switched-off unit is only its name, whatever it stores', () => {
    const offDelay = (key: string, mix: string): FxUnitView =>
      ({ key, label: 'Delay', on: false, params: [{ label: 'Mix', value: mix, fill: 10 }] });
    const out = mergeEqualChains([
      group('synth', 'A', [offDelay('a-d', '1.0'), reverb('a-r')]),
      group('synth', 'B', [offDelay('b-d', '7.5'), reverb('b-r')]),
    ]);
    expect(out.map((g) => g.label)).toEqual(['Synth A·B']);
  });

  it('never merges across kinds, even when the units match', () => {
    const out = mergeEqualChains([group('piano', 'A', [reverb('a')]), group('synth', 'A', [reverb('b')])]);
    expect(out.map((g) => g.label)).toEqual(['Piano A', 'Synth A']);
  });

  it('only merges neighbours: A and C stay apart when B differs', () => {
    const out = mergeEqualChains([
      group('synth', 'A', [reverb('a')]),
      group('synth', 'B', [reverb('b', { on: false })]),
      group('synth', 'C', [reverb('c')]),
    ]);
    expect(out.map((g) => g.label)).toEqual(['Synth A', 'Synth B', 'Synth C']);
  });

  it('joins whole labels with " / " when they do not share a name', () => {
    const a: FxGroupView = { key: 'x', label: 'Upper', kind: 'synth', units: [reverb('a')] };
    const b: FxGroupView = { key: 'y', label: 'Lower', kind: 'synth', units: [reverb('b')] };
    expect(mergeEqualChains([a, b])[0].label).toBe('Upper / Lower');
  });

  it('returns an empty list unchanged', () => {
    expect(mergeEqualChains([])).toEqual([]);
  });
});

describe('unitsOn', () => {
  it('counts the switched-on units across groups', () => {
    expect(unitsOn([
      group('piano', 'A', [reverb('a'), reverb('b', { on: false })]),
      group('synth', 'A', [reverb('c')]),
    ])).toBe(2);
  });

  it('is 0 for an empty panel', () => {
    expect(unitsOn([])).toBe(0);
  });
});
