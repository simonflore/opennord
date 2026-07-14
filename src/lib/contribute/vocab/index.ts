import type { ControlVocabItem } from '../types';
import { NS4_VOCAB } from './ns4';
import { ELECTRO_VOCAB } from './electro';
import { LEAD_VOCAB } from './lead';
import { WAVE_VOCAB } from './wave';
import { PIANO_VOCAB } from './piano';

// Keyed by program file-tag (clavia/partitions.ts). A model without an entry
// falls back to free-form labeling — correct, just less guided.
const BY_TAG: Record<string, ControlVocabItem[]> = {
  ns4p: NS4_VOCAB,
  ne4p: ELECTRO_VOCAB,
  ne5p: ELECTRO_VOCAB,
  ne6p: ELECTRO_VOCAB,
  nl4p: LEAD_VOCAB,
  nw2p: WAVE_VOCAB,
  np2p: PIANO_VOCAB,
  np3p: PIANO_VOCAB,
  np4p: PIANO_VOCAB,
  np5p: PIANO_VOCAB,
  np6p: PIANO_VOCAB,
  ng2p: PIANO_VOCAB,
};

/** Curated controls for a model's labeling dropdown ([] = free-form only). */
export function vocabForTag(tag: string): ControlVocabItem[] {
  return BY_TAG[tag] ?? [];
}
