/**
 * Per-model body-decode status — the dedup map so contributors target models that
 * still need work instead of re-deriving what's already decoded.
 *
 * Only Stage 4 has a complete parameter map (the ns4decode-derived offset map, our
 * oracle). Stage 3 has a partial hand-built decoder. Every other model's body is
 * undecoded — that's what the capture tool exists to fill. We always know the
 * body *size* (bytes) from any file, but the parameter *list* only where decoded.
 */
import { NS4_OFFSET_MAP } from '../ns4/offset-map.generated';

export type DecodeStatus = 'full' | 'partial' | 'none';

export interface ModelDecode {
  status: DecodeStatus;
  /** Decoded parameter count where we have a full map, else null. */
  paramCount: number | null;
}

/** Distinct parameters in the Stage 4 map (each id may span multiple layers). */
export const NS4_PARAM_COUNT = new Set(NS4_OFFSET_MAP.map((p) => p.id)).size;

// Keyed by model id (clavia/partitions.ts). Absent → 'none'.
const STATUS_BY_ID: Record<string, DecodeStatus> = {
  'stage-4': 'full',
  'stage-3': 'partial',
};

export function decodeForModel(modelId: string): ModelDecode {
  const status = STATUS_BY_ID[modelId] ?? 'none';
  return { status, paramCount: status === 'full' ? NS4_PARAM_COUNT : null };
}

export const DECODE_LABEL: Record<DecodeStatus, string> = {
  full: 'Fully decoded',
  partial: 'Partly decoded',
  none: 'Not decoded yet — your captures build this',
};
