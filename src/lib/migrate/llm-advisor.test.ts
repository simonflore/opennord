import { describe, expect, it } from 'vitest';
import { createLlmAdvisor } from './llm-advisor';
import type { JudgmentCall } from './advisor';

const calls: JudgmentCall[] = [{
  id: 'c1', kind: 'piano-sound',
  description: 'Stage 2 piano "Wurlitzer 200A" (Electric)',
  options: [{ id: 'p1', label: 'EP1 Wurly Amped' }, { id: 'p2', label: 'White Grand' }],
}];

describe('createLlmAdvisor', () => {
  it('uses valid JSON answers', async () => {
    const adv = createLlmAdvisor(async () =>
      JSON.stringify([{ id: 'c1', optionId: 'p1', confidence: 'high', rationale: 'same instrument family' }]));
    const [a] = await adv.choose(calls);
    expect(a.optionId).toBe('p1');
    expect(a.rationale).toBe('same instrument family');
  });

  it('nulls out out-of-menu picks', async () => {
    const adv = createLlmAdvisor(async () =>
      JSON.stringify([{ id: 'c1', optionId: 'nope', confidence: 'high', rationale: 'x' }]));
    const [a] = await adv.choose(calls);
    expect(a.optionId).toBeNull();
  });

  it('falls back to naive matching on garbage text', async () => {
    const adv = createLlmAdvisor(async () => 'sorry, I cannot help with that right now.');
    const [a] = await adv.choose(calls);
    expect(a).toBeDefined();
    expect(a.id).toBe('c1');
    // naiveAdvisor token-matches "Wurlitzer" description against "EP1 Wurly Amped" — no exact overlap,
    // so naiveAdvisor itself would return null; the key behavior under test is "no exception, valid answer shape".
    expect(a.optionId === null || calls[0].options.some((o) => o.id === a.optionId)).toBe(true);
  });

  it('falls back to naive matching when generate throws, no exception escapes', async () => {
    const adv = createLlmAdvisor(async () => { throw new Error('offline'); });
    const [a] = await adv.choose(calls);
    expect(a).toBeDefined();
    expect(a.id).toBe('c1');
  });

  it('parses JSON embedded in prose', async () => {
    const adv = createLlmAdvisor(async () =>
      `Here are my picks: [{"id":"c1","optionId":"p1","confidence":"medium","rationale":"close enough"}] hope that helps`);
    const [a] = await adv.choose(calls);
    expect(a.optionId).toBe('p1');
    expect(a.rationale).toBe('close enough');
  });

  it('prefers the last valid JSON array when multiple are present', async () => {
    const adv = createLlmAdvisor(async () =>
      `draft thinking: [{"id":"c1","optionId":"p2","confidence":"low","rationale":"first attempt"}] ` +
      `final answer: [{"id":"c1","optionId":"p1","confidence":"high","rationale":"correct choice"}]`);
    const [a] = await adv.choose(calls);
    expect(a.optionId).toBe('p1');
    expect(a.rationale).toBe('correct choice');
  });

  it('ignores non-conforming bracket noise before the real array', async () => {
    const adv = createLlmAdvisor(async () =>
      `see [1] and [2,3]: relevant answer: [{"id":"c1","optionId":"p1","confidence":"high","rationale":"matches description"}]`);
    const [a] = await adv.choose(calls);
    expect(a.optionId).toBe('p1');
    expect(a.rationale).toBe('matches description');
  });

  it('parses when a rationale contains balanced brackets, e.g. "see [p1] and [p2]"', async () => {
    const adv = createLlmAdvisor(async () =>
      JSON.stringify([{ id: 'c1', optionId: 'p1', confidence: 'high', rationale: 'see [p1] and [p2]' }]));
    const [a] = await adv.choose(calls);
    expect(a.optionId).toBe('p1');
    expect(a.rationale).toBe('see [p1] and [p2]');
  });

  it('parses when a rationale contains a lone closing bracket', async () => {
    const adv = createLlmAdvisor(async () =>
      '[{"id":"c1","optionId":"p1","confidence":"high","rationale":"see footnote ]"}]');
    const [a] = await adv.choose(calls);
    expect(a.optionId).toBe('p1');
    expect(a.rationale).toBe('see footnote ]');
  });

  it('parses a multi-entry array when one rationale contains a lone opening bracket', async () => {
    const twoCalls: JudgmentCall[] = [
      calls[0],
      {
        id: 'c2', kind: 'piano-sound',
        description: 'Stage 2 piano "Grand" (Acoustic)',
        options: [{ id: 'p3', label: 'White Grand' }],
      },
    ];
    const adv = createLlmAdvisor(async () =>
      JSON.stringify([
        { id: 'c1', optionId: 'p1', confidence: 'high', rationale: 'fits better than [p2' },
        { id: 'c2', optionId: 'p3', confidence: 'medium', rationale: 'closest acoustic match' },
      ]));
    const answers = await adv.choose(twoCalls);
    expect(answers).toHaveLength(2);
    const a1 = answers.find((a) => a.id === 'c1');
    const a2 = answers.find((a) => a.id === 'c2');
    expect(a1?.optionId).toBe('p1');
    expect(a1?.rationale).toBe('fits better than [p2');
    expect(a2?.optionId).toBe('p3');
    expect(a2?.rationale).toBe('closest acoustic match');
  });
});
