import type { ControlVocabItem } from '../types';
import { NS4_VOCAB } from './ns4';

const BY_TAG: Record<string, ControlVocabItem[]> = {
  ns4p: NS4_VOCAB,
};

/** Curated controls for a model's labeling dropdown ([] = free-form only). */
export function vocabForTag(tag: string): ControlVocabItem[] {
  return BY_TAG[tag] ?? [];
}
