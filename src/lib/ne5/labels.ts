/**
 * Electro 5 display labels. Index = stored value.
 *
 * The OS 2.04 containers give each field's range, not its value texts, so these
 * orders are inferred (medium): the organ models follow the Electro 6 table
 * (B3, Vox, Farfisa, Pipe1, Pipe2, then B3 Bass, which the Electro 5 lacks) —
 * five values for the Electro 5's 0–4 range, the two pipe organs sharing the
 * Church sound set; the piano types are fw-present's COLDFIRE_PIANO_TYPES.
 */
import type { Ne5OrganType } from './types';

/** Organ Model (common, 0–4) — order inferred from the Electro 6 table (medium). */
export const NE5_ORGAN_MODELS = ['B3', 'Vox', 'Farfisa', 'Pipe 1', 'Pipe 2'] as const;

/** The sound set each organ model plays. */
export const NE5_ORGAN_SET: readonly Ne5OrganType[] = ['b3', 'vox', 'farf', 'church', 'church'];
