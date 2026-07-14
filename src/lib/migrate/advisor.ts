/**
 * The migration AI seam (spec §advisor): judgment calls — sound matching,
 * ambiguous FX/waveform choices — go through this interface. Same pattern
 * as ProgramRanker (lib/ai/search.ts): a zero-config naive default here; an
 * LLM-backed implementation is injected by the caller (Task 7's
 * createLlmAdvisor). Every answer is validated against the closed option
 * menu before the emitter turns it into edits.
 */

export interface JudgmentOption { id: string; label: string }
export interface JudgmentCall {
  id: string;
  kind: 'piano-sound' | 'sample-sound' | 'fx-type' | 'synth-waveform';
  description: string;
  options: JudgmentOption[];
}
export interface JudgmentAnswer {
  id: string;
  optionId: string | null;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
}
export interface MigrationAdvisor {
  choose(calls: JudgmentCall[]): Promise<JudgmentAnswer[]>;
}

const tokenize = (s: string): string[] =>
  s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((t) => t.length > 1);

export const naiveAdvisor: MigrationAdvisor = {
  async choose(calls) {
    return calls.map((c) => {
      const src = new Set(tokenize(c.description));
      let best: { id: string; score: number; matchedCount: number } | null = null;
      for (const o of c.options) {
        const toks = tokenize(o.label);
        const matchedCount = toks.reduce((s, t) => s + (src.has(t) ? 1 : 0), 0);
        const score = matchedCount / Math.max(toks.length, 1);
        if (score > 0 && (!best || score > best.score)) best = { id: o.id, score, matchedCount };
      }
      let confidence: 'high' | 'medium' | 'low';
      if (!best) {
        confidence = 'low';
      } else if (best.score >= 0.99 && best.matchedCount >= 2) {
        confidence = 'high';
      } else {
        confidence = 'medium';
      }
      return {
        id: c.id,
        optionId: best ? best.id : null,
        confidence,
        rationale: best ? 'closest name match' : 'no similar option found',
      } satisfies JudgmentAnswer;
    });
  },
};

export function validateAnswers(calls: JudgmentCall[], answers: JudgmentAnswer[]): JudgmentAnswer[] {
  const byId = new Map<string, JudgmentAnswer>(answers.map((a) => [a.id, a]));
  return calls.map((c) => {
    const a = byId.get(c.id);
    if (a && (a.optionId === null || c.options.some((o) => o.id === a.optionId))) return a;
    return { id: c.id, optionId: null, confidence: 'low', rationale: a ? 'invalid answer discarded' : 'no answer' };
  });
}
