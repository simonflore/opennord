import { describe, expect, it } from 'vitest';
import { naiveAdvisor, validateAnswers, type JudgmentCall, type JudgmentAnswer } from './advisor';

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
  it('confidently matches only when all tokens matched AND at least 2 matched', async () => {
    const [a] = await naiveAdvisor.choose([
      call('c1', 'Stage 3 piano "Silver Grand Something"', ['Grand']),
    ]);
    expect(a.optionId).toBe('Grand');
    expect(a.confidence).toBe('medium'); // single generic token → medium, not high
  });
  it('returns high confidence when all tokens match and count >= 2', async () => {
    const [a] = await naiveAdvisor.choose([
      call('c1', 'Stage 2 piano "Royal Grand 3D"', ['Royal Grand 3D']),
    ]);
    expect(a.optionId).toBe('Royal Grand 3D');
    expect(a.confidence).toBe('high'); // all 3 tokens matched
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
  it('discards answers with undefined optionId', () => {
    const out = validateAnswers(calls, [
      { id: 'c1', optionId: undefined, confidence: 'medium', rationale: 'uncertain' } as unknown as JudgmentAnswer,
    ]);
    expect(out[0].optionId).toBeNull();
    expect(out[0].confidence).toBe('low');
  });
  it('deduplicates answers with the same id', () => {
    const out = validateAnswers(calls, [
      { id: 'c1', optionId: 'a', confidence: 'high', rationale: 'first' },
      { id: 'c1', optionId: 'b', confidence: 'low', rationale: 'second' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('c1');
  });
  it('excludes answers whose id matches no call', () => {
    const out = validateAnswers(calls, [
      { id: 'c1', optionId: 'a', confidence: 'high', rationale: 'valid' },
      { id: 'c2', optionId: 'x', confidence: 'high', rationale: 'orphaned' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('c1');
  });
});
