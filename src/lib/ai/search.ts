import type { NS4Program } from '../ns4/types';

/**
 * AI-native search over a set of parsed programs.
 *
 * Provider-pluggable behind {@link ProgramRanker}. Ships a zero-config naive
 * ranker so the app works offline/out-of-the-box; the real implementation calls
 * an LLM (default: Claude) to rank by meaning, not keywords — e.g. "warm Rhodes
 * with tape echo" should surface EP patches with modulation/delay even if those
 * exact words aren't present. Swap the ranker without touching the UI.
 */

export interface ProgramRanker {
  rank(query: string, programs: NS4Program[]): Promise<NS4Program[]>;
}

/** A searchable text blob for a program (expand as more fields are decoded). */
function programText(p: NS4Program): string {
  const layerText = (p.layers ?? []).flatMap((l) => [
    l.oscType,
    l.oscCategory,
    l.sample?.name,
    l.sample?.categoryName,
    l.filter?.type,
    l.reverb?.type,
  ]);
  return [p.name, p.category, ...layerText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Naive keyword ranker — no network, no config. Good enough to start. */
export const naiveRanker: ProgramRanker = {
  async rank(query, programs) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return [...programs]
      .map((p) => {
        const text = programText(p);
        const score = terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
  },
};

/**
 * LLM-backed ranker (default provider: Claude). Sketch — wire up once a backend
 * exists to keep the API key off the client. Default to a cheap, fast model for
 * search (e.g. Claude Haiku) and a stronger one for generation/explanation.
 *
 * Example (server side):
 *   import { anthropic } from '@ai-sdk/anthropic';
 *   import { generateText } from 'ai';
 *   const { text } = await generateText({
 *     model: anthropic('claude-haiku-4-5'),
 *     prompt: buildRankingPrompt(query, programs),
 *   });
 *
 * Keep it behind this interface so contributors can swap providers freely.
 */
export function createLlmRanker(): ProgramRanker {
  return {
    async rank() {
      throw new Error('LLM ranker not implemented yet — see src/lib/ai/search.ts. Use naiveRanker for now.');
    },
  };
}
