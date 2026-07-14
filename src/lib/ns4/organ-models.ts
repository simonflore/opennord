/**
 * Static, per-model drawbar reference data for the organ panel.
 *
 * This is reference knowledge about the instrument, NOT decoded from the file:
 * the B3 footage labels and the brown/white/black tab coloring are the standard
 * Hammond drawbar layout (see the Nord Stage 4 manual, "Organ" section, and the
 * Hammond B-3 drawbar spec). Only the B3 has a meaningful footage/color layout in
 * OpenNord today; Vox/Farfisa/Pipe render as plain numbered drawbars (null spec).
 */
import type { DrawbarColor } from '../clavia/engine-view';
import { B3_COLORS } from '../clavia/drawbars';

export type { DrawbarColor };

export interface OrganModelSpec {
  /** Footage label per drawbar, left→right (9 entries). */
  footages: string[];
  /** Tab color per drawbar, left→right (9 entries). */
  colors: DrawbarColor[];
}

/** Canonical organ models, for the read-only selector row. */
export const ORGAN_MODELS = ['B3', 'VOX', 'FARF', 'PIPE1', 'PIPE2'] as const;

// Classic Hammond drawbar layout.
const B3_FOOTAGES = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'];

/** Footage/color layout for a model, or null when the model has no special layout. */
export function organModelSpec(model: string | undefined): OrganModelSpec | null {
  if (!model) return null;
  if (model.toUpperCase() === 'B3') return { footages: B3_FOOTAGES, colors: B3_COLORS };
  return null;
}
