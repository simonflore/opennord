/**
 * Shared organ-drawbar presentation helpers. The footage legend is Hammond-
 * standard (the same nine pipe lengths on every B3-style organ across the Nord
 * line), so it lives here, not per-model.
 */
import type { DrawbarView } from '../ns4/view';

/** B3 drawbar footage labels, 16′ down to 1′. Vox/Farfisa relabel for display. */
export const B3_FOOTAGE = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'];

/** Build a DrawbarStack view from raw 0-8 levels, with optional footage labels. */
export function drawbarViews(levels: number[], footage?: readonly (string | undefined)[]): DrawbarView[] {
  return levels.map((level, i) => ({
    level,
    label: String(level),
    color: 'default',
    footage: footage?.[i],
  }));
}
