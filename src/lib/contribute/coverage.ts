/**
 * Per-model body-decode status — the dedup map so contributors target models that
 * still need work instead of re-deriving what's already decoded.
 *
 * Stage 4 has a complete parameter map (the ns4decode-derived offset map, our
 * oracle). Stage 3 has a partial hand-built decoder. Every other model's progress
 * comes from `coverage-data.ts` — the curated state you maintain as you process
 * contributions. We always know a model's body *size*, so even undecoded models
 * have a concrete target to fill.
 */
import { NS4_OFFSET_MAP } from '../ns4/offset-map.generated';
import { MODEL_PROGRESS, type ModelProgress } from './coverage-data';

export type DecodeStatus = 'full' | 'partial' | 'started' | 'none';

export interface ModelDecode {
  status: DecodeStatus;
  /** Decoded parameter count where we have a full map, else null. */
  paramCount: number | null;
  /** Total body size in bytes, if known. */
  bodyBytes: number | null;
  /** Distinct body bytes localized to a control so far. */
  coveredBytes: number;
  /** Controls localized so far. */
  controlCount: number;
  /** Percent of body bytes covered, if bodyBytes is known. */
  pct: number | null;
}

/** Distinct parameters in the Stage 4 map (each id may span multiple layers). */
export const NS4_PARAM_COUNT = new Set(NS4_OFFSET_MAP.map((p) => p.id)).size;

// Models with a (full/partial) decoder independent of contributions.
const DECODER_BY_ID: Record<string, 'full' | 'partial'> = {
  'stage-4': 'full',
  'stage-3': 'partial',
};

/** Distinct bytes covered + control count + percent for a curated progress entry. */
export function summarizeProgress(p: ModelProgress): { coveredBytes: number; controlCount: number; pct: number | null } {
  const seen = new Set<number>();
  for (const c of p.controls) for (const r of c.ranges) for (let b = r.start; b <= r.end; b++) seen.add(b);
  const coveredBytes = seen.size;
  return {
    coveredBytes,
    controlCount: p.controls.length,
    pct: p.bodyBytes ? Math.round((coveredBytes / p.bodyBytes) * 100) : null,
  };
}

export function decodeForModel(modelId: string): ModelDecode {
  const decoder = DECODER_BY_ID[modelId];
  if (decoder === 'full') {
    return { status: 'full', paramCount: NS4_PARAM_COUNT, bodyBytes: null, coveredBytes: 0, controlCount: NS4_PARAM_COUNT, pct: 100 };
  }
  const prog = MODEL_PROGRESS[modelId];
  const summary = prog ? summarizeProgress(prog) : { coveredBytes: 0, controlCount: 0, pct: null };
  if (decoder === 'partial') {
    return { status: 'partial', paramCount: null, bodyBytes: prog?.bodyBytes ?? null, ...summary };
  }
  // Undecoded: 'started' once contributions have localized a control, else 'none'.
  return {
    status: summary.controlCount > 0 ? 'started' : 'none',
    paramCount: null,
    bodyBytes: prog?.bodyBytes ?? null,
    ...summary,
  };
}

export const DECODE_LABEL: Record<DecodeStatus, string> = {
  full: 'Fully decoded',
  partial: 'Partly decoded',
  started: 'In progress',
  none: 'Not decoded yet — your captures build this',
};
