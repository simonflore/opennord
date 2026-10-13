/**
 * Morph targets of an effect setting, shared by the decoders whose layout stores
 * one delta per morph source next to the value (`<key>.morphWheel` …). Pure;
 * takes the model's own field reader, so no model imports.
 */
import type { MorphMarkView } from './engine-view';

const MORPH_SOURCES = [['wheel', 'morphWheel'], ['at', 'morphAfterTouch'], ['pedal', 'morphCtrlPedal']] as const;

/** Where the morph sources take `key`: its value plus each non-zero delta, clamped to 0…max and shown by `show`. */
export function morphTargets(
  read: (key: string) => number, key: string, max: number, show: (v: number) => string,
): MorphMarkView | undefined {
  const value = read(key);
  const m: MorphMarkView = {};
  for (const [source, suffix] of MORPH_SOURCES) {
    const delta = read(`${key}.${suffix}`);
    if (delta) m[source] = show(Math.max(0, Math.min(max, value + delta)));
  }
  return Object.keys(m).length ? m : undefined;
}

/** A setting each source either switches to `target` (flag 1) or leaves alone. */
export function switchedBy(flags: Record<keyof MorphMarkView, number>, target: string): MorphMarkView | undefined {
  const m: MorphMarkView = {};
  for (const [source] of MORPH_SOURCES) if (flags[source] === 1) m[source] = target;
  return Object.keys(m).length ? m : undefined;
}
