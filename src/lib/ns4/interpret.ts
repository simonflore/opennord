/**
 * Turn a raw parameter integer into its human-readable value.
 *
 * Two sources, both ported from ns4decode (Randy, MIT — THIRD_PARTY_LICENSES.md)
 * and validated against the regression fixture:
 *   1. GENERATED_VALUES — exhaustive per-parameter tables produced by evaluating
 *      ns4decode's real interpreter over every raw value (numeric + enum). 202 params.
 *   2. ENUM_TABLES/PARAM_TABLE — the hand-curated enum fallback (by name).
 *
 * Returns null when nothing applies (caller shows the raw integer). Dependent
 * params (morphs, synth category/wave, timbre, drawbars, rate-vs-clock, sample
 * names) are not covered yet and fall through to raw.
 */

import { ENUM_TABLES, PARAM_TABLE } from './interpret.generated';
import { GENERATED_VALUES } from './values.generated';

export function interpretValue(paramId: string, paramName: string, rawval: number): string | null {
  const exact = GENERATED_VALUES[paramId]?.[rawval];
  if (exact !== undefined) return exact;
  const table = PARAM_TABLE[paramName];
  if (table) return ENUM_TABLES[table]?.[rawval] ?? null;
  return null;
}
