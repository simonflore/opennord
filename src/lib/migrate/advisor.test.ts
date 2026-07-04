import { describe, expect, it } from 'vitest';
import { naiveAdvisor, validateAnswers, type JudgmentCall } from './advisor';

const call = (id: string, desc: string, opts: string[]): JudgmentCall => ({
  id, kind: 'piano-sound', description: desc,
  options: opts.map((o) => ({ id: o, label: o })),
});

describe('naiveAdvisor', () => {
  it('matches by token overlap, case-insensitive', async () => {
    const [a] = await naiveAdvisor.choose([
      call('c1', 'Stage 3 piano "Royal Grand 3D XL" (Grand)',
        ['White Grand', 'Royal Grand 3D Sml', 'Wurlitzer 200A']),
    ]);
    expect(a.optionId).toBe('Royal Grand 3D Sml');
    expect(a.confidence).not.toBe('high'); // partial match only
  });
  it('returns null optionId when nothing overlaps', async () => {
    const [a] = await naiveAdvisor.choose([
      call('c1', 'Stage 3 piano "Silver Grand"', ['Clavinet D6', 'Mellotron Flute']),
    ]);
    expect(a.optionId).toBeNull();
  });
});

describe('validateAnswers', () => {
  const calls = [call('c1', 'x', ['a', 'b'])];
  it('discards answers pointing outside the menu', () => {
    const out = validateAnswers(calls, [
      { id: 'c1', optionId: 'zzz', confidence: 'high', rationale: 'hallucinated' },
    ]);
    expect(out[0].optionId).toBeNull();
  });
  it('fills in missing answers', () => {
    const out = validateAnswers(calls, []);
    expect(out).toHaveLength(1);
    expect(out[0].optionId).toBeNull();
  });
  it('passes valid answers through untouched', () => {
    const out = validateAnswers(calls, [
      { id: 'c1', optionId: 'b', confidence: 'high', rationale: 'exact' },
    ]);
    expect(out[0].optionId).toBe('b');
  });
});
