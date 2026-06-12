/**
 * Turn a raw parameter integer into its human-readable value, where we have a
 * (validated) enum table for it. Returns null when no table applies — the caller
 * falls back to the raw integer.
 *
 * Coverage so far: discrete enums (piano/filter/LFO type, modes, on/off, …),
 * all validated against the regression fixture. Formula/dependent interpreters
 * (dB, Hz, BPM, envelope times, synth category/wave) are future work (FORMAT.md).
 */

import { ENUM_TABLES, PARAM_TABLE } from './interpret.generated';

/** Base parameter name (no " [A]" layer suffix). */
export function interpretValue(paramName: string, rawval: number): string | null {
  const table = PARAM_TABLE[paramName];
  if (!table) return null;
  return ENUM_TABLES[table]?.[rawval] ?? null;
}
