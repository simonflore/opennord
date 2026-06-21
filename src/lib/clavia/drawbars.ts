/**
 * Shared organ-drawbar presentation helpers. The footage legend and B3 tab colors
 * are Hammond-standard (the same nine pipe lengths/colors on every B3-style organ
 * across the Nord line), so they live here, not per-model.
 */
import type { DrawbarView, DrawbarColor } from './engine-view';

/** B3 drawbar footage labels, 16′ down to 1′. Vox/Farfisa relabel for display. */
export const B3_FOOTAGE = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'];

/** Classic Hammond drawbar tab colors, left→right. */
export const B3_COLORS: DrawbarColor[] = [
  'brown', 'brown', 'white', 'white', 'black', 'white', 'black', 'black', 'white',
];

/** Build a DrawbarStack view from raw 0-8 levels, with optional footage labels. */
export function drawbarViews(levels: number[], footage?: readonly (string | undefined)[]): DrawbarView[] {
  return levels.map((level, i) => ({
    level,
    label: String(level),
    color: 'default',
    footage: footage?.[i],
  }));
}

/** B3 drawbars with footage + Hammond colors (no morph — for models without morph, e.g. ns3). */
export function b3DrawbarViews(levels: number[]): DrawbarView[] {
  return levels.map((level, i) => ({
    level,
    label: String(level),
    color: B3_COLORS[i] ?? 'default',
    footage: B3_FOOTAGE[i],
  }));
}
