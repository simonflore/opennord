import { describe, it, expect } from 'vitest';
import { engineSearchText, type EngineSummary } from './engines';

describe('engineSearchText', () => {
  it('flattens a container summary (Stage 2/3)', () => {
    const s: EngineSummary = {
      axis: 'container', term: 'Panel',
      groups: [{ id: 'A', engines: ['organ', 'piano'] }, { id: 'B', engines: ['synth'] }],
    };
    expect(engineSearchText(s)).toBe('Panel A: organ + piano · Panel B: synth');
  });

  it('flattens an engine summary (Stage 4)', () => {
    const s: EngineSummary = {
      axis: 'engine',
      engines: [{ kind: 'organ', layers: ['A'] }, { kind: 'piano', layers: ['A', 'B'] }],
    };
    expect(engineSearchText(s)).toBe('organ A + piano A B');
  });

  it('renders an empty summary as empty text, not a crash', () => {
    expect(engineSearchText({ axis: 'engine', engines: [] })).toBe('');
    expect(engineSearchText({ axis: 'container', term: 'Slot', groups: [] })).toBe('');
  });
});
