import type { NS4Layer, NS4Program } from '../ns4/types';
import { activeLayers } from '../ns4/view';
import { fxTypeName } from '../ns4/fx-names';

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

type Fx = { on?: boolean; mode?: string } | undefined;
/** Each effect slot's on/off and its type code: the mods and amp carry a `mode`, the reverb a `type`. */
const slots = (f: { fxMod1?: Fx; fxMod2?: Fx; ampSimEq?: Fx; reverb?: NS4Layer['reverb'] } | undefined): Fx[] =>
  [f?.fxMod1, f?.fxMod2, f?.ampSimEq, f?.reverb && { on: f.reverb.on, mode: f.reverb.type }];
/** The effects switched on, by code and by name ("cathedral" finds CATH, "chorus" CHOR). */
const effectText = (fx: Fx[]) => fx.filter((f) => f?.on).flatMap((f) =>
  // "off" (an amp slot left as plain EQ) is not an effect to search for.
  f?.mode === 'off' ? [] : [f?.mode, fxTypeName(f?.mode)]);

/** A searchable text blob for a program (expand as more fields are decoded). */
function programText(p: NS4Program): string {
  const layerText = (p.layers ?? []).flatMap((l) => [
    l.oscType,
    l.oscCategory,
    l.sample?.name,
    l.sample?.categoryName,
    l.filter?.type,
  ]);
  // Effects only where they sound: on a layer that plays, and the organ's
  // shared effects only when an organ plays.
  const playing = activeLayers(p);
  const fxText = playing.flatMap((l) => effectText(slots(l)));
  const o = p.organFx;
  const organ = o && { fxMod1: o.mod1, fxMod2: o.mod2, ampSimEq: o.ampSimEq, reverb: o.reverb };
  const organText = playing.some((l) => l.kind === 'organ') ? effectText(slots(organ)) : [];
  return [p.name, p.category, ...layerText, ...fxText, ...organText]
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
