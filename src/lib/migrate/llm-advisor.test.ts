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
});
