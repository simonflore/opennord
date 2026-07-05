import { naiveAdvisor, validateAnswers, type JudgmentAnswer, type JudgmentCall, type MigrationAdvisor } from './advisor';

/**
 * LLM-backed migration advisor — injectable text generator, no provider
 * wiring in this repo.
 *
 * Same pattern as {@link createLlmRanker} in `src/lib/ai/search.ts`: the real
 * `generate` function (Claude via `@ai-sdk/anthropic`, server-side key,
 * metered) is a commercial `opennord-backend` capability. This repo ships
 * only the seam — prompt builder + strict JSON response parser + fallback —
 * fully testable with a stubbed `generate`. No API key path, no BYOK UI, no
 * `@ai-sdk/*`/`ai` import here. The UI (Task 9) uses `naiveAdvisor`
 * unconditionally until the backend capability seam lands; `createLlmAdvisor`
 * is what that seam will inject once it exists.
 */

/** Builds the prompt: each call's description + its numbered, id-tagged options. */
function buildPrompt(calls: JudgmentCall[]): string {
  const callBlocks = calls.map((c) => {
    const optionLines = c.options
      .map((o, i) => `  ${i + 1}. [${o.id}] ${o.label}`)
      .join('\n');
    return `- id: ${c.id}\n  description: ${c.description}\n  options:\n${optionLines}`;
  }).join('\n');

  return [
    'You are helping migrate synthesizer/keyboard patches between Nord models.',
    'For each judgment call below, pick the option that best matches the description.',
    '',
    callBlocks,
    '',
    'Respond with ONLY a strict JSON array, no prose, in this exact shape:',
    '[{"id": string, "optionId": string | null, "confidence": "high" | "medium" | "low", "rationale": string}]',
    '- "id" must match the call id.',
    '- "optionId" must be one of the option ids listed for that call, or null if none fit.',
    '- "rationale" is one sentence explaining the pick.',
    'Include exactly one entry per judgment call.',
  ].join('\n');
}

/** Extracts the first top-level `[...]` JSON array substring from free-form text. */
function extractJsonArray(text: string): string | null {
  const start = text.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

const CONFIDENCE_VALUES = new Set(['high', 'medium', 'low']);

/** Defensively coerces a parsed JSON value into `JudgmentAnswer[]`, dropping malformed entries. */
function coerceAnswers(parsed: unknown): JudgmentAnswer[] {
  if (!Array.isArray(parsed)) return [];
  const answers: JudgmentAnswer[] = [];
  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string') continue;
    if (e.optionId !== null && typeof e.optionId !== 'string') continue;
    if (typeof e.confidence !== 'string' || !CONFIDENCE_VALUES.has(e.confidence)) continue;
    if (typeof e.rationale !== 'string') continue;
    answers.push({
      id: e.id,
      optionId: e.optionId,
      confidence: e.confidence as JudgmentAnswer['confidence'],
      rationale: e.rationale,
    });
  }
  return answers;
}

/**
 * Creates a {@link MigrationAdvisor} backed by an injected text generator.
 * `generate` is expected to call an LLM and return its raw text response;
 * this function never imports a provider itself. Any failure — the
 * generator throwing, an unparseable response, or malformed JSON — falls
 * back to {@link naiveAdvisor} for the affected calls. `choose()` never
 * throws.
 */
export function createLlmAdvisor(generate: (prompt: string) => Promise<string>): MigrationAdvisor {
  const fallback = async (calls: JudgmentCall[]): Promise<JudgmentAnswer[]> =>
    validateAnswers(calls, await naiveAdvisor.choose(calls));

  return {
    async choose(calls: JudgmentCall[]): Promise<JudgmentAnswer[]> {
      let raw: string;
      try {
        raw = await generate(buildPrompt(calls));
      } catch {
        return fallback(calls);
      }

      const jsonText = extractJsonArray(raw);
      if (jsonText === null) return fallback(calls);

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        return fallback(calls);
      }

      const answers = coerceAnswers(parsed);
      if (answers.length === 0 && calls.length > 0) return fallback(calls);

      return validateAnswers(calls, answers);
    },
  };
}
